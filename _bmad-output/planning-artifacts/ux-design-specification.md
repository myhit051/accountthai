---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
project_name: 'AccountThai'
user_name: 'Mujahid'
date: '2026-04-15'
mode: 'autonomous'
---

# UX Design Specification — AccountThai

**Author:** Mujahid (facilitated by Sally, UX Designer)
**Date:** April 15, 2026
**Status:** Complete — Ready for Implementation

---

## Executive Summary

### Project Vision

AccountThai is a **focused, no-nonsense accounting document web app** for Thai SME owners who just need to do one thing well: *produce professional accounting documents fast and keep them organized.* No payroll. No POS. No complexity. Just the 6 documents they actually use — created in under 2 minutes each, exported as beautiful PDFs, and automatically backed up to Google Drive.

The product replaces FlowAccount for power users who pay for 20% of what they need but are forced to navigate 80% they don't.

### Target Users

**Primary — Mujahid (Phase 1)**
- Business owner of บริษัท เอ็ม เอ็น กรุ๊ป 2021 จำกัด
- Sells through Lazada & Shopee marketplaces
- Creates tax invoices, expense records, and withholding tax certs regularly
- Intermediate tech comfort — uses web apps confidently, doesn't need hand-holding
- Works on desktop (Mac), occasionally mobile for quick lookups

**Secondary — Thai SME Owners (Phase 2)**
- Similar profile but across various industries
- Overwhelmed by bloated accounting software
- Want something Thai-language, affordable, focused

### Key Design Challenges

1. **Document form complexity** — 6 different document types with different fields, validations, and business rules. Must feel simple despite complexity underneath.
2. **PDF fidelity** — Generated PDFs must look exactly right for Thai tax compliance (Revenue Department standards). A wrong-looking document destroys trust.
3. **Thai language throughout** — All labels, amounts (in words), dates must follow Thai conventions perfectly.
4. **Running number integrity** — Users are anxious about skipping numbers or creating duplicates. Must communicate confidence.
5. **Onboarding** — First-time setup (company info, Google Drive connection) must be smooth, or users abandon before seeing value.

### Design Opportunities

1. **Speed over FlowAccount** — FlowAccount's create-document flow takes many clicks. AccountThai can make it 3 steps flat: pick type → fill form → done.
2. **Smart contact autocomplete** — Reuse partner data across documents. Type "Lazada" → all their info fills automatically.
3. **Drive backup as reassurance** — Show a visible "☁️ Saved to Drive" confirmation per document — this becomes a trust signal FlowAccount doesn't offer.
4. **Monthly summary as pride** — A beautiful dashboard showing "12 invoices, ฿145,000 this month" gives owners a sense of accomplishment and control.

---

## Core User Experience

### Defining Experience

The core experience of AccountThai is: **"Create a document in under 2 minutes."**

Every design decision should serve this goal. The flow is:
1. User lands on Dashboard — sees their status at a glance
2. Clicks a clear "New Document" button (always visible)
3. Picks the document type (6 options, clearly labeled in Thai)
4. Fills a clean, pre-populated form (contact auto-fills, VAT calculated, number auto-assigned)
5. Reviews PDF preview
6. Clicks "Issue Document" — PDF downloaded + uploaded to Drive automatically
7. Returns to Dashboard, sees document in recent list

### Platform Strategy

- **Primary:** Desktop web (Chrome/Safari on Mac/Windows) — Mujahid's main work environment
- **Secondary:** Responsive mobile — for quick lookups and status checks
- **NOT required:** Native iOS/Android app, offline mode
- **Print/PDF-first thinking:** Every document page must consider how it looks when printed or PDFed

### Effortless Interactions

| Interaction | How it should feel |
|---|---|
| Typing a contact name | Click, start typing, see matching contacts instantly — auto-fill all fields |
| VAT calculation | Type amount → subtotal, VAT, total update live — no button needed |
| Generating PDF | Click "Issue" → 2-3 second spinner → PDF auto-downloads |
| Finding a past document | Type document number or partner name → results appear instantly |
| Seeing Drive backup status | Small green ☁️ icon appears next to document after upload |

### Critical Success Moments

1. **First document created** — The moment the first PDF downloads and looks professional, the user knows this works
2. **Contact auto-fill** — First time a saved contact fills in automatically, saves 30 seconds of typing
3. **Monthly summary** — Seeing a clean summary at end of month confirms the system is reliable
4. **Drive confirmation** — Knowing documents are safely backed up without any manual action

### Experience Principles

1. **Thai first** — Every label, placeholder, tooltip is in Thai. Numbers formatted Thai-style. Dates in Thai format.
2. **Effortless, not featureful** — Remove every step that isn't necessary. Defaults handle 80% of cases.
3. **Professional output** — The PDF must look like it was made by an accountant, not a developer.
4. **Reliable accounting** — Running numbers never skip, never duplicate. The system communicates this confidence.
5. **Zero anxiety data entry** — Forms validate as-you-type with clear, friendly Thai error messages.

---

## Emotional Response Design

### Desired Emotional Journey

| Stage | Current (FlowAccount) | Target (AccountThai) |
|---|---|---|
| Opening the app | "Where do I start again?" | "I know exactly what to do" |
| Filling a form | "Why are there so many fields?" | "This is quick and familiar" |
| Viewing the PDF | "Hope this looks right..." | "This looks exactly right. Professional." |
| End of month | "I need to calculate totals manually" | "My summary is right there. I'm on top of this." |

### Tone & Voice

- **Tone:** Professional but warm, like a helpful Thai office colleague
- **Avoid:** Formal corporate coldness; developer-speak error messages
- **Messages should feel:** "ระบบบันทึกเอกสารเรียบร้อยแล้วค่ะ" not "Document record created successfully"
- **Error messages:** Specific and actionable in Thai — "กรุณาระบุเลขที่ผู้เสียภาษี 13 หลัก" not "Invalid tax ID"

---

## Visual Foundation

### Color Palette

**Primary Brand — Trustworthy Blue-Green:**
```
Primary:       #0D6EFD (Thai business trust — professional blue)
Primary Dark:  #0952C8
Primary Light: #E7F1FF
Accent:        #20C997 (success / saved state — teal)
```

**Neutral Scale:**
```
Gray 900: #1A1D23 (headings)
Gray 700: #495057 (body text)
Gray 500: #ADB5BD (muted / placeholders)
Gray 200: #E9ECEF (borders, dividers)
Gray 100: #F8F9FA (backgrounds)
White:    #FFFFFF
```

**Semantic Colors:**
```
Success:  #198754 (issued documents, Drive uploaded)
Warning:  #FFC107 (pending / draft)
Danger:   #DC3545 (void / error)
Info:     #0DCAF0 (informational)
```

### Typography

**Primary Font:** `Sarabun` (Google Fonts) — Thai + Latin support, clean modern look
**Monospace:** `JetBrains Mono` — document numbers, amounts

```css
--font-heading: 'Sarabun', system-ui, sans-serif;
--font-body: 'Sarabun', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs:   12px / 1.4
--text-sm:   14px / 1.5
--text-base: 16px / 1.6
--text-lg:   18px / 1.5
--text-xl:   20px / 1.4
--text-2xl:  24px / 1.3
--text-3xl:  30px / 1.2
```

### Spacing & Layout

```css
/* 8-point grid */
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
--space-16: 64px

/* Border radius */
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
```

### Design Direction

**Style:** Clean professional SaaS — similar to Notion, Linear, or Invoice Ninja
- White background, subtle gray card backgrounds
- Clear visual hierarchy with Sarabun headings
- Blue primary actions, teal success states
- Minimal shadows, clean borders
- Data-dense but organized — accounting users appreciate information density

---

## Design System Foundation

### Design System Choice

**Tailwind CSS v4** (utility-first) with **shadcn/ui** component library

### Rationale

- **Tailwind CSS:** Already in architecture stack, Mujahid's team familiar with it
- **shadcn/ui:** Pre-built accessible components (Tables, Forms, Dialogs, Dropdowns) — copy-paste into project, not an npm dependency
- **Speed:** Don't build form inputs, modals, date pickers from scratch
- **Customization:** Full token control in `tailwind.config.ts`
- **Thai support:** No font restrictions in shadcn/ui

### Key Components (from shadcn/ui)

| Component | Used For |
|---|---|
| `Table` | Document list, line items |
| `Form` + `Input` | All document forms |
| `Select` | Document type, contact selector |
| `Dialog` | PDF preview, confirmation modals |
| `DatePicker` | Document date fields |
| `Badge` | Document status (Draft/Issued/Paid/Void) |
| `Tabs` | Document type filtering |
| `Command` | Contact search/autocomplete |
| `Toast` | Success/error notifications |
| `Card` | Dashboard metrics, document cards |

### Custom Components Required

| Component | Description |
|---|---|
| `DocumentForm` | Dynamic form that adapts to doc type |
| `LineItemTable` | Editable item rows with auto-calculation |
| `ContactSearchInput` | Autocomplete with contact data |
| `AmountInWords` | Thai Baht text (หนึ่งพันบาทถ้วน) |
| `DocumentStatusBadge` | Color-coded status with Thai labels |
| `DriveStatusIcon` | ☁️ backup confirmation indicator |
| `PDFPreviewModal` | Iframe PDF preview before download |
| `MonthlyChart` | Bar chart for dashboard summary |

---

## Information Architecture & Navigation

### Global Layout

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, collapsible on mobile)                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  AccountThai  [logo]                             │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  🏠 แดชบอร์ด                                    │    │
│  │  📄 เอกสาร                      [▾ expand]      │    │
│  │     ├ ใบกำกับภาษี (INV)                         │    │
│  │     ├ ใบค่าใช้จ่าย (EXP)                        │    │
│  │     ├ ใบหัก ณ ที่จ่าย (WT)                      │    │
│  │     ├ ใบเสนอราคา (QT)                           │    │
│  │     ├ ใบแจ้งหนี้ (BL)                           │    │
│  │     └ ใบเสร็จรับเงิน (RE)                       │    │
│  │  👥 ผู้ติดต่อ                                    │    │
│  │  📊 รายงาน                                       │    │
│  │  📤 นำเข้าข้อมูล                                 │    │
│  ├─────────────────────────────────────────────────┤    │
│  │  ⚙️ ตั้งค่า                                      │    │
│  │  👤 บัญชีผู้ใช้                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  MAIN CONTENT AREA                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [Page title + breadcrumb]        [Primary CTA] │    │
│  │                                                  │    │
│  │  [Page content]                                  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Key User Journeys

### Journey 1: Create Tax Invoice (INV) — Primary Flow

```
Dashboard
  → Click "+ สร้างเอกสาร" (blue, top-right, always visible)
  → Type Selector Modal (6 cards with icon + Thai name)
    → Select "ใบกำกับภาษี"
  → Form Page: /documents/new?type=INV
    Section 1: ข้อมูลเอกสาร
      - เลขที่เอกสาร: [Auto: "INV2026050001"] (read-only, with lock icon)
      - วันที่: [Date picker, default: today]
      - ผู้ซื้อ: [Contact search input — type to search]
    Section 2: รายการสินค้า/บริการ
      - Line items table (description / qty / unit / price / amount)
      - [+ เพิ่มรายการ] button
      - Live totals: ราคาก่อนภาษี / ภาษีมูลค่าเพิ่ม 7% / ยอดรวม
    Section 3: หมายเหตุ (optional text)
    
    Footer: [Preview PDF] [บันทึกแบบร่าง] [ออกเอกสาร →]
    
  → Click "ออกเอกสาร"
    → Confirmation dialog: "ยืนยันการออกเอกสาร INV2026050001?"
    → [ยืนยัน] → Spinner (2-3s)
    → Success toast: "สร้างเอกสารเรียบร้อย ☁️ บันทึกไปยัง Drive แล้ว"
    → Auto-download PDF
    → Redirect to document detail page
```

### Journey 2: Monthly Report Check

```
Dashboard
  → Scroll to Monthly Summary section
  → See: ใบกำกับภาษี: 7 ฉบับ / ฿89,500
         ใบค่าใช้จ่าย: 12 ฉบับ / ฿24,300
         ใบหัก ณ ที่จ่าย: 3 ฉบับ / ฿2,150
  → Click "ดูรายงานเต็ม" → Reports page
  → Filter by month/year
  → Export to Excel button
```

### Journey 3: Search for Past Document

```
Any page: Focus search bar (⌘K shortcut)
  → Type: "Lazada" or "INV202603"
  → Results appear instantly with doc number, partner, amount, date, status
  → Click → Document detail page
```

### Journey 4: First-Time Setup (Onboarding)

```
Register/Login
  → Onboarding wizard (3 steps, progress bar)
    Step 1: ข้อมูลบริษัท
      - ชื่อบริษัท, เลขผู้เสียภาษี, ที่อยู่, โทรศัพท์
      - อัปโหลดโลโก้บริษัท
    Step 2: เชื่อมต่อ Google Drive (optional, can skip)
      - "เชื่อมต่อ Google Drive เพื่อ backup อัตโนมัติ"
      - [เชื่อมต่อ Google Drive] → OAuth flow
      - OR [ข้ามขั้นตอนนี้ก่อน]
    Step 3: เสร็จสิ้น!
      - Preview of dashboard
      - [สร้างเอกสารแรก →] CTA
```

---

## Page Designs

### Dashboard

```
┌────────────────────────────────────────────────────────┐
│  แดชบอร์ด                          [+ สร้างเอกสาร]    │
├────────────────────────────────────────────────────────┤
│  สรุปเดือนนี้  (เมษายน 2026)    [◄ Mar] [Apr] [May ►] │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ รายได้   │ │ค่าใช้จ่าย│ │ VAT รวม  │ │เอกสารทั้ง│  │
│  │฿145,000  │ │฿24,300   │ │฿9,870    │ │หมด 22 ฉบับ│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                        │
│  เอกสารล่าสุด                              [ดูทั้งหมด] │
│  ┌──────────────────────────────────────────────────┐  │
│  │ INV2026040007 │ Lazada Limited │ ฿15,000 │ Issued│  │
│  │ EXP2026040003 │ ร้าน Baby...  │ ฿2,100  │ Issued│  │
│  │ QT2026040001  │ ABC Company   │ ฿89,000 │ Draft │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  เอกสารแบ่งตามประเภท (เดือนนี้)                        │
│  [Bar chart: INV=7, EXP=8, WT=2, QT=3, BL=1, RE=1]   │
└────────────────────────────────────────────────────────┘
```

### Document List Page

```
┌────────────────────────────────────────────────────────┐
│  เอกสารทั้งหมด                     [+ สร้างเอกสาร]    │
├──────────────────────────────────────────────────────  │
│  [All][INV][EXP][WT][QT][BL][RE]   🔍 ค้นหา...        │
│  วันที่: [Apr 2026 ▾]  สถานะ: [ทั้งหมด ▾]             │
├────────────────────────────────────────────────────────┤
│  เลขที่       │ผู้ติดต่อ      │จำนวนเงิน │สถานะ │ ☁️  │
│  INV2026040007│Lazada Limited │฿15,000   │Issued│ ✓   │
│  INV2026040006│บ.ช้อปปี้...  │฿8,500    │Issued│ ✓   │
│  QT2026040001 │ABC Company   │฿89,000   │Draft │ -   │
│  ...                                                   │
├────────────────────────────────────────────────────────┤
│  แสดง 1-20 จาก 47 รายการ    [< 1 2 3 >]              │
└────────────────────────────────────────────────────────┘
```

### Document Form (Tax Invoice)

```
┌────────────────────────────────────────────────────────┐
│  สร้างใบกำกับภาษี                                      │
│  ◄ ย้อนกลับ                                            │
├────────────────────────────────────────────────────────┤
│  ── ข้อมูลเอกสาร ───────────────────────────────────  │
│  เลขที่เอกสาร    วันที่                                │
│  [INV2026050001] [15/05/2026         ▾]                │
│                                                        │
│  ผู้ซื้อ / คู่ค้า                                      │
│  [🔍 ค้นหาหรือเพิ่มผู้ติดต่อ...]                      │
│  ↳ [Lazada Limited — 0105554129383]  [✕]               │
│    ที่อยู่: เลขที่ 990 อาคาร... กรุงเทพฯ 10500        │
│                                                        │
│  ── รายการสินค้า/บริการ ──────────────────────────── │
│  รายการ          จำนวน  หน่วย  ราคา/หน่วย   รวม    [ลบ]│
│  [ค่าบริการ...] [1   ] [ชิ้น] [10,000    ] [10,000] [x]│
│  [             ] [   ] [    ] [           ] [      ] [x]│
│  [+ เพิ่มรายการ]                                       │
│                                                        │
│  ── สรุปยอด ───────────────────────────────────────── │
│                        ราคาก่อนภาษี:  10,000.00 บาท   │
│                        ภาษีมูลค่าเพิ่ม 7%: 700.00 บาท │
│                   ─────────────────────────────────   │
│                        ยอดรวม:     10,700.00 บาท      │
│               (หนึ่งหมื่นเจ็ดร้อยบาทถ้วน)             │
│                                                        │
│  หมายเหตุ                                              │
│  [                                                 ]   │
│                                                        │
│  [Preview PDF]  [บันทึกแบบร่าง]  [ออกเอกสาร →]       │
└────────────────────────────────────────────────────────┘
```

---

## UX Patterns

### Contact Search (CommandInput)

```
User types in contact field → opens popover
┌─────────────────────────────────┐
│ 🔍 ค้นหาผู้ติดต่อ...           │
├─────────────────────────────────┤
│ Lazada Limited                  │
│   0105554129383 · ลูกค้า       │
│ บ.ช้อปปี้ (ประเทศไทย) จำกัด   │
│   0105561084141 · ลูกค้า       │
│ ─────────────────────────────  │
│ + เพิ่มผู้ติดต่อใหม่           │
└─────────────────────────────────┘
On select → all contact fields auto-fill in form
```

### Status Badges

| Status | Thai Label | Color |
|---|---|---|
| draft | แบบร่าง | Gray |
| issued | ออกแล้ว | Blue |
| paid | ชำระแล้ว | Green |
| void | ยกเลิก | Red |

### Drive Status Indicator

Per document in list view:
- `☁️ ✓` — uploaded to Drive (green checkmark)
- `☁️ ⟳` — uploading (spinner)
- `☁️ ✕` — failed (red, click to retry)
- `–` — Drive not connected

### Document Number Display

Always displayed in monospace font with light background:
```
[INV2026050001]
```
With tooltip: "เลขที่นี้ถูกกำหนดโดยระบบอัตโนมัติ ไม่สามารถเปลี่ยนแปลงได้"

### Form Validation

- Validate on blur (not on every keystroke)
- Error shown below field in red Thai text
- Form submission blocked with summary of errors at top
- Success state: field border turns green briefly

---

## Responsive & Accessibility

### Responsive Breakpoints

```
Mobile:   < 640px  — single column, sidebar collapsed to bottom nav
Tablet:   640-1024px — sidebar collapsed, 2-column grids
Desktop:  > 1024px — full sidebar, wide tables
```

### Mobile Adaptations

- Sidebar → bottom navigation bar (5 icons: Home, Documents, Contacts, Reports, Settings)
- Document list → card layout instead of table
- Form → full-screen sections with back button
- PDF generation → same flow, download triggers browser PDF viewer

### Accessibility

- All form inputs have `<label>` association
- Error messages linked via `aria-describedby`
- Focus management in modals (trap focus, restore on close)
- Color not used as sole communicator (status has icon + text + color)
- Keyboard shortcuts: `⌘K` for search, `⌘N` for new document

---

## Design Tokens Reference

```css
:root {
  /* Colors */
  --color-primary: #0D6EFD;
  --color-primary-dark: #0952C8;
  --color-primary-light: #E7F1FF;
  --color-accent: #20C997;
  --color-success: #198754;
  --color-warning: #FFC107;
  --color-danger: #DC3545;
  
  /* Neutrals */
  --color-text-primary: #1A1D23;
  --color-text-secondary: #495057;
  --color-text-muted: #ADB5BD;
  --color-border: #E9ECEF;
  --color-bg-subtle: #F8F9FA;
  --color-bg-white: #FFFFFF;
  
  /* Typography */
  --font-sans: 'Sarabun', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  
  /* Animation */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

---

*UX Design Specification v1.0 — Complete*
*Sally (UX Designer) — April 15, 2026*
*Next: Epics & Stories → Implementation*
