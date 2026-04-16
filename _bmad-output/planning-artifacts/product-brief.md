# Product Brief: AccountThai — ระบบจัดการเอกสารบัญชีออนไลน์

## Vision Statement

AccountThai เป็นระบบ Web App สำหรับจัดการเอกสารบัญชีของธุรกิจ SME ไทย ที่เน้นเฉพาะฟีเจอร์ที่ใช้จริง — ออกเอกสาร, Export PDF, บันทึกประวัติ — โดยไม่ต้องจ่ายค่าบริการแพงเหมือนโปรแกรมบัญชีแบบครบวงจร

**Tagline:** "เอกสารบัญชีที่คุณต้องการ — ไม่มาก ไม่น้อย"

## Problem Statement

เจ้าของธุรกิจ SME ที่ขายสินค้าผ่าน Lazada, Shopee ต้องออกเอกสารบัญชีหลากหลายประเภท (ใบกำกับภาษี, ใบบันทึกค่าใช้จ่าย, ใบหัก ณ ที่จ่าย, ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จรับเงิน) แต่โปรแกรมบัญชีในตลาดอย่าง FlowAccount มาพร้อมฟีเจอร์มากมายที่ไม่ได้ใช้ (POS, Payroll, สต็อก, กระทบยอดธนาคาร) และมีค่าบริการรายเดือน/รายปีที่สูง

**Pain Points:**
- จ่ายค่าบริการ FlowAccount แพง สำหรับฟีเจอร์ที่ใช้จริงแค่ไม่กี่อย่าง
- ต้องการระบบที่ตรงจุด — ออกเอกสาร, Export PDF, เก็บประวัติ, สรุปยอด
- ต้องการ Import ข้อมูลจาก Excel/CSV/PDF เพื่อลดงาน manual
- ต้องการ backup อัตโนมัติไปยัง Google Drive

## Target Users

### Primary: เจ้าของธุรกิจ (Phase 1)
- **บริษัท เอ็ม เอ็น กรุ๊ป 2021 จำกัด** — ผู้ใช้หลักคนแรก
- ขายสินค้าผ่าน Marketplace (Lazada, Shopee)
- ต้องการออกเอกสารบัญชีเพื่อส่งสรรพากรและคู่ค้า
- ดูแลบัญชีเอง ไม่มีพนักงานบัญชี

### Secondary: บริษัทอื่น (Phase 2 — อนาคต)
- เปิดให้บริษัทอื่นสมัครเข้ามาใช้ระบบ (Multi-tenant SaaS)
- มีระบบ Authentication และแยกข้อมูลแต่ละบริษัท

## Core Features (MVP)

### 1. Document Management
จัดการเอกสาร **6 ประเภท:**

| # | ประเภทเอกสาร | Prefix | ตัวอย่างรูปแบบ |
|---|---|---|---|
| 1 | ใบกำกับภาษี (Tax Invoice) | `INV` | INV2026030001 |
| 2 | ใบบันทึกค่าใช้จ่าย (Expense Record) | `EXP` | EXP2026030001 |
| 3 | ใบหัก ณ ที่จ่าย (Withholding Tax) | `WT` | WT2026030001 |
| 4 | ใบเสนอราคา (Quotation) | `QT` | QT2026030001 |
| 5 | ใบแจ้งหนี้ (Invoice / Billing) | `BL` | BL2026030001 |
| 6 | ใบเสร็จรับเงิน (Receipt) | `RE` | RE2026030001 |

**Running Number Format:** `{Prefix}{YYYY}{MM}{NNNN}` — Reset ต่อเดือน

### 2. PDF Export
- Export เอกสารเป็น PDF มาตรฐาน
- ชื่อไฟล์: `{ชื่อบริษัท}_{DocNumber}_{ชื่อคู่ค้า}.pdf`
- รองรับ logo บริษัท, ข้อมูลภาษี, เลขผู้เสียภาษี

### 3. Data Input
- **Manual Entry:** กรอกข้อมูลเอกสารแต่ละรายการผ่านฟอร์ม
- **Import:** รองรับ Import จาก Excel/CSV/PDF เพื่อสร้างเอกสารอัตโนมัติ

### 4. Document History & Search
- เก็บประวัติเอกสารทั้งหมดในระบบ
- ค้นหาด้วย เลขที่เอกสาร, ชื่อคู่ค้า, วันที่, ประเภท
- Filter & Sort ตามเงื่อนไขต่างๆ

### 5. Monthly Summary
- สรุปยอดรายเดือนแยกตามประเภทเอกสาร
- Dashboard overview แสดงสถิติสำคัญ

### 6. Google Drive Auto-Backup
- อัปโหลดเอกสาร PDF ไปยัง Google Drive อัตโนมัติเมื่อสร้างเสร็จ
- จัดโครงสร้างโฟลเดอร์ตามประเภทเอกสาร/เดือน/ปี

## Competitive Analysis

| Feature | FlowAccount | AccountThai |
|---|---|---|
| ราคา | เริ่ม 165 บ./เดือน, แพ็กเกจ Pro สูงกว่า | ฟรีสำหรับตัวเอง, Phase 2 กำหนดราคาได้เอง |
| ออกเอกสารบัญชี | ✅ ครบทุกประเภท | ✅ 6 ประเภทที่ใช้จริง |
| Export PDF | ✅ | ✅ |
| Import Excel/CSV | ✅ | ✅ + Import PDF |
| Google Drive backup | ❌ (ต้องทำเอง) | ✅ Auto-backup |
| สต็อก/POS/Payroll | ✅ (ไม่ได้ใช้) | ❌ (ไม่ต้องการ) |
| e-Tax / e-Withholding | ✅ | ❌ (Phase 2+) |
| Multi-tenant | ✅ | ✅ (Phase 2) |
| ความซับซ้อน | สูง — ฟีเจอร์เยอะเกินไป | ต่ำ — ตรงจุดที่ใช้จริง |

## Success Criteria

1. **สร้างเอกสาร 6 ประเภทและ Export PDF ได้** — ภายใน Phase 1
2. **ลดเวลาการสร้างเอกสาร** — จาก ~5 นาที/เอกสาร เหลือ ~2 นาที
3. **ยกเลิก FlowAccount ได้** — ประหยัดค่าบริการรายเดือน
4. **Phase 2: มีบริษัทอื่นสมัครใช้งาน** — อย่างน้อย 5 บริษัทภายใน 6 เดือนหลังเปิด

## Technical Direction (Preliminary)

- **Frontend:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (or Vanilla CSS)
- **Database:** Turso (SQLite), Drizzle ORM
- **Auth:** NextAuth.js / Better Auth
- **PDF Generation:** Server-side PDF library (e.g., @react-pdf/renderer, puppeteer)
- **Google Drive API:** สำหรับ auto-backup
- **Hosting:** Vercel / Cloudflare

> **Note:** Technical stack สุดท้ายจะถูกกำหนดในขั้นตอน Architecture Design

## Phased Roadmap

### Phase 1: Core MVP (สำหรับตัวเอง)
- ระบบ Auth (single user)
- CRUD เอกสาร 6 ประเภท
- PDF Export ตามรูปแบบตัวอย่าง
- Document history & search
- Monthly summary dashboard
- Google Drive auto-backup

### Phase 2: Multi-Tenant SaaS
- ระบบสมัครสมาชิก & Organization management
- แยกข้อมูลแต่ละบริษัท (tenant isolation)
- Company profile & branding customization
- Pricing tiers

### Phase 3: Advanced Features
- Import จาก Excel/CSV/PDF (OCR)
- AI-assisted data extraction from invoices
- e-Tax Invoice integration (กรมสรรพากร)
- API สำหรับ third-party integration

---

*Document created by John (Product Manager) — April 15, 2026*
*Organization: บริษัท เอ็ม เอ็น กรุ๊ป 2021 จำกัด*
