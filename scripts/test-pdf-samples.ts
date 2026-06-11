// สคริปต์ทดสอบ render PDF เทียบกับเอกสารตัวอย่าง (ใช้ข้อมูลจำลองตามตัวอย่างจริง)
// รัน: npx tsx scripts/test-pdf-samples.ts → ได้ไฟล์ใน /tmp/pdf-test/
import fs from 'fs'
import { generateAccountingPdf } from '../src/lib/pdf'

const tenant = {
  name: 'บริษัท เอ็ม เอ็น กรุ๊ป 2021 จำกัด',
  branch: 'สำนักงานใหญ่',
  address: '38/1 หมู่ที่ 14 ตำบลป่าตึง อำเภอแม่จัน จังหวัดเชียงราย 57110',
  taxId: '0575564000060',
  phone: '0860180929',
}

const outDir = '/tmp/pdf-test'
fs.mkdirSync(outDir, { recursive: true })

// รูปจำลองสำหรับเช็คตำแหน่งลายเซ็น/ตราประทับ (ถ้ามีไฟล์)
function imageAsset(filePath: string) {
  if (!fs.existsSync(filePath)) return null
  return { dataUrl: `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`, format: 'PNG' as const }
}
const signature = imageAsset(`${outDir}/signature.png`)
const stamp = imageAsset(`${outDir}/stamp.png`)

// 1) INV แบบราคารวม VAT + หัก ณ ที่จ่าย + หมายเหตุ (ตาม INV2026040001)
const inv1 = generateAccountingPdf({
  doc: {
    docType: 'INV',
    docNumber: 'INV2026040001',
    date: new Date('2026-04-06T00:00:00+07:00').getTime() / 1000,
    subtotal: 2792.09,
    vatAmount: 195.45,
    totalAmount: 2987.54,
    withholdingTax: 83.76,
    notes: 'Payment Advice ID 661019',
  },
  lineItems: [
    { description: 'Affiliate Lazada ค่าคอม ช่วงวันที่ 15 - 31 มีนาคม 2569', quantity: 1, unitPrice: 2987.54, amount: 2987.54 },
  ],
  contact: {
    name: 'Lazada Limited',
    branch: 'สำนักงานใหญ่',
    address: 'Unit 2901, 29th floor Bhiraj Tower, 689 Sukhumvit Road, North Klongton Subdistrict, Vadhana District, Bangkok 10110',
    taxId: '0105555040244',
  },
  tenant,
  sellerName: 'มูญาฮิด กาแบ',
  metadata: {
    priceIncludesVat: 'true',
    withholdingTaxRate: '3',
    paymentMethod: 'โอนเงิน',
    bankName: 'กสิกรไทย ออมทรัพย์',
    bankAccount: '0858085209',
    paymentDate: '2026-04-06',
  },
  docTypeLabel: 'ใบกำกับภาษี/ใบเสร็จรับเงิน',
  logo: null,
  signature,
  stamp,
})
fs.writeFileSync(`${outDir}/INV-with-wht-notes.pdf`, inv1)

// 2) INV ลูกค้าบุคคล มีเบอร์โทร ไม่มีหัก ณ ที่จ่าย (ตาม INV2026040003)
const inv2 = generateAccountingPdf({
  doc: {
    docType: 'INV',
    docNumber: 'INV2026040003',
    date: new Date('2026-04-20T00:00:00+07:00').getTime() / 1000,
    subtotal: 457.94,
    vatAmount: 32.06,
    totalAmount: 490,
    withholdingTax: 0,
    notes: '',
  },
  lineItems: [
    { description: 'ค่าแพ็คเกจ License Plus 30 วัน AZ Creator Extension', quantity: 1, unitPrice: 490, amount: 490 },
  ],
  contact: {
    name: 'กิตติศักดิ์ สิงห์รักษ์',
    branch: 'สำนักงานใหญ่',
    address: '120 ม.2 ต.สวนเมี่ยง อ.ชาติตระการ จ.พิษณุโลก 65170',
    taxId: '1650200154390',
    phone: '0623630885',
  },
  tenant,
  sellerName: 'มูญาฮิด กาแบ',
  metadata: {
    priceIncludesVat: 'true',
    paymentMethod: 'โอนเงิน',
    bankName: 'กสิกรไทย ออมทรัพย์',
    bankAccount: '3702338963',
    paymentDate: '2026-04-20',
  },
  docTypeLabel: 'ใบกำกับภาษี/ใบเสร็จรับเงิน',
  logo: null,
  signature,
  stamp,
})
fs.writeFileSync(`${outDir}/INV-phone-no-wht.pdf`, inv2)

// 3) EXP ภาษีมูลค่าเพิ่ม 0% + ส่วนลด (ตาม EXP2026040003)
const exp = generateAccountingPdf({
  doc: {
    docType: 'EXP',
    docNumber: 'EXP2026040003',
    date: new Date('2026-04-01T00:00:00+07:00').getTime() / 1000,
    subtotal: 434,
    vatAmount: 0,
    totalAmount: 434,
    withholdingTax: 0,
  },
  lineItems: [
    { description: 'หมวก เขียว', category: 'ซื้อสินค้าไว้ขาย', quantity: 8, unit: 'ชิ้น', unitPrice: 119, amount: 952 },
    { description: 'ค่าจัดส่ง', category: 'ค่าขนส่งสินค้า/ลอจิสติกส์', quantity: 1, unit: '', unitPrice: 38, amount: 38 },
  ],
  contact: { name: 'ร้าน babyhouse88 (Shopee)', branch: 'สำนักงานใหญ่' },
  tenant,
  sellerName: 'มูญาฮิด กาแบ',
  metadata: {
    preparerName: 'มูญาฮิด กาแบ',
    discountAmount: '556',
    paymentMethod: 'บัตรเครดิต',
    bankName: 'กสิกรไทย',
    bankAccount: '****-****-****-7722',
    paymentDate: '2026-04-01',
    paymentAmount: '434',
  },
  docTypeLabel: 'บันทึกค่าใช้จ่าย',
  logo: null,
  signature,
  stamp,
})
fs.writeFileSync(`${outDir}/EXP-vat0.pdf`, exp)

// 4) WT 2 รายการ คนละหมวด (ตาม WT2026040001)
const wt = generateAccountingPdf({
  doc: {
    docType: 'WT',
    docNumber: 'WT2026040001',
    date: new Date('2026-04-30T00:00:00+07:00').getTime() / 1000,
    subtotal: 4205.36,
    vatAmount: 0,
    totalAmount: 4205.36,
    withholdingTax: 54.92,
  },
  lineItems: [
    { description: 'ค่าขนส่ง', quantity: 1, unitPrice: 3562, amount: 3562, taxRate: 1, incomeCategoryCode: '5' },
    { description: 'ค่าบริการ', quantity: 1, unitPrice: 643.36, amount: 643.36, taxRate: 3, incomeCategoryCode: '6' },
  ],
  contact: {
    name: 'บริษัท โกชิปป์ จำกัด',
    branch: 'สำนักงานใหญ่',
    address: 'เลขที่ 9/23 ซอย01 กาญจนาภิเษก 10/1 แขวงรามอินทรา เขตคันนายาว กรุงเทพมหานคร 10230',
    taxId: '0105564027336',
  },
  tenant,
  sellerName: 'มูญาฮิด กาแบ',
  metadata: {
    filingForm: 'ภ.ง.ด.53',
    taxRate: '3',
    paymentDate: '2026-04-30',
    certificateDate: '2026-04-30',
    payerTaxCondition: 'หัก ณ ที่จ่าย',
  },
  docTypeLabel: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย',
  logo: null,
  signature,
  stamp,
})
fs.writeFileSync(`${outDir}/WT-full-form.pdf`, wt)

console.log('PDFs written to', outDir)
