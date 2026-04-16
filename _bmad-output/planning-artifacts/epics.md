---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/product-brief.md'
---

# AccountThai - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for AccountThai, decomposing all 49 Functional Requirements from the PRD, UX Design specifications, and Architecture decisions into implementable, user-value-focused stories.

**7 Epics | 34 Stories | Phase 1 MVP**

---

## Requirements Inventory

### Functional Requirements

FR-AUTH-01: Email/password login
FR-AUTH-02: Session management with secure tokens
FR-COMP-01: Store company information (name, address, tax ID, branch)
FR-COMP-02: Upload company logo for document branding
FR-COMP-03: Configure document running number format per company
FR-CONT-01: CRUD contacts (customers, vendors, partners)
FR-CONT-02: Store contact details: name, address, tax ID, branch
FR-CONT-03: Quick-select contacts when creating documents (autocomplete)
FR-CONT-04: Import contacts from CSV [Nice to Have]
FR-DOC-01: Create new document (any of 6 types: INV, EXP, WT, QT, BL, RE)
FR-DOC-02: Edit draft documents
FR-DOC-03: Delete documents (soft delete)
FR-DOC-04: Duplicate existing document
FR-DOC-05: Convert between types (QT → BL → RE)
FR-DOC-06: Void/Cancel documents with reason
FR-DOC-07: Document status workflow (Draft → Issued → Paid/Void)
FR-PDF-01: Generate PDF for any document type
FR-PDF-02: PDF includes company logo, letterhead, contact info
FR-PDF-03: Thai text support (Thai fonts — TH Sarabun)
FR-PDF-04: Amount in Thai Baht text (หนึ่งพันบาทถ้วน)
FR-PDF-05: Filename format: {Company}_{DocNumber}_{Partner}.pdf
FR-PDF-07: PDF preview before download (no FR-PDF-06 batch in Phase 1)
FR-IMP-01: Import data from Excel (.xlsx) files
FR-IMP-02: Import data from CSV files
FR-IMP-04: Column mapping UI for flexible imports
FR-IMP-05: Import validation with error reporting
FR-IMP-06: Preview before confirming import
FR-SRCH-01: Full-text search across all documents
FR-SRCH-02: Filter by document type
FR-SRCH-03: Filter by date range
FR-SRCH-04: Filter by partner/contact
FR-SRCH-05: Filter by status
FR-SRCH-06: Sort by date, amount, document number
FR-SRCH-07: Pagination for large result sets
FR-DASH-01: Monthly summary by document type
FR-DASH-02: Total income vs expenses overview
FR-DASH-03: Recent documents list
FR-DASH-04: Outstanding invoices (unpaid)
FR-DASH-05: VAT summary for tax filing
FR-DASH-07: Export summary reports to Excel/CSV
FR-GDRIVE-01: OAuth2 connection to Google Drive
FR-GDRIVE-02: Auto-upload PDF on document creation
FR-GDRIVE-03: Folder structure: /{Year}/{Month}/{DocType}/
FR-GDRIVE-04: Manual re-upload/sync option
FR-GDRIVE-05: Drive folder link stored per document

### NonFunctional Requirements

NFR-01: Page load < 2 seconds
NFR-02: PDF generation < 3 seconds per document
NFR-03: Search results returned < 500ms
NFR-04: HTTPS everywhere (Vercel default TLS)
NFR-05: Encrypted passwords (bcrypt via Better Auth)
NFR-06: CSRF protection
NFR-07: Input validation and sanitization on all forms
NFR-08: Tenant data isolation (tenant_id on all tables from Phase 1)
NFR-09: UI language: Thai (primary)
NFR-10: Currency: Thai Baht (฿), formatted Thai-style
NFR-11: Date format: DD/MM/YYYY
NFR-12: Chrome/Safari/Firefox (latest 2 versions)
NFR-13: Mobile responsive design
NFR-14: Daily database backup
NFR-15: Google Drive as secondary document backup

### Additional Requirements

From Architecture:
- Project uses Next.js 15 (App Router) + TypeScript — greenfield setup required in Epic 1 Story 1
- Database: Turso (libSQL) + Drizzle ORM — schema migrations per feature
- Auth: Better Auth with Turso adapter — sessions, organizations table for Phase 2
- PDF: Puppeteer + @sparticuz/chromium — requires vercel.json memory/timeout config
- Charting: recharts library for dashboard bar chart (noted in readiness report)
- Drive tokens: Encrypted with node:crypto AES-256 + ENCRYPTION_KEY env var
- Atomic running numbers: INSERT ... ON CONFLICT DO UPDATE SET last_number = last_number + 1
- File storage: Vercel Blob for company logos
- Styling: Tailwind CSS v4 + shadcn/ui components
- xlsx (SheetJS) for both import AND export (Excel)

### UX Design Requirements

UX-DR-01: Global layout with collapsible sidebar (240px) and main content area
UX-DR-02: Document type selector modal (6 cards with icon + Thai name) for new document creation
UX-DR-03: Contact search CommandInput (shadcn/ui Command) with autocomplete and "Add new contact" option
UX-DR-04: Live VAT calculation (subtotal, VAT 7%, total update as user types — no button)
UX-DR-05: Document number display in monospace with read-only lock icon and tooltip
UX-DR-06: Status badges: Draft (Gray) / Issued (Blue) / Paid (Green) / Void (Red) — Thai labels
UX-DR-07: Google Drive status icon per document: ☁️✓ (uploaded) / ☁️⟳ (uploading) / ☁️✕ (failed)
UX-DR-08: Toast notifications for success/error (shadcn/ui Toast)
UX-DR-09: PDF preview modal (iframe) before download — must show before "Issue" action
UX-DR-10: Dashboard with monthly metric cards (income, expenses, VAT, doc count) + bar chart (recharts)
UX-DR-11: Document list as sortable, filterable table with pagination
UX-DR-12: Onboarding wizard (3 steps: company info → Drive connect → done)
UX-DR-13: ⌘K global search shortcut (useEffect + keydown listener)
UX-DR-14: Mobile responsive: sidebar → bottom nav bar (5 icons) on < 640px
UX-DR-15: Sarabun (Google Fonts) for all UI + JetBrains Mono for document numbers/amounts
UX-DR-16: AmountInWords component (Thai Baht text: หนึ่งพันบาทถ้วน)

### FR Coverage Map

FR-AUTH-01 → Epic 1 (Authentication & Project Setup)
FR-AUTH-02 → Epic 1 (Authentication & Project Setup)
FR-COMP-01 → Epic 1 (Authentication & Project Setup)
FR-COMP-02 → Epic 1 (Authentication & Project Setup)
FR-COMP-03 → Epic 1 (Authentication & Project Setup)
FR-CONT-01 → Epic 2 (Contact Management)
FR-CONT-02 → Epic 2 (Contact Management)
FR-CONT-03 → Epic 2 (Contact Management)
FR-CONT-04 → Epic 2 (Contact Management)
FR-DOC-01 → Epic 3 (Document Creation & Management)
FR-DOC-02 → Epic 3 (Document Creation & Management)
FR-DOC-03 → Epic 3 (Document Creation & Management)
FR-DOC-04 → Epic 3 (Document Creation & Management)
FR-DOC-05 → Epic 3 (Document Creation & Management)
FR-DOC-06 → Epic 3 (Document Creation & Management)
FR-DOC-07 → Epic 3 (Document Creation & Management)
FR-PDF-01 → Epic 4 (PDF Export)
FR-PDF-02 → Epic 4 (PDF Export)
FR-PDF-03 → Epic 4 (PDF Export)
FR-PDF-04 → Epic 4 (PDF Export)
FR-PDF-05 → Epic 4 (PDF Export)
FR-PDF-07 → Epic 4 (PDF Export)
FR-SRCH-01 → Epic 5 (Search, History & Dashboard)
FR-SRCH-02 → Epic 5 (Search, History & Dashboard)
FR-SRCH-03 → Epic 5 (Search, History & Dashboard)
FR-SRCH-04 → Epic 5 (Search, History & Dashboard)
FR-SRCH-05 → Epic 5 (Search, History & Dashboard)
FR-SRCH-06 → Epic 5 (Search, History & Dashboard)
FR-SRCH-07 → Epic 5 (Search, History & Dashboard)
FR-DASH-01 → Epic 5 (Search, History & Dashboard)
FR-DASH-02 → Epic 5 (Search, History & Dashboard)
FR-DASH-03 → Epic 5 (Search, History & Dashboard)
FR-DASH-04 → Epic 5 (Search, History & Dashboard)
FR-DASH-05 → Epic 5 (Search, History & Dashboard)
FR-DASH-07 → Epic 5 (Search, History & Dashboard)
FR-GDRIVE-01 → Epic 6 (Google Drive Integration)
FR-GDRIVE-02 → Epic 6 (Google Drive Integration)
FR-GDRIVE-03 → Epic 6 (Google Drive Integration)
FR-GDRIVE-04 → Epic 6 (Google Drive Integration)
FR-GDRIVE-05 → Epic 6 (Google Drive Integration)
FR-IMP-01 → Epic 7 (Data Import)
FR-IMP-02 → Epic 7 (Data Import)
FR-IMP-04 → Epic 7 (Data Import)
FR-IMP-05 → Epic 7 (Data Import)
FR-IMP-06 → Epic 7 (Data Import)

---

## Epic List

### Epic 1: Authentication, Project Setup & Company Profile
Users can register, login, set up their company profile, and access the authenticated dashboard.
**FRs covered:** FR-AUTH-01, FR-AUTH-02, FR-COMP-01, FR-COMP-02, FR-COMP-03
**Stories:** 5

### Epic 2: Contact Management
Users can create and manage a reusable contact book (customers and vendors) used across all documents.
**FRs covered:** FR-CONT-01, FR-CONT-02, FR-CONT-03, FR-CONT-04
**Stories:** 3

### Epic 3: Document Creation & Management (All 6 Types)
Users can create, view, edit, duplicate, void, and manage Thai accounting documents across all 6 types.
**FRs covered:** FR-DOC-01 through FR-DOC-07
**Stories:** 9

### Epic 4: PDF Export
Users can generate, preview, and download professional Thai-formatted PDFs from any document.
**FRs covered:** FR-PDF-01, FR-PDF-02, FR-PDF-03, FR-PDF-04, FR-PDF-05, FR-PDF-07
**Stories:** 4

### Epic 5: Search, History & Dashboard
Users get a meaningful dashboard with monthly summaries, can search all documents, filter, sort, and export reports.
**FRs covered:** FR-SRCH-01 to FR-SRCH-07, FR-DASH-01 to FR-DASH-05, FR-DASH-07
**Stories:** 7

### Epic 6: Google Drive Integration
Users can connect their Google Drive and have PDFs automatically backed up in organized folders.
**FRs covered:** FR-GDRIVE-01 to FR-GDRIVE-05
**Stories:** 3

### Epic 7: Data Import
Users can import document data from Excel and CSV files with column mapping, validation, and preview.
**FRs covered:** FR-IMP-01, FR-IMP-02, FR-IMP-04, FR-IMP-05, FR-IMP-06
**Stories:** 3

---

## Epic 1: Authentication, Project Setup & Company Profile

**Goal:** Users can register an account, login securely, complete company profile setup (with logo), and access the main dashboard. The project is fully initialized with all infrastructure.

### Story 1.1: Project Initialization & Core Infrastructure

As a developer,
I want to set up the Next.js 15 project with all required dependencies and infrastructure,
So that the team has a working, deployable foundation to build upon.

**Acceptance Criteria:**

**Given** a new empty directory
**When** the project is initialized
**Then** Next.js 15 App Router + TypeScript is configured
**And** Tailwind CSS v4 + shadcn/ui is installed and configured
**And** Turso DB client (libSQL) + Drizzle ORM is connected
**And** Sarabun + JetBrains Mono fonts are loaded from Google Fonts
**And** vercel.json is configured with PDF function memory: 1024MB, maxDuration: 30s
**And** environment variables are documented in .env.example (TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ENCRYPTION_KEY)
**And** the app deploys successfully to Vercel with no errors

---

### Story 1.2: User Authentication (Login & Session)

As a business owner,
I want to log in with my email and password,
So that I can access my accounting system securely.

**Acceptance Criteria:**

**Given** I am on the /login page
**When** I enter a valid email and password and click login
**Then** Better Auth creates a verified session
**And** I am redirected to the dashboard /
**And** my session persists across page refreshes

**Given** I enter an invalid email or password
**When** I click login
**Then** I see a Thai error message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
**And** I remain on the login page

**Given** I am logged in
**When** I click logout
**Then** my session is destroyed and I am redirected to /login

**And** All auth routes (/login) redirect to dashboard if already authenticated
**And** All dashboard routes redirect to /login if not authenticated (middleware)

---

### Story 1.3: Company Profile Setup

As a business owner,
I want to enter my company's information during first-time setup,
So that it appears correctly on all accounting documents I create.

**Acceptance Criteria:**

**Given** I am logged in for the first time (no company profile)
**When** the onboarding wizard opens at Step 1
**Then** I see fields for: ชื่อบริษัท, เลขประจำตัวผู้เสียภาษี (13 digits), ที่อยู่, สาขา, เบอร์โทร, อีเมล
**And** the `tenants` table is created with tenant_id scoping

**Given** I fill in all required fields and click "ถัดไป"
**When** I submit the form
**Then** the data is saved to the `tenants` table
**And** I proceed to Step 2 of onboarding

**Given** I enter a tax ID that is not 13 digits
**When** I try to proceed
**Then** I see: "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก"

---

### Story 1.4: Company Logo Upload

As a business owner,
I want to upload my company logo,
So that it appears on all generated PDF documents.

**Acceptance Criteria:**

**Given** I am on the company profile page (onboarding or settings)
**When** I click "อัปโหลดโลโก้" and select an image file (JPG/PNG/SVG, max 2MB)
**Then** the logo is uploaded to Vercel Blob
**And** the logo URL is stored in the `tenants.logo_url` field
**And** a preview of the logo is shown immediately

**Given** I upload a file larger than 2MB
**When** I try to submit
**Then** I see: "ไฟล์ต้องมีขนาดไม่เกิน 2MB"

**Given** a logo is already uploaded
**When** I upload a new one
**Then** the old logo is replaced with the new one

---

### Story 1.5: Document Running Number Configuration

As a business owner,
I want to configure the starting running number for each document type,
So that my numbering continues correctly from my previous system.

**Acceptance Criteria:**

**Given** I am on the Settings > เลขที่เอกสาร page
**When** I view the running number configuration
**Then** I see current month/year and next number for each of 6 types (INV, EXP, WT, QT, BL, RE)
**And** the `document_sequences` table is initialized

**Given** I change the starting number for INV from 1 to 50
**When** I save
**Then** the next INV document created gets number INV{YYYY}{MM}0050

**Given** two documents are created simultaneously
**When** both request a running number for the same type/month
**Then** each gets a unique, sequential number (atomic INSERT ON CONFLICT DO UPDATE)

---

## Epic 2: Contact Management

**Goal:** Users can create and manage a reusable directory of customers and vendors, which autocompletes in all document forms.

### Story 2.1: Contact CRUD (Create, View, Edit, Delete)

As a business owner,
I want to add, view, edit, and delete contacts (customers and vendors),
So that I have a reusable address book for my documents.

**Acceptance Criteria:**

**Given** I am on the /contacts page
**When** I click "+ เพิ่มผู้ติดต่อ"
**Then** a form opens with fields: ชื่อ/บริษัท, เลขผู้เสียภาษี, ที่อยู่, สาขา, โทรศัพท์, อีเมล, ประเภท (ลูกค้า/ผู้ขาย/ทั้งคู่)
**And** the `contacts` table is created with tenant_id scoping

**Given** I fill in required fields and save
**When** the form submits
**Then** the contact appears in the contacts list
**And** it is available for autocomplete in document forms

**Given** I click "แก้ไข" on an existing contact
**When** I update and save
**Then** the contact record is updated

**Given** I click "ลบ" on a contact
**When** I confirm deletion
**Then** the contact is soft-deleted (not removed from existing documents)

---

### Story 2.2: Contact Search & Autocomplete in Document Forms

As a business owner,
I want to search and select contacts quickly when creating documents,
So that I don't have to type the same company info repeatedly.

**Acceptance Criteria:**

**Given** I am filling in a document form (any type)
**When** I click on the "ผู้ซื้อ/คู่ค้า" field and start typing
**Then** a dropdown (shadcn/ui Command) shows matching contacts instantly
**And** results filter by name or tax ID

**Given** I select a contact from the dropdown
**When** the selection is made
**Then** all contact fields auto-fill: ชื่อ, ที่อยู่, สาขา, เลขผู้เสียภาษี
**And** a snapshot of the contact data is stored in the document (contact_snapshot JSON)

**Given** I type a name with no matching contacts
**When** the dropdown shows
**Then** I see an option "+ เพิ่มผู้ติดต่อใหม่" at the bottom

---

### Story 2.3: Import Contacts from CSV

As a business owner,
I want to import my existing contact list from a CSV file,
So that I can migrate from FlowAccount without manual data entry.

**Acceptance Criteria:**

**Given** I am on the /contacts page
**When** I click "นำเข้า CSV"
**Then** I can upload a CSV file

**Given** the CSV file is uploaded
**When** it is parsed
**Then** I see a column mapping UI (map CSV columns to: ชื่อ, เลขผู้เสียภาษี, ที่อยู่, ฯลฯ)

**Given** I confirm the mapping and click "นำเข้า"
**When** import runs
**Then** valid rows are inserted as contacts
**And** invalid rows are shown with specific errors (e.g., "เลขผู้เสียภาษีไม่ถูกต้อง")
**And** a summary shows: นำเข้าสำเร็จ X รายการ, ข้ามไป Y รายการ

---

## Epic 3: Document Creation & Management (All 6 Types)

**Goal:** Users can create, view, edit, duplicate, void, and track status of all 6 Thai accounting document types with atomic running numbers.

### Story 3.1: Document Type Selector & Core Form Infrastructure

As a business owner,
I want to click "สร้างเอกสาร" and choose from 6 document types,
So that I can start filling in the correct form for my needs.

**Acceptance Criteria:**

**Given** I click "+ สร้างเอกสาร" from any page
**When** the type selector modal opens
**Then** I see 6 options with icon + Thai name: ใบกำกับภาษี, ใบบันทึกค่าใช้จ่าย, ใบหัก ณ ที่จ่าย, ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จรับเงิน

**Given** I select a document type
**When** the form loads at /documents/new?type={TYPE}
**Then** the document number is auto-assigned in read-only field: {PREFIX}{YYYY}{MM}{NNNN}
**And** the `documents` table is created with all fields including tenant_id, doc_type, status, contact_snapshot (JSON), line_items (JSON), metadata (JSON)
**And** the date field defaults to today
**And** the status is "draft"

---

### Story 3.2: Tax Invoice (INV) Form with Line Items & VAT

As a business owner,
I want to create a Tax Invoice with line items and automatic VAT calculation,
So that I can issue compliant tax invoices to my customers.

**Acceptance Criteria:**

**Given** I am on the INV document form
**When** I add a line item (description, quantity, unit, price)
**Then** the row amount calculates automatically (qty × price)
**And** subtotal, VAT 7%, and grand total update in real-time without any button click

**Given** I add multiple line items
**When** any value changes
**Then** all totals recalculate immediately

**Given** I fill all required fields (contact, at least 1 line item)
**When** I click "บันทึกแบบร่าง"
**Then** the document is saved with status "draft"
**And** I see it in the documents list

**And** the AmountInWords component renders the total in Thai: e.g., "หนึ่งหมื่นเจ็ดร้อยบาทถ้วน"

---

### Story 3.3: Expense Record (EXP) Form

As a business owner,
I want to create an Expense Record for purchases and operating costs,
So that I can track all business expenses accurately.

**Acceptance Criteria:**

**Given** I am on the EXP document form
**When** I fill in: vendor (contact), expense category (dropdown), description, amount
**Then** I can optionally enter VAT and withholding tax amounts

**Given** I select an expense category
**When** I type the amount
**Then** I can mark the payment method (เงินสด, โอนเงิน, บัตรเครดิต)

**Given** I save the expense
**When** the document is created
**Then** it appears in the EXP document list with correct amount and vendor

---

### Story 3.4: Withholding Tax Certificate (WT) Form

As a business owner,
I want to create Withholding Tax certificates (ภ.ง.ด.3/53),
So that I can provide them to vendors whose payments I withhold tax from.

**Acceptance Criteria:**

**Given** I am on the WT document form
**When** the form loads
**Then** payer info auto-fills from my company profile (ชื่อบริษัท, เลขผู้เสียภาษี, ที่อยู่)

**Given** I select the income type and tax rate
**When** I enter the income amount
**Then** the withheld tax amount calculates automatically

**Given** I select filing form type
**When** ภ.ง.ด.3 is selected
**Then** I see appropriate income type options (freelance categories)
**And** when ภ.ง.ด.53 is selected, I see corporate income type options

---

### Story 3.5: Quotation (QT), Invoice (BL) & Receipt (RE) Forms

As a business owner,
I want to create Quotations, Invoices, and Receipts,
So that I can manage the full sales cycle from proposal to payment confirmation.

**Acceptance Criteria:**

**Given** I am on the QT form
**When** I fill in line items and validity date
**Then** I can set the quotation status (draft/sent/accepted/rejected)

**Given** I am on the BL form
**When** I create the invoice
**Then** I can set a due date and link to a quotation number (optional reference field)
**And** the payment status defaults to "pending"

**Given** I am on the RE form
**When** I create the receipt
**Then** I select the payment method (เงินสด, โอนเงิน, เช็ค, บัตรเครดิต)
**And** I can link to an invoice number (optional reference field)

---

### Story 3.6: Issue Document (Draft → Issued)

As a business owner,
I want to "issue" a document to lock it and make it official,
So that it becomes the final, uneditable record.

**Acceptance Criteria:**

**Given** I am viewing a document with status "draft"
**When** I click "ออกเอกสาร"
**Then** a confirmation dialog shows: "ยืนยันการออกเอกสาร {DocNumber}?"

**Given** I confirm the issuance
**When** the action completes
**Then** the document status changes to "issued"
**And** the document becomes read-only (edit button hidden)
**And** a success toast shows: "ออกเอกสารเรียบร้อยแล้ว"

---

### Story 3.7: Document Lifecycle (Paid, Void, Duplicate)

As a business owner,
I want to mark invoices as paid, void documents when needed, and duplicate documents,
So that I can maintain accurate records throughout the document lifecycle.

**Acceptance Criteria:**

**Given** I am viewing an "issued" invoice or billing document
**When** I click "บันทึกการชำระเงิน"
**Then** the status changes to "paid"
**And** the date of payment is recorded

**Given** I need to cancel a document
**When** I click "ยกเลิกเอกสาร"
**Then** I must enter a reason (required text field)
**And** the status changes to "void" — document is read-only and marked visually
**And** the document number is NOT reused

**Given** I click "คัดลอกเอกสาร" on any document
**When** duplication occurs
**Then** a new draft is created with the same data but a new document number
**And** the date resets to today

---

### Story 3.8: Document Type Conversion (QT → BL → RE)

As a business owner,
I want to convert a Quotation to an Invoice, and an Invoice to a Receipt,
So that I don't have to re-enter data when a quotation is accepted.

**Acceptance Criteria:**

**Given** I am viewing an accepted QT document
**When** I click "แปลงเป็นใบแจ้งหนี้"
**Then** a new BL draft is created with the same line items, contact, and amounts
**And** the BL references the original QT number in the reference field
**And** the original QT is NOT changed

**Given** I am viewing a paid BL document
**When** I click "แปลงเป็นใบเสร็จ"
**Then** a new RE draft is created with the same line items and contact
**And** the RE references the original BL number

---

### Story 3.9: Document List & Detail View

As a business owner,
I want to view all documents of each type in a organized list,
So that I can find and manage my documents efficiently.

**Acceptance Criteria:**

**Given** I am on /documents or /documents?type=INV
**When** the page loads
**Then** I see a table with columns: เลขที่, ผู้ติดต่อ, จำนวนเงิน, สถานะ (badge), วันที่, ☁️ Drive
**And** documents are paginated (20 per page)
**And** I can apply tab filters by type (All/INV/EXP/WT/QT/BL/RE)

**Given** I click on a document row
**When** the detail page loads at /documents/{id}
**Then** I see the full document data in a formatted view
**And** action buttons are appropriate to the document status (edit if draft, issue if draft, void if issued, etc.)

---

## Epic 4: PDF Export

**Goal:** Users can generate, preview, and download professional Thai-formatted PDFs for any accounting document, with company branding and Thai font support.

### Story 4.1: PDF Generation Infrastructure (Puppeteer Setup)

As a developer,
I want PDF generation infrastructure with Thai fonts working on Vercel,
So that all document types can be exported as properly formatted PDFs.

**Acceptance Criteria:**

**Given** the API route /api/documents/[id]/pdf is called
**When** Puppeteer launches with @sparticuz/chromium
**Then** a PDF is generated within 3 seconds
**And** Thai text renders correctly using TH Sarabun New (bundled as base64 in HTML template)
**And** the generated PDF is returned as a buffer with Content-Type: application/pdf

**And** the Vercel function is configured: memory 1024MB, maxDuration 30s
**And** Puppeteer uses A4 format with margins: top 20mm, right 15mm, bottom 20mm, left 15mm

---

### Story 4.2: Tax Invoice PDF Template

As a business owner,
I want to download a Tax Invoice as a professional PDF,
So that I can send it to customers for payment or compliance.

**Acceptance Criteria:**

**Given** I am on an issued INV document
**When** I click "ดาวน์โหลด PDF"
**Then** a PDF downloads with:
- Company logo (top-left), company name + address + tax ID (top-right)
- Document title: "ใบกำกับภาษี" + document number
- Customer info block
- Line items table (description, qty, unit, price, amount)
- Subtotal, VAT 7%, Grand Total section
- Amount in Thai words (หนึ่งหมื่นเจ็ดร้อยบาทถ้วน)
- Signature area at bottom

**And** the filename follows: {CompanyName}_{DocNumber}_{PartnerName}.pdf
**And** the PDF matches the reference template in docs/exsample/

---

### Story 4.3: All Other Document Type PDF Templates

As a business owner,
I want PDFs for all 6 document types (EXP, WT, QT, BL, RE),
So that every document type produces a correctly formatted, legally compliant PDF.

**Acceptance Criteria:**

**Given** I export a WT document
**When** the PDF generates
**Then** it shows: payer info (auto-filled from company), payee info, income type (ภ.ง.ด.3/53 label), tax rate, income amount, withheld amount

**Given** I export any document type (EXP, QT, BL, RE)
**When** the PDF downloads
**Then** each type has the correct layout matching Thai accounting conventions
**And** all PDFs include company logo, consistent header/footer, and Thai fonts

---

### Story 4.4: PDF Preview Modal

As a business owner,
I want to preview the PDF before downloading or issuing a document,
So that I can verify the document looks correct before sending it.

**Acceptance Criteria:**

**Given** I am on a document form (draft or issued)
**When** I click "Preview PDF"
**Then** a modal opens showing the PDF in an iframe (same Puppeteer endpoint)

**Given** the PDF is loading
**When** the iframe is initializing
**Then** a loading spinner shows with text "กำลังสร้าง PDF..."

**Given** the preview looks correct
**When** I click "ดาวน์โหลด"
**Then** the same PDF downloads to my device

---

## Epic 5: Search, History & Dashboard

**Goal:** Users get a meaningful dashboard with monthly financial summaries, can search all documents with filters, and export summary reports.

### Story 5.1: Dashboard Page with Monthly Summary

As a business owner,
I want a dashboard that shows my monthly financial snapshot,
So that I can understand my income, expenses, and document activity at a glance.

**Acceptance Criteria:**

**Given** I am on the dashboard (/)
**When** the page loads
**Then** I see 4 metric cards for current month: รายได้รวม, ค่าใช้จ่ายรวม, VAT รวม, จำนวนเอกสารทั้งหมด

**Given** the dashboard loads
**When** data is fetched
**Then** a bar chart (recharts) shows document counts per type for the current month
**And** I can click ◄ ► arrows to navigate to previous/next months

**And** all amounts are formatted Thai-style: ฿145,000.00
**And** the page loads in under 2 seconds

---

### Story 5.2: Recent Documents List on Dashboard

As a business owner,
I want to see my most recently created/updated documents on the dashboard,
So that I can quickly access what I've been working on.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** the recent documents section loads
**Then** I see the 5 most recently updated documents
**And** each row shows: document number, partner name, amount, status badge, date

**Given** I click on a document row
**When** navigating
**Then** I go to the document detail page /documents/{id}

---

### Story 5.3: Document List with Search & Filters

As a business owner,
I want to search and filter all my documents,
So that I can find any document by number, partner, date, or status.

**Acceptance Criteria:**

**Given** I am on /documents
**When** I type in the search box
**Then** results filter in real-time showing documents matching the document number or partner name
**And** search results appear in under 500ms

**Given** I apply a filter (document type tab + date range + status dropdown)
**When** filters are set
**Then** the table updates to show only matching documents

**Given** there are more than 20 documents
**When** I reach the bottom of the table
**Then** pagination shows: "แสดง 1-20 จาก 47 รายการ" with page navigation

**And** ⌘K (or Ctrl+K on Windows) opens the search from anywhere in the app

---

### Story 5.4: Outstanding Documents (Unpaid Invoices)

As a business owner,
I want to see which invoices are unpaid or overdue,
So that I can follow up on payments promptly.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** the outstanding section loads
**Then** I see all BL documents with status "pending" (unpaid)
**And** overdue invoices (past due date) are highlighted with a red badge

**Given** I click "ดูรายละเอียด" on an outstanding invoice
**When** navigating
**Then** I go to the invoice detail page

---

### Story 5.5: VAT Summary Report

As a business owner,
I want to see a monthly VAT summary,
So that I can prepare my monthly VAT return filing accurately.

**Acceptance Criteria:**

**Given** I am on /reports
**When** I select a month and year
**Then** I see: รายได้ก่อนภาษี, ภาษีขาย (VAT จากใบกำกับภาษี), ภาษีซื้อ (VAT จากค่าใช้จ่าย), VAT ที่ต้องชำระ

**Given** the VAT summary loads
**When** I view the data
**Then** each line shows the contributing document numbers as a collapsible list

---

### Story 5.6: Sort Documents

As a business owner,
I want to sort my document lists by date, amount, or document number,
So that I can organize documents in the order most useful to me.

**Acceptance Criteria:**

**Given** I am viewing the document list
**When** I click on a column header (วันที่, จำนวนเงิน, เลขที่เอกสาร)
**Then** the list sorts by that column (ascending first, then descending on second click)
**And** a sort indicator (▲/▼) appears on the active column

---

### Story 5.7: Export Monthly Summary to Excel

As a business owner,
I want to export my monthly document summary as an Excel file,
So that I can share it with my accountant or use it for tax filing.

**Acceptance Criteria:**

**Given** I am on /reports viewing a monthly summary
**When** I click "ส่งออก Excel"
**Then** an .xlsx file downloads containing: document number, type, partner, amount, VAT, status, date

**And** the xlsx file uses SheetJS (already in stack for import)
**And** Thai text is correctly encoded in the Excel file

---

## Epic 6: Google Drive Integration

**Goal:** Users can connect their Google Drive and have all issued document PDFs automatically backed up in organized year/month/type folders.

### Story 6.1: Google Drive OAuth Connection

As a business owner,
I want to connect my Google Drive account,
So that my documents can be automatically backed up there.

**Acceptance Criteria:**

**Given** I am on the onboarding wizard Step 2 or Settings > Google Drive
**When** I click "เชื่อมต่อ Google Drive"
**Then** I am redirected to Google OAuth consent screen

**Given** I grant Drive access permissions
**When** OAuth callback returns to /api/drive/callback
**Then** the access_token and refresh_token are stored encrypted (AES-256 via node:crypto) in `drive_integrations` table for my tenant
**And** the token_expiry is stored for auto-refresh
**And** I am redirected back to settings with: "เชื่อมต่อ Google Drive สำเร็จ ✓"

**Given** I want to disconnect Drive
**When** I click "ยกเลิกการเชื่อมต่อ"
**Then** my tokens are deleted from the DB and Drive is disconnected

---

### Story 6.2: Automatic PDF Upload on Document Issue

As a business owner,
I want PDFs to automatically upload to my Google Drive when I issue a document,
So that I always have an organized backup without manual effort.

**Acceptance Criteria:**

**Given** I issue a document and Drive is connected
**When** the document status changes to "issued"
**Then** the PDF is generated and uploaded to Google Drive
**And** the folder structure is created automatically: AccountThai/{YYYY}/{MM-MonthName}/{DocType}/
**And** the Drive file ID and URL are stored in the document record (drive_file_id, drive_url)
**And** the document list shows ☁️✓ (green) for this document

**Given** the Drive upload fails
**When** the upload errors
**Then** the document is still issued successfully (upload failure is non-blocking)
**And** the Drive status shows ☁️✕ (red) with a retry option
**And** an error is logged

---

### Story 6.3: Manual Drive Re-upload & Sync

As a business owner,
I want to manually re-upload a document to Drive or trigger a sync,
So that I can recover from upload failures or connect Drive after documents are created.

**Acceptance Criteria:**

**Given** a document shows ☁️✕ (failed) Drive status
**When** I click the Drive status icon
**Then** a popover shows the error and a "อัปโหลดใหม่" button

**Given** I click "อัปโหลดใหม่"
**When** the upload retries
**Then** the status updates to ☁️⟳ then ☁️✓ on success

**Given** I connect Drive after already having issued documents
**When** I go to Settings > Google Drive > "ซิงค์เอกสารทั้งหมด"
**Then** all issued documents without drive_file_id are uploaded in background
**And** a progress indicator shows: "กำลังอัปโหลด X จาก Y เอกสาร..."

---

## Epic 7: Data Import

**Goal:** Users can import accounting document data from Excel/CSV files with a visual column mapping interface and validation before committing.

### Story 7.1: File Upload & Parsing (Excel/CSV)

As a business owner,
I want to upload an Excel or CSV file of document data,
So that I can migrate data from FlowAccount without manual re-entry.

**Acceptance Criteria:**

**Given** I am on /import
**When** I click "เลือกไฟล์" and upload an .xlsx or .csv file
**Then** the file is parsed using SheetJS (xlsx)
**And** a preview of the first 5 rows is shown
**And** the total row count is displayed

**Given** I upload a file with Thai characters
**When** it is parsed
**Then** Thai text is correctly decoded (UTF-8 / TIS-620 detection)

**Given** I upload an unsupported file type
**When** the upload is attempted
**Then** I see: "รองรับเฉพาะไฟล์ .xlsx และ .csv"

---

### Story 7.2: Column Mapping UI

As a business owner,
I want to map columns from my Excel file to the AccountThai fields,
So that the import correctly assigns data to the right fields.

**Acceptance Criteria:**

**Given** the file is parsed and I see the column mapping UI
**When** the mapping interface loads
**Then** I see my Excel column headers (e.g., "วันที่ออกเอกสาร", "ชื่อลูกค้า", "ยอดรวม") in a dropdown
**And** next to each AccountThai field, I can select which Excel column maps to it

**Given** I select a mapping and click "ถัดไป"
**When** validation runs
**Then** I see a preview table of how the mapped data will look
**And** validation errors are shown per row (e.g., "แถวที่ 5: เลขที่ผู้เสียภาษีไม่ถูกต้อง")

---

### Story 7.3: Import Confirmation & Execution

As a business owner,
I want to review and confirm the import before it commits to the database,
So that I can catch errors before they affect my records.

**Acceptance Criteria:**

**Given** I have reviewed the preview with valid rows highlighted green and invalid rows red
**When** I click "นำเข้า X รายการที่ผ่านการตรวจสอบ"
**Then** only valid rows are imported as draft documents
**And** a summary shows: "นำเข้าสำเร็จ X รายการ ข้ามไป Y รายการ"

**Given** I want to import invalid rows
**When** I download the error report
**Then** an Excel file downloads with only the failed rows and error descriptions

**And** imported documents appear in the document list as drafts
**And** they can be reviewed and issued individually

---

## Validation Summary

### FR Coverage Check

✅ All 45 Phase 1 FRs covered across 7 Epics and 34 Stories.

| Epic | Stories | FRs Covered |
|---|---|---|
| Epic 1: Auth & Setup | 5 | FR-AUTH-01, FR-AUTH-02, FR-COMP-01, FR-COMP-02, FR-COMP-03 |
| Epic 2: Contacts | 3 | FR-CONT-01 to FR-CONT-04 |
| Epic 3: Documents | 9 | FR-DOC-01 to FR-DOC-07 |
| Epic 4: PDF Export | 4 | FR-PDF-01 to FR-PDF-05, FR-PDF-07 |
| Epic 5: Search & Dashboard | 7 | FR-SRCH-01 to FR-SRCH-07, FR-DASH-01 to FR-DASH-05, FR-DASH-07 |
| Epic 6: Google Drive | 3 | FR-GDRIVE-01 to FR-GDRIVE-05 |
| Epic 7: Data Import | 3 | FR-IMP-01, FR-IMP-02, FR-IMP-04 to FR-IMP-06 |

### UX-DR Coverage Check

✅ All 16 UX Design Requirements are addressed:
- UX-DR-01 (sidebar layout) → Story 1.1
- UX-DR-02 (type selector modal) → Story 3.1
- UX-DR-03 (contact autocomplete) → Story 2.2
- UX-DR-04 (live VAT calculation) → Story 3.2
- UX-DR-05 (running number display) → Story 3.1
- UX-DR-06 (status badges) → Story 3.6, 3.7
- UX-DR-07 (Drive status icon) → Story 6.2, 6.3
- UX-DR-08 (toast notifications) → Story 3.6
- UX-DR-09 (PDF preview modal) → Story 4.4
- UX-DR-10 (dashboard + recharts) → Story 5.1
- UX-DR-11 (document list table) → Story 3.9
- UX-DR-12 (onboarding wizard) → Story 1.3, 6.1
- UX-DR-13 (⌘K search) → Story 5.3
- UX-DR-14 (mobile responsive) → Story 1.1
- UX-DR-15 (Sarabun font) → Story 1.1
- UX-DR-16 (AmountInWords) → Story 3.2

### Dependency Check

✅ Each epic is independently valuable and enables the next:
- Epic 1 (Auth + Setup) → enables all others (auth guard, company profile)
- Epic 2 (Contacts) → uses Epic 1 (auth), enables Epic 3 (contact autocomplete)
- Epic 3 (Documents) → uses Epic 1+2, is core domain
- Epic 4 (PDF) → uses Epic 3 (needs generated documents)
- Epic 5 (Search+Dashboard) → uses Epic 3 (needs documents to search)
- Epic 6 (Drive) → uses Epic 4 (needs PDFs to upload)
- Epic 7 (Import) → uses Epic 3 (imports as draft documents)

✅ No forward dependencies within epics.
✅ Database tables created per-story as needed.
✅ Epic 1 Story 1 sets up the greenfield project infrastructure.

---

*Epics & Stories v1.0 — Complete*
*April 15, 2026*
*7 Epics | 34 Stories | Ready for Sprint Planning*
