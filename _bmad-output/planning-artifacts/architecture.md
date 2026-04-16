---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief.md'
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'AccountThai'
user_name: 'Mujahid'
date: '2026-04-15'
---

# Architecture Decision Document — AccountThai

_Collaboratively built architecture for AccountThai — Thai SME Accounting Document Web App._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (by domain):**

| Domain | FR Count | Architectural Impact |
|---|---|---|
| Auth & Authorization | 4 | Session management, tenant isolation (Phase 2) |
| Company Profile | 4 | Per-tenant config, logo storage |
| Contact Management | 4 | Reusable across all 6 document types |
| Document Management | 7 operations × 6 types | Core complex domain — state machine, running numbers |
| PDF Export | 7 | Server-side rendering, Thai fonts, file naming |
| Data Import | 6 | File parsing pipeline, validation, preview |
| Search & History | 7 | Full-text search, filtering, pagination |
| Dashboard & Reports | 7 | Aggregation queries, monthly summaries |
| Google Drive Integration | 5 | OAuth2 flow, async upload queue |

**Non-Functional Requirements (Architecture Drivers):**

| NFR | Decision Driver |
|---|---|
| Page load < 2s | Server-side rendering (Next.js App Router) |
| PDF generation < 3s | Puppeteer via API route, pre-warmed on Vercel |
| Search < 500ms | Indexed queries on Turso + full-text search |
| Thai language support | Thai fonts bundled in PDF layer |
| HTTPS everywhere | Vercel default TLS |
| Tenant data isolation | Row-level tenant_id filtering from Phase 1 |

**Scale & Complexity:**

- Primary domain: Full-stack web application
- Complexity level: **Medium** (clear domain boundaries, no real-time requirements)
- Estimated architectural components: 8 major modules
- Monthly volume: ~100 documents/month (Phase 1), ~1,000/month at 10 tenants (Phase 2)
- PDF files storage: ~100 × avg 200KB = ~20MB/month on Drive (offloaded to Google Drive — no self-hosting needed)

### Technical Constraints & Dependencies

- **Vercel Serverless Limits:** Max 10s function execution — PDF generation must complete within this window. Puppeteer requires `@sparticuz/chromium` for serverless compatibility.
- **Turso Free Tier:** 500MB storage, 1B row reads/month — sufficient for Phase 1-2 scale.
- **Google Drive API:** OAuth2 token refresh must be handled server-side. Rate limits: 1,000 requests/100s per user.
- **Thai Fonts on Server:** Must bundle Sarabun/TH SarabunPSK fonts in the PDF rendering layer.
- **Running Numbers:** Must be atomic at the database level to prevent duplicate numbers across concurrent requests.

### Cross-Cutting Concerns Identified

1. **Tenant Context** — Every database query must scope by `tenant_id` (prepared from Phase 1 even for single user)
2. **Authentication Guard** — All API routes and pages require valid session
3. **Running Number Atomicity** — Use DB-level atomic increment to prevent gaps/duplicates
4. **Error Handling & Logging** — Consistent error format across API routes
5. **File Naming Convention** — Enforced in a shared utility function

---

## Technology Stack Decisions

### Decision 1: Frontend Framework

**Decision:** Next.js 15 (App Router) + TypeScript

**Rationale:**
- Consistent with `az-ultra-family` project (Mujahid's existing expertise)
- Server Components reduce client bundle size for document-heavy pages
- API Routes handle PDF generation and Google Drive integration
- Vercel deployment is first-class

**Alternatives Considered:**
- Remix — similar capability but less ecosystem support
- SPA (React + Vite) — rejected: would require separate API server

---

### Decision 2: Database

**Decision:** Turso (libSQL) + Drizzle ORM

**Rationale:**
- Already chosen by Mujahid and consistent with `az-ultra-family`
- libSQL supports embedded replicas for low-latency reads
- Drizzle ORM provides type-safe queries with zero magic
- Turso's branching is useful for testing

**Schema Design Principles:**
- All tables include `tenant_id TEXT NOT NULL` from the start
- Row-level tenant filtering enforced in every query
- `document_number` has unique constraint per `(tenant_id, doc_type, year, month, number)`

---

### Decision 3: PDF Generation

**Decision:** Puppeteer + `@sparticuz/chromium` (HTML→PDF via API Route)

**Rationale:**
- Easiest to match existing PDF layouts (CSS-based)
- Thai font support via `@font-face` in HTML template
- No external service cost
- Compatible with Vercel Serverless (with chromium layer)

**PDF Rendering Flow:**
```
API Route /api/documents/[id]/pdf
  → Load document data from DB
  → Render HTML template (React Server Component / string)
  → Launch Puppeteer (chromium)
  → Print to PDF buffer
  → Return PDF as response + trigger Drive upload
```

**Thai Font Strategy:** Bundle `TH Sarabun New` as base64 in CSS, embedded in the HTML template.

**Alternatives Considered:**
- `@react-pdf/renderer` — Thai font support is complex, no CSS layout
- `jsPDF` — minimal, but poor table/layout support for Thai documents
- External service (Doppio, HTMLcss.to) — cost + latency

---

### Decision 4: Authentication

**Decision:** Better Auth (self-hosted, Turso adapter)

**Rationale:**
- Native Turso/libSQL adapter
- Supports multi-tenant organizations (Phase 2 ready)
- Session management built in
- Email/password + future OAuth providers

**Session Pattern:**
```
Session → User → Organization (tenant)
All API routes: getServerSession() → extract tenant_id → scope queries
```

---

### Decision 5: Google Drive Integration

**Decision:** Google Drive API v3 via `googleapis` npm package

**Rationale:**
- Mujahid already has Google Cloud Project + OAuth credentials
- Server-side OAuth flow (no client exposure)
- Upload as background task after PDF generation

**OAuth Token Storage:** Store refresh token encrypted in Turso `integrations` table, per tenant.

**Upload Flow:**
```
Document created/exported
  → PDF buffer generated
  → Drive: create folder structure (/{Year}/{Month}/{DocType}/)
  → Upload PDF file with correct filename
  → Store Drive file ID + URL in document record
```

---

### Decision 6: Styling

**Decision:** Tailwind CSS v4

**Rationale:**
- Rapid UI development
- Consistent design system
- Vercel/Next.js native support

---

### Decision 7: File Import

**Decision:** `xlsx` (SheetJS) for Excel/CSV + custom validation pipeline

**Rationale:**
- Most popular Excel parsing library
- CSV fallback built-in
- Phase 2: PDF import via AI extraction (deferred)

**Import Pipeline:**
```
Upload file (multipart)
  → Parse with xlsx → raw row array
  → Column mapping UI (user maps columns)
  → Row validation (required fields, types)
  → Preview table (accept/reject rows)
  → Bulk insert documents
```

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Next.js 15 App                               │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ App Router  │  │  API Routes │  │    Server Actions         │ │
│  │  (Pages)    │  │ /api/...    │  │  (mutations)              │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘ │
│         │                │                     │                  │
│  ┌──────▼──────────────────────────────────────▼───────────────┐ │
│  │                   Service Layer                               │ │
│  │  DocumentService │ PDFService │ DriveService │ ImportService │ │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                     │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                   Data Access Layer (Drizzle ORM)           │  │
│  │         All queries scoped by tenant_id                    │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
   ┌──────▼──────┐   ┌────────▼───────┐  ┌───────▼────────┐
   │   Turso DB   │   │  Google Drive  │  │  Vercel Blob   │
   │  (libSQL)    │   │  (PDF backup)  │  │ (logo uploads) │
   └─────────────┘   └────────────────┘  └────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- Tenants (Organizations)
tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  branch TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at INTEGER
)

-- Users
users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  role TEXT NOT NULL DEFAULT 'owner',  -- owner | editor | viewer
  created_at INTEGER
)

-- Contacts (customers/vendors)
contacts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  branch TEXT,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL,  -- customer | vendor | both
  created_at INTEGER,
  updated_at INTEGER
)

-- Document Running Numbers (atomic counter)
document_sequences (
  tenant_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,   -- INV | EXP | WT | QT | BL | RE
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, doc_type, year, month)
)

-- Documents (single table, polymorphic by doc_type)
documents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,          -- INV | EXP | WT | QT | BL | RE
  doc_number TEXT NOT NULL,        -- e.g., INV2026030001
  status TEXT NOT NULL DEFAULT 'draft',  -- draft | issued | paid | void
  date INTEGER NOT NULL,           -- Unix timestamp
  due_date INTEGER,
  contact_id TEXT REFERENCES contacts(id),
  contact_snapshot TEXT,           -- JSON snapshot at time of creation
  line_items TEXT NOT NULL,        -- JSON array
  subtotal REAL NOT NULL DEFAULT 0,
  vat_amount REAL NOT NULL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  withholding_tax REAL,
  notes TEXT,
  metadata TEXT,                   -- JSON for doc-type specific fields
  pdf_url TEXT,                    -- Vercel Blob URL (temporary)
  drive_file_id TEXT,              -- Google Drive file ID
  drive_url TEXT,                  -- Google Drive URL
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(tenant_id, doc_number)
)

-- Google Drive Integration Settings
drive_integrations (
  tenant_id TEXT PRIMARY KEY,
  access_token TEXT,               -- encrypted
  refresh_token TEXT,              -- encrypted
  token_expiry INTEGER,
  root_folder_id TEXT,
  connected_at INTEGER
)
```

---

## API Route Structure

```
/api/
├── auth/                    # Better Auth endpoints
├── documents/
│   ├── GET    /             # List documents (with filters)
│   ├── POST   /             # Create document
│   ├── GET    /[id]         # Get document
│   ├── PATCH  /[id]         # Update document
│   ├── DELETE /[id]         # Soft-delete document
│   ├── POST   /[id]/void    # Void document
│   └── GET    /[id]/pdf     # Generate & download PDF
├── contacts/
│   ├── GET    /             # List contacts
│   ├── POST   /             # Create contact
│   ├── PATCH  /[id]         # Update contact
│   └── DELETE /[id]         # Delete contact
├── import/
│   └── POST   /             # Upload and parse Excel/CSV
├── drive/
│   ├── GET    /auth         # Initiate OAuth
│   ├── GET    /callback     # OAuth callback
│   └── POST   /upload/[id]  # Manual re-upload
└── reports/
    └── GET    /monthly      # Monthly summary data
```

---

## Folder Structure

```
accountthai/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/        # Phase 2
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── documents/
│   │   │   │   ├── page.tsx     # All documents list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx # Create document (type selector)
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx # View document
│   │   │   │       └── edit/    # Edit document
│   │   │   ├── contacts/
│   │   │   ├── reports/
│   │   │   ├── import/
│   │   │   └── settings/
│   │   └── api/
│   │       ├── auth/
│   │       ├── documents/
│   │       ├── contacts/
│   │       ├── import/
│   │       ├── drive/
│   │       └── reports/
│   ├── components/
│   │   ├── documents/
│   │   │   ├── forms/           # Per-type form components
│   │   │   ├── pdf-templates/   # HTML templates for PDF
│   │   │   └── DocumentCard.tsx
│   │   ├── ui/                  # Shared UI components
│   │   └── layout/
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema
│   │   ├── index.ts             # DB client
│   │   └── queries/             # Typed query functions
│   ├── lib/
│   │   ├── auth.ts              # Better Auth config
│   │   ├── pdf.ts               # Puppeteer PDF generation
│   │   ├── drive.ts             # Google Drive service
│   │   ├── import.ts            # Excel/CSV parser
│   │   ├── doc-number.ts        # Running number generator
│   │   └── utils.ts
│   ├── actions/                 # Server Actions
│   └── types/
├── public/
│   └── fonts/                   # TH Sarabun bundled
├── docs/
│   └── exsample/                # PDF reference templates
└── _bmad-output/
```

---

## Critical Implementation Patterns

### Pattern 1: Atomic Document Number Generation

```typescript
// Never use MAX(doc_number) + 1 — race condition risk
// Use atomic UPDATE with RETURNING

async function getNextDocNumber(
  tenantId: string,
  docType: DocType,
  year: number,
  month: number
): Promise<string> {
  const result = await db
    .insert(documentSequences)
    .values({ tenantId, docType, year, month, lastNumber: 1 })
    .onConflictDoUpdate({
      target: [documentSequences.tenantId, documentSequences.docType, 
               documentSequences.year, documentSequences.month],
      set: { lastNumber: sql`${documentSequences.lastNumber} + 1` }
    })
    .returning({ lastNumber: documentSequences.lastNumber });

  const num = result[0].lastNumber;
  const mm = String(month).padStart(2, '0');
  const nnnn = String(num).padStart(4, '0');
  return `${docType}${year}${mm}${nnnn}`;
}
```

### Pattern 2: Tenant Context Guard

```typescript
// middleware.ts — protect all dashboard routes
// Every Server Action / API Route:

async function requireTenant() {
  const session = await auth.getSession();
  if (!session?.user) redirect('/login');
  return { userId: session.user.id, tenantId: session.user.tenantId };
}

// All DB queries MUST include tenant_id:
const docs = await db.query.documents.findMany({
  where: and(
    eq(documents.tenantId, tenantId),  // ALWAYS first
    eq(documents.docType, 'INV')
  )
});
```

### Pattern 3: PDF Generation on Vercel

```typescript
// src/lib/pdf.ts
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
  
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });
  
  await browser.close();
  return Buffer.from(pdf);
}
```

### Pattern 4: Google Drive Folder Structure

```typescript
// Auto-create folder: AccountThai/{Year}/{MM-MonthName}/{DocType}/
async function getOrCreateFolder(
  drive: drive_v3.Drive,
  year: number,
  month: number,
  docType: string,
  rootFolderId: string
): Promise<string> {
  // Traverse/create: root → year → month → docType
  // Cache folder IDs in DB to avoid repeated API calls
}
```

---

## Deployment Configuration

### Vercel Settings

```json
// vercel.json
{
  "functions": {
    "src/app/api/documents/[id]/pdf/route.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Environment Variables

```bash
# Database
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://accountthai.vercel.app

# Google Drive
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://accountthai.vercel.app/api/drive/callback

# Optional: Encryption key for Drive tokens
ENCRYPTION_KEY=...
```

---

## Phase 2 Architecture Changes

When opening to multi-tenant:

1. **Registration flow** — Create new `tenant` + first `user` (owner role)
2. **Tenant isolation** — Already prepared in schema (tenant_id everywhere)  
3. **Per-tenant Google Drive** — Each tenant connects their own Drive account
4. **Billing** — Add `subscriptions` table, gate features by plan
5. **Admin panel** — Separate `/admin` route for platform management

**No breaking schema changes required** — Phase 1 schema is already multi-tenant ready.

---

*Architecture Decision Document v1.0*
*Winston (System Architect) — April 15, 2026*
*Ready for: UX Design → Epics & Stories → Implementation*
