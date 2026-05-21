import fs from 'fs'
import path from 'path'
import { jsPDF } from 'jspdf'
import { getDocumentById } from '@/db/queries/documents'
import { amountInThaiWords, formatNumber, getPdfFilename } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType, tenants, users } from '@/db/schema'
import { db } from '@/db'
import { eq } from 'drizzle-orm'

type PdfResult = { pdf: Buffer; filename: string; isHtml: false }

type ImageAsset = {
  dataUrl: string
  format: 'PNG' | 'JPEG'
}

const PAGE_WIDTH = 595.28
const BLUE = '#2a9bd4'
const DARK = '#111827'
const LINE = '#cfcfcf'

export async function generatePdfBuffer(id: string, tenantId: string): Promise<PdfResult | null> {
  const doc = await getDocumentById(id, tenantId)
  if (!doc) return null

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  const [seller] = await db.select({ name: users.name }).from(users).where(eq(users.id, tenantId)).limit(1)

  const lineItems = parseJson<any[]>(doc.lineItems, [])
  const contact = doc.contactSnapshot ? parseJson<Record<string, any> | null>(doc.contactSnapshot, null) : null
  const metadata = parseJson<Record<string, string>>(doc.metadata || '{}', {})
  const docTypeLabel = getPdfDocTitle(doc.docType as DocType, DOC_TYPE_LABELS[doc.docType as DocType] || doc.docType)

  const [logo, signature] = await Promise.all([
    getImageAsset(tenant?.logoUrl),
    getImageAsset(metadata.signatureUrl),
  ])

  const pdf = generateAccountingPdf({
    doc,
    lineItems,
    contact,
    tenant,
    sellerName: metadata.sellerName || seller?.name || '',
    metadata,
    docTypeLabel,
    logo,
    signature,
  })

  const partnerName = contact?.name || 'noname'
  const filename = getPdfFilename(tenant?.name || 'company', doc.docNumber, partnerName)

  return { pdf, filename, isHtml: false }
}

export function generateAccountingPdf({ doc, lineItems, contact, tenant, sellerName, metadata, docTypeLabel, logo, signature }: any): Buffer {
  const pdf = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait',
    compress: true,
    putOnlyUsedFonts: true,
  })

  registerThaiFonts(pdf)
  pdf.setProperties({
    title: `${doc.docNumber} ${docTypeLabel}`,
    subject: docTypeLabel,
    author: tenant?.name || 'AccountThai',
    creator: 'AccountThai',
  })

  if (doc.docType === 'WT') {
    drawWithholdingTaxCertificate(pdf, { doc, lineItems, contact, tenant, metadata, signature })
  } else if (doc.docType === 'EXP') {
    drawExpenseHeader(pdf, { doc, tenant, contact, sellerName, metadata })
    const afterItemsY = drawExpenseItemsTable(pdf, lineItems, metadata, 170)
    const totalsBottomY = drawExpenseTotals(pdf, doc, metadata, Math.max(afterItemsY + 20, 300), lineItems)
    drawExpensePaymentAndSignatures(pdf, { doc, metadata, startY: Math.max(totalsBottomY + 40, 640) })
  } else {
    drawPageBase(pdf)
    drawHeader(pdf, { doc, tenant, contact, sellerName, docTypeLabel, logo })
    const afterItemsY = drawItemsTable(pdf, lineItems, 252)
    const totalsBottomY = drawTotals(pdf, doc, Math.max(afterItemsY + 18, 315), lineItems, metadata)
    if (doc.docType === 'QT') {
      drawQuoteTermsAndSignatures(pdf, {
        doc,
        tenant,
        contact,
        metadata,
        signature,
        startY: Math.max(totalsBottomY + 24, 640),
      })
    } else {
      drawPaymentAndSignatures(pdf, {
        doc,
        tenant,
        contact,
        metadata,
        signature,
        startY: Math.max(totalsBottomY + 24, 666),
      })
    }
  }

  return Buffer.from(pdf.output('arraybuffer') as ArrayBuffer)
}

function registerThaiFonts(pdf: jsPDF) {
  const normalPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew.ttf')
  const boldPath = path.join(process.cwd(), 'public', 'fonts', 'THSarabunNew-Bold.ttf')
  const normalFont = fs.readFileSync(normalPath).toString('base64')
  const boldFont = fs.readFileSync(boldPath).toString('base64')

  pdf.addFileToVFS('THSarabunNew.ttf', normalFont)
  pdf.addFont('THSarabunNew.ttf', 'THSarabun', 'normal')
  pdf.addFileToVFS('THSarabunNew-Bold.ttf', boldFont)
  pdf.addFont('THSarabunNew-Bold.ttf', 'THSarabun', 'bold')
  pdf.setFont('THSarabun', 'normal')
}

function drawPageBase(pdf: jsPDF) {
  pdf.setFillColor(BLUE)
  pdf.triangle(PAGE_WIDTH - 60, 12, PAGE_WIDTH - 12, 12, PAGE_WIDTH - 12, 82, 'F')
  text(pdf, '1', PAGE_WIDTH - 29, 38, { size: 18, color: '#ffffff', align: 'center' })
}

function drawHeader(pdf: jsPDF, { doc, tenant, contact, sellerName, docTypeLabel, logo }: any) {
  const companyName = withBranch(tenant?.name || 'บริษัทของคุณ', tenant?.branch)
  const contactName = contact?.name ? withBranch(contact.name, contact.branch) : ''

  if (logo) {
    drawImage(pdf, logo, 36, 32, 58, 58)
  } else {
    drawLogoFallback(pdf, tenant?.name || '')
  }

  let y = 106
  text(pdf, companyName, 36, y, { size: 13, style: 'bold' })
  y += 16
  y = wrappedText(pdf, tenant?.address || '', 36, y, 260, { size: 12, lineHeight: 14 })
  if (tenant?.taxId) {
    text(pdf, `เลขประจำตัวผู้เสียภาษี ${tenant.taxId}`, 36, y, { size: 12 })
    y += 16
  }
  if (tenant?.phone) text(pdf, `โทร. ${tenant.phone}`, 36, y, { size: 12 })

  text(pdf, docTypeLabel, 422, 70, { size: 20, color: BLUE, align: 'center' })
  text(pdf, getDocumentSubtitle(doc.docType), 422, 86, { size: 12, color: BLUE, align: 'center' })
  pdf.setDrawColor(LINE)
  pdf.line(312, 101, 540, 101)
  pdf.line(312, doc.dueDate ? 176 : 158, 540, doc.dueDate ? 176 : 158)

  const infoY = 121
  text(pdf, 'เลขที่', 318, infoY, { size: 12, color: BLUE, style: 'bold' })
  text(pdf, doc.docNumber, 402, infoY, { size: 12 })
  text(pdf, 'วันที่', 318, infoY + 17, { size: 12, color: BLUE, style: 'bold' })
  text(pdf, formatDateForPdf(doc.date), 402, infoY + 17, { size: 12 })
  text(pdf, getDocumentOwnerLabel(doc.docType), 318, infoY + 34, { size: 12, color: BLUE, style: 'bold' })
  text(pdf, sellerName || '-', 402, infoY + 34, { size: 12 })
  if (doc.dueDate) {
    text(pdf, getDueDateLabel(doc.docType), 318, infoY + 51, { size: 12, color: BLUE, style: 'bold' })
    text(pdf, formatDateForPdf(doc.dueDate), 402, infoY + 51, { size: 12 })
  }

  text(pdf, getCounterpartyLabel(doc.docType), 36, 182, { size: 13, color: BLUE, style: 'bold' })
  if (contact) {
    let customerY = 199
    text(pdf, contactName, 36, customerY, { size: 12.5, style: 'bold' })
    customerY += 15
    customerY = wrappedText(pdf, contact.address || '', 36, customerY, 350, { size: 12, lineHeight: 14 })
    if (contact.taxId) text(pdf, `เลขประจำตัวผู้เสียภาษี ${contact.taxId}`, 36, customerY, { size: 12 })
  } else {
    text(pdf, '-', 36, 199, { size: 12 })
  }
}

function drawItemsTable(pdf: jsPDF, lineItems: any[], startY: number) {
  const x = 36
  const width = 523
  let y = startY
  const col = {
    no: x + 16,
    desc: x + 44,
    qty: x + 340,
    unitPrice: x + 452,
    amount: x + width - 4,
  }

  const drawHeader = () => {
    pdf.setDrawColor(LINE)
    pdf.line(x, y, x + width, y)
    y += 17
    text(pdf, '#', col.no, y, { size: 12, align: 'center', style: 'bold' })
    text(pdf, 'รายละเอียด', x + 180, y, { size: 12, align: 'center', style: 'bold' })
    text(pdf, 'จำนวน', col.qty, y, { size: 12, align: 'center', style: 'bold' })
    text(pdf, 'ราคาต่อหน่วย', col.unitPrice, y, { size: 12, align: 'right', style: 'bold' })
    text(pdf, 'ยอดรวม', col.amount, y, { size: 12, align: 'right', style: 'bold' })
    y += 8
    pdf.line(x, y, x + width, y)
  }

  drawHeader()

  lineItems.forEach((item, index) => {
    const descLines = splitText(pdf, item.description || '-', 285, 12)
    const rowHeight = Math.max(18, descLines.length * 13 + 5)
    if (y + rowHeight > 610) {
      pdf.addPage()
      drawPageBase(pdf)
      y = 48
      drawHeader()
    }

    const baseline = y + 14
    text(pdf, String(index + 1), col.no, baseline, { size: 12, align: 'center' })
    descLines.forEach((line, lineIndex) => {
      text(pdf, line, col.desc, baseline + lineIndex * 13, { size: 12 })
    })
    text(pdf, formatQuantity(item.quantity), col.qty, baseline, { size: 12, align: 'center' })
    text(pdf, money(item.unitPrice), col.unitPrice, baseline, { size: 12, align: 'right' })
    text(pdf, money(item.amount), col.amount, baseline, { size: 12, align: 'right' })
    y += rowHeight
    pdf.setDrawColor('#e1e1e1')
    pdf.line(x, y, x + width, y)
  })

  return y
}

function drawTotals(pdf: jsPDF, doc: any, startY: number, lineItems: any[] = [], metadata: Record<string, string> = {}) {
  const labelX = 458
  const amountX = 557
  let y = startY
  const subtotal = numberValue(doc.subtotal)
  const vatAmount = numberValue(doc.vatAmount)
  const totalAmount = numberValue(doc.totalAmount)
  const withholdingTax = numberValue(doc.withholdingTax)
  const netPayable = Math.max(totalAmount - withholdingTax, 0)
  const lineItemsTotal = roundMoney(lineItems.reduce((sum, item) => sum + numberValue(item.amount), 0))
  const discountRate = Math.min(Math.max(numberValue(metadata.discountRate), 0), 100)
  const discount = roundMoney(lineItemsTotal * discountRate / 100)
  const afterDiscount = Math.max(lineItemsTotal - discount, 0)
  const priceIncludesVat = metadata.priceIncludesVat === 'true'
  const showEnteredTotal = priceIncludesVat || discount > 0

  row('รวมเป็นเงิน', showEnteredTotal && lineItemsTotal > 0 ? lineItemsTotal : subtotal, false)
  if (discount > 0) {
    row(`ส่วนลด ${formatRate(discountRate)}%`, discount, false)
    row('ราคาหลังหักส่วนลด', afterDiscount, false)
  }
  if (priceIncludesVat) {
    row('จำนวนเงินรวมทั้งสิ้น', totalAmount, true)
    if (vatAmount > 0) row('ภาษีมูลค่าเพิ่ม 7%', vatAmount, false)
    row('ราคาไม่รวมภาษีมูลค่าเพิ่ม', subtotal, false)
  } else {
    if (vatAmount > 0) row('ภาษีมูลค่าเพิ่ม 7%', vatAmount, false)
    row('จำนวนเงินรวมทั้งสิ้น', totalAmount, true)
  }

  const amountWords = `(${amountInThaiWords(totalAmount)})`
  wrappedText(pdf, amountWords, 36, startY + 58, 250, { size: 12, lineHeight: 14 })

  if (withholdingTax > 0) {
    const withholdingRate = numberValue(metadata.withholdingTaxRate) || (subtotal > 0 ? Math.round((withholdingTax / subtotal) * 10000) / 100 : 0)
    y += 13
    pdf.setDrawColor(LINE)
    pdf.line(330, y, 559, y)
    y += 19
    row(`หักภาษี ณ ที่จ่าย ${formatRate(withholdingRate)}%`, withholdingTax, false)
    row('ยอดชำระ', netPayable, true)
  }

  return y

  function row(label: string, amount: number, bold: boolean) {
    text(pdf, label, labelX, y, { size: 12, color: BLUE, align: 'right', style: bold ? 'bold' : 'normal' })
    text(pdf, `${money(amount)} บาท`, amountX, y, { size: 12, align: 'right', style: bold ? 'bold' : 'normal' })
    y += 18
  }
}

function drawPaymentAndSignatures(pdf: jsPDF, { doc, tenant, contact, metadata, signature, startY }: any) {
  let paymentY = startY
  if (paymentY > 680) {
    pdf.addPage()
    drawPageBase(pdf)
    paymentY = 104
  }
  const paymentMethod = metadata.paymentMethod || ''
  const bankName = metadata.bankName || ''
  const bankAccount = metadata.bankAccount || ''
  const paymentDate = metadata.paymentDate ? formatDateInput(metadata.paymentDate) : formatDateForPdf(doc.date)
  const paidAmount = numberValue(metadata.paymentAmount) || Math.max(numberValue(doc.totalAmount) - numberValue(doc.withholdingTax), 0)

  text(pdf, 'การชำระเงินจะสมบูรณ์เมื่อบริษัทได้รับเงินเรียบร้อยแล้ว', 36, paymentY, { size: 12 })
  const methods = ['เงินสด', 'เช็ค', 'โอนเงิน', 'บัตรเครดิต']
  let x = 230
  methods.forEach((method) => {
    drawCheckbox(pdf, x, paymentY - 11, paymentMethod === method)
    text(pdf, method, x + 16, paymentY, { size: 11 })
    x += method === 'บัตรเครดิต' ? 72 : 54
  })

  const rowY = paymentY + 22
  text(pdf, 'ธนาคาร', 36, rowY, { size: 12 })
  text(pdf, bankName || '-', 94, rowY, { size: 12 })
  text(pdf, 'เลขที่', 190, rowY, { size: 12 })
  text(pdf, bankAccount || '-', 250, rowY, { size: 12 })
  text(pdf, 'วันที่', 352, rowY, { size: 12 })
  text(pdf, paymentDate, 395, rowY, { size: 12 })
  text(pdf, 'จำนวนเงิน', 470, rowY, { size: 12 })
  text(pdf, money(paidAmount), 558, rowY, { size: 12, align: 'right' })
  pdf.setDrawColor(LINE)
  pdf.line(36, rowY + 4, 559, rowY + 4)

  const payerName = contact?.name ? withBranch(contact.name, contact.branch) : ''
  const receiverName = tenant?.name || ''
  text(pdf, `ในนาม ${payerName || '-'}`, 36, rowY + 35, { size: 12 })
  text(pdf, `ในนาม ${receiverName || '-'}`, 420, rowY + 35, { size: 12, align: 'center' })

  if (signature) {
    drawImage(pdf, signature, 366, rowY + 59, 88, 38)
  }

  const dateY = rowY + 100
  text(pdf, paymentDate, 502, dateY - 8, { size: 12, align: 'center' })
  pdf.line(36, dateY, 132, dateY)
  pdf.line(142, dateY, 238, dateY)
  pdf.line(360, dateY, 456, dateY)
  pdf.line(466, dateY, 558, dateY)

  text(pdf, 'ผู้จ่ายเงิน', 84, dateY + 16, { size: 12, align: 'center' })
  text(pdf, 'วันที่', 190, dateY + 16, { size: 12, align: 'center' })
  text(pdf, 'ผู้รับเงิน', 408, dateY + 16, { size: 12, align: 'center' })
  text(pdf, 'วันที่', 512, dateY + 16, { size: 12, align: 'center' })
}

function drawQuoteTermsAndSignatures(pdf: jsPDF, { doc, tenant, contact, metadata, signature, startY }: any) {
  let y = startY
  if (y > 680) {
    pdf.addPage()
    drawPageBase(pdf)
    y = 104
  }

  const terms = metadata.paymentTerms || metadata.validityNote || doc.notes || 'ราคานี้ยังไม่รวมเงื่อนไขเพิ่มเติม'
  text(pdf, 'เงื่อนไข / หมายเหตุ', 36, y, { size: 12, color: BLUE, style: 'bold' })
  y = wrappedText(pdf, terms, 36, y + 18, 520, { size: 12, lineHeight: 14 })

  let signY = Math.max(y + 54, 724)
  if (signY > 790) {
    pdf.addPage()
    drawPageBase(pdf)
    signY = 220
  }

  const customerName = contact?.name ? withBranch(contact.name, contact.branch) : ''
  text(pdf, `ในนาม ${tenant?.name || '-'}`, 150, signY - 36, { size: 12, align: 'center' })
  text(pdf, customerName ? `ในนาม ${customerName}` : 'ผู้อนุมัติ / ลูกค้า', 445, signY - 36, { size: 12, align: 'center' })

  if (signature) {
    drawImage(pdf, signature, 106, signY - 72, 88, 38)
  }

  text(pdf, formatDateForPdf(doc.date), 150, signY - 8, { size: 12, align: 'center' })
  pdf.setDrawColor(LINE)
  pdf.line(72, signY, 228, signY)
  pdf.line(367, signY, 523, signY)
  text(pdf, 'ผู้เสนอราคา', 150, signY + 16, { size: 12, align: 'center' })
  text(pdf, 'ผู้อนุมัติ', 445, signY + 16, { size: 12, align: 'center' })
}

function drawExpenseHeader(pdf: jsPDF, { doc, tenant, contact, sellerName, metadata }: any) {
  const companyName = withBranch(tenant?.name || 'บริษัทของคุณ', tenant?.branch)
  const preparerName = metadata.preparerName || sellerName || '-'

  text(pdf, 'บันทึกค่าใช้จ่าย', 36, 34, { size: 18, color: BLUE, style: 'bold' })
  text(pdf, 'Expense Note', 36, 50, { size: 12, color: BLUE })

  let y = 70
  text(pdf, companyName, 36, y, { size: 12.5, style: 'bold' })
  y += 15
  y = wrappedText(pdf, tenant?.address || '', 36, y, 305, { size: 12, lineHeight: 14 })
  if (tenant?.taxId) {
    text(pdf, `เลขประจำตัวผู้เสียภาษี ${tenant.taxId}`, 36, y, { size: 12 })
    y += 15
  }
  if (tenant?.phone) text(pdf, `โทร. ${tenant.phone}`, 36, y, { size: 12 })

  const labelX = 383
  const valueX = 482
  text(pdf, 'เลขที่/Document no.:', labelX, 74, { size: 12, color: BLUE })
  text(pdf, doc.docNumber, valueX, 74, { size: 12 })
  text(pdf, 'วันที่/Date:', labelX, 91, { size: 12, color: BLUE })
  text(pdf, formatDateForPdf(doc.date), valueX, 91, { size: 12 })
  text(pdf, 'ผู้จัดทำ/Preparer:', labelX, 124, { size: 12, color: BLUE })
  text(pdf, preparerName, valueX, 124, { size: 12 })

  text(pdf, 'ผู้จำหน่าย/Vendor:', 36, 145, { size: 12, color: BLUE, style: 'bold' })
  text(pdf, contact?.name || '-', 36, 160, { size: 12.5 })
}

function drawExpenseItemsTable(pdf: jsPDF, lineItems: any[], metadata: Record<string, string>, startY: number) {
  const x = 36
  const width = 523
  let y = startY
  const col = {
    no: x + 18,
    desc: x + 54,
    category: x + 246,
    quantity: x + 371,
    unitPrice: x + 456,
    amount: x + width - 6,
  }

  const drawHeader = () => {
    pdf.setFillColor(BLUE)
    pdf.rect(x, y, width, 24, 'F')
    text(pdf, 'ลำดับ', col.no, y + 10, { size: 9, color: '#ffffff', align: 'center', style: 'bold' })
    text(pdf, 'No.', col.no, y + 21, { size: 8.5, color: '#ffffff', align: 'center' })
    text(pdf, 'รายละเอียด', col.desc + 92, y + 10, { size: 9, color: '#ffffff', align: 'center', style: 'bold' })
    text(pdf, 'Description', col.desc + 92, y + 21, { size: 8.5, color: '#ffffff', align: 'center' })
    text(pdf, 'หมวดหมู่', col.category + 50, y + 10, { size: 9, color: '#ffffff', align: 'center', style: 'bold' })
    text(pdf, 'Category', col.category + 50, y + 21, { size: 8.5, color: '#ffffff', align: 'center' })
    text(pdf, 'จำนวน', col.quantity, y + 10, { size: 9, color: '#ffffff', align: 'center', style: 'bold' })
    text(pdf, 'Unit price', col.quantity, y + 21, { size: 8.5, color: '#ffffff', align: 'center' })
    text(pdf, 'ราคาต่อหน่วย', col.unitPrice, y + 10, { size: 9, color: '#ffffff', align: 'right', style: 'bold' })
    text(pdf, 'Price per unit', col.unitPrice, y + 21, { size: 8.5, color: '#ffffff', align: 'right' })
    text(pdf, 'ยอดรวม', col.amount, y + 10, { size: 9, color: '#ffffff', align: 'right', style: 'bold' })
    text(pdf, 'Total', col.amount, y + 21, { size: 8.5, color: '#ffffff', align: 'right' })
    y += 24
  }

  drawHeader()

  lineItems.forEach((item, index) => {
    const descLines = splitText(pdf, item.description || '-', 170, 12)
    const categoryLines = splitText(pdf, item.category || metadata.expenseCategory || '-', 110, 12)
    const rowHeight = Math.max(20, Math.max(descLines.length, categoryLines.length) * 13 + 7)

    if (y + rowHeight > 585) {
      pdf.addPage()
      y = 48
      drawHeader()
    }

    const baseline = y + 15
    text(pdf, String(index + 1), col.no, baseline, { size: 12, align: 'center' })
    descLines.forEach((line, lineIndex) => text(pdf, line, col.desc, baseline + lineIndex * 13, { size: 12 }))
    categoryLines.forEach((line, lineIndex) => text(pdf, line, col.category, baseline + lineIndex * 13, { size: 12 }))
    text(pdf, formatQtyWithUnit(item), col.quantity, baseline, { size: 12, align: 'center' })
    text(pdf, money(item.unitPrice), col.unitPrice, baseline, { size: 12, align: 'right' })
    text(pdf, money(item.amount), col.amount, baseline, { size: 12, align: 'right' })

    y += rowHeight
    pdf.setDrawColor('#777777')
    pdf.line(x, y, x + width, y)
  })

  return y
}

function drawExpenseTotals(pdf: jsPDF, doc: any, metadata: Record<string, string>, startY: number, lineItems: any[] = []) {
  const subtotal = numberValue(doc.subtotal)
  const lineItemsTotal = roundMoney(lineItems.reduce((sum, item) => sum + numberValue(item.amount), 0))
  const displaySubtotal = lineItemsTotal > 0 ? lineItemsTotal : subtotal
  const discount = Math.min(numberValue(metadata.discountAmount), displaySubtotal)
  const afterDiscount = Math.max(displaySubtotal - discount, 0)
  const vatAmount = numberValue(doc.vatAmount)
  const totalAmount = numberValue(doc.totalAmount)
  const priceIncludesVat = metadata.priceIncludesVat === 'true'
  const vatRate = deriveVatRate(vatAmount, subtotal)
  let y = startY

  row('รวมเป็นเงิน', displaySubtotal, false)
  row('ส่วนลด', discount, false)
  row('จำนวนเงินหลังหักส่วนลด', afterDiscount, false)
  if (priceIncludesVat) {
    row('จำนวนเงินรวมทั้งสิ้น', totalAmount, true)
    if (vatAmount > 0) row(`ภาษีมูลค่าเพิ่ม ${formatRate(vatRate)}%`, vatAmount, false)
    row('ราคาไม่รวมภาษีมูลค่าเพิ่ม', subtotal, false)
  } else {
    if (vatAmount > 0) row(`ภาษีมูลค่าเพิ่ม ${formatRate(vatRate)}%`, vatAmount, false)
    row('จำนวนเงินรวมทั้งสิ้น', totalAmount, true)
  }

  wrappedText(pdf, `(${amountInThaiWords(totalAmount)})`, 36, startY + 86, 260, { size: 12, lineHeight: 14 })
  return y

  function row(label: string, amount: number, bold: boolean) {
    text(pdf, label, 454, y, { size: 12, color: BLUE, align: 'right', style: bold ? 'bold' : 'normal' })
    text(pdf, `${money(amount)} บาท`, 557, y, { size: 12, align: 'right', style: bold ? 'bold' : 'normal' })
    y += 18
  }
}

function drawExpensePaymentAndSignatures(pdf: jsPDF, { doc, metadata, startY }: any) {
  let y = startY
  if (y > 665) {
    pdf.addPage()
    y = 80
  }

  const paymentMethod = metadata.paymentMethod || ''
  const bankName = metadata.bankName || ''
  const bankAccount = metadata.bankAccount || ''
  const paymentDate = metadata.paymentDate ? formatDateInput(metadata.paymentDate) : formatDateForPdf(doc.date)
  const amountPaid = numberValue(metadata.paymentAmount) || Math.max(numberValue(doc.totalAmount) - numberValue(doc.withholdingTax), 0)
  const withholdingTax = numberValue(doc.withholdingTax)

  text(pdf, 'รายละเอียดการชำระเงิน/Payment details', 36, y, { size: 12.5, color: BLUE, style: 'bold' })
  y += 17
  text(pdf, 'ช่องทางการชำระเงิน/Payment method:', 36, y, { size: 11 })

  const methods = [
    { value: 'เงินสด', label: 'เงินสด/Cash', x: 180 },
    { value: 'เช็ค', label: 'เช็ค/Cheque', x: 250 },
    { value: 'โอนเงิน', label: 'โอนเงิน/Transfer', x: 330 },
    { value: 'บัตรเครดิต', label: 'บัตรเครดิต/Credit card', x: 420 },
  ]
  methods.forEach(method => {
    drawCheckbox(pdf, method.x, y - 11, paymentMethodMatches(paymentMethod, method.value))
    text(pdf, method.label, method.x + 16, y, { size: 11 })
  })

  y += 17
  text(pdf, 'ธนาคาร/Bank', 36, y, { size: 11 })
  text(pdf, bankName || '-', 132, y, { size: 11 })
  pdf.line(84, y + 3, 220, y + 3)
  text(pdf, 'เลขที่/No.', 224, y, { size: 11 })
  text(pdf, bankAccount || '-', 302, y, { size: 11 })
  pdf.line(264, y + 3, 380, y + 3)
  text(pdf, 'วันที่ชำระ/Payment date', 384, y, { size: 11 })
  text(pdf, paymentDate, 542, y, { size: 11, align: 'right' })
  pdf.line(476, y + 3, 559, y + 3)

  y += 17
  text(pdf, 'ยอดชำระ/Amount paid', 36, y, { size: 11 })
  text(pdf, money(amountPaid), 196, y, { size: 11 })
  pdf.line(120, y + 3, 300, y + 3)
  text(pdf, 'หัก ณ ที่จ่าย/Amount withheld', 304, y, { size: 11 })
  text(pdf, money(withholdingTax), 538, y, { size: 11, align: 'right' })
  pdf.line(408, y + 3, 559, y + 3)

  const signatureY = y + 50
  const boxes = [
    { label: 'ผู้รับเงิน/Received by', x: 36, center: 114 },
    { label: 'ผู้จัดทำ/Prepared by', x: 220, center: 298 },
    { label: 'ผู้อนุมัติ/Approved by', x: 405, center: 483 },
  ]

  boxes.forEach(box => {
    text(pdf, box.label, box.center, signatureY, { size: 11, align: 'center' })
    pdf.line(box.x, signatureY + 34, box.x + 154, signatureY + 34)
    text(pdf, '(', box.x, signatureY + 62, { size: 12 })
    text(pdf, ')', box.x + 154, signatureY + 62, { size: 12, align: 'right' })
    pdf.line(box.x + 8, signatureY + 60, box.x + 146, signatureY + 60)
    text(pdf, 'วันที่/Date:', box.x, signatureY + 82, { size: 11 })
  })
}

function drawWithholdingTaxCertificate(pdf: jsPDF, { doc, lineItems, contact, tenant, metadata, signature }: any) {
  const marginX = 28
  const width = 539
  const payerName = withBranch(tenant?.name || 'บริษัทของคุณ', tenant?.branch)
  const payeeName = contact?.name ? withBranch(contact.name, contact.branch) : '-'
  const filingForm = metadata.filingForm || 'ภ.ง.ด.53'
  const incomeCategoryCode = metadata.incomeCategoryCode || '5'
  const paymentDate = metadata.paymentDate ? formatDateInput(metadata.paymentDate) : formatDateForPdf(doc.date)
  const certificateDate = metadata.certificateDate ? formatDateInput(metadata.certificateDate) : formatDateForPdf(doc.date)
  const subtotal = numberValue(doc.subtotal)
  const withholdingTax = numberValue(doc.withholdingTax)

  pdf.setDrawColor('#000000')
  pdf.setLineWidth(0.8)
  text(pdf, 'ฉบับที่ 1    (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)', marginX + 2, 24, { size: 10, style: 'bold' })
  text(pdf, 'ฉบับที่ 2    (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)', marginX + 2, 38, { size: 10, style: 'bold' })

  pdf.rect(marginX, 45, width, 738)
  text(pdf, 'หนังสือรับรองการหักภาษี ณ ที่จ่าย', 298, 63, { size: 18, align: 'center', style: 'bold' })
  text(pdf, 'ตามมาตรา 50 ทวิแห่งประมวลรัษฎากร', 298, 80, { size: 12, align: 'center', style: 'bold' })
  text(pdf, 'เล่มที่', 460, 63, { size: 11 })
  dottedLine(pdf, 490, 63, 558)
  text(pdf, metadata.certificateBookNo || '', 524, 62, { size: 10, align: 'center' })
  text(pdf, 'เลขที่', 460, 80, { size: 11 })
  dottedLine(pdf, 490, 80, 558)
  text(pdf, doc.docNumber, 524, 79, { size: 10, align: 'center' })

  drawPartyBox(pdf, {
    x: marginX + 12,
    y: 90,
    width: width - 24,
    title: 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย : -',
    name: payerName,
    taxId: tenant?.taxId || '',
    secondaryTaxId: '',
    address: tenant?.address || '',
  })

  drawPartyBox(pdf, {
    x: marginX + 12,
    y: 158,
    width: width - 24,
    title: 'ผู้ถูกหักภาษี ณ ที่จ่าย : -',
    name: payeeName,
    taxId: contact?.taxId || '',
    secondaryTaxId: '',
    address: contact?.address || '',
  })

  const formY = 228
  roundedBox(pdf, marginX + 12, formY, width - 24, 44, 3)
  text(pdf, 'ลำดับที่', marginX + 18, formY + 14, { size: 11, style: 'bold' })
  pdf.rect(marginX + 58, formY + 6, 66, 19)
  text(pdf, metadata.sequenceNumber || '', marginX + 91, formY + 20, { size: 10, align: 'center' })
  text(pdf, 'ในแบบ', marginX + 130, formY + 14, { size: 11 })
  const forms = ['ภ.ง.ด.1ก', 'ภ.ง.ด.1ก พิเศษ', 'ภ.ง.ด.2', 'ภ.ง.ด.3', 'ภ.ง.ด.2ก', 'ภ.ง.ด.3ก', 'ภ.ง.ด.53']
  forms.forEach((form, index) => {
    const row = index < 4 ? 0 : 1
    const col = index < 4 ? index : index - 4
    const x = marginX + 170 + col * 92
    const y = formY + 8 + row * 20
    drawCheckbox(pdf, x, y - 10, filingForm.includes(form))
    text(pdf, `(${index + 1}) ${form}`, x + 18, y, { size: 10.5 })
  })

  const tableY = 276
  const tableBottomY = drawWithholdingIncomeTable(pdf, {
    x: marginX + 12,
    y: tableY,
    width: width - 24,
    lineItems,
    metadata,
    paymentDate,
    subtotal,
    withholdingTax,
    incomeCategoryCode,
  })

  const summaryY = tableBottomY + 6
  roundedBox(pdf, marginX + 12, summaryY, width - 24, 24, 3)
  text(pdf, 'รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)', marginX + 18, summaryY + 16, { size: 11, style: 'bold' })
  text(pdf, `(${amountInThaiWords(withholdingTax)})`, marginX + 172, summaryY + 16, { size: 11 })

  roundedBox(pdf, marginX + 12, summaryY + 28, width - 24, 22, 3)
  text(pdf, 'เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน........................บาท', marginX + 18, summaryY + 43, { size: 9.5 })
  text(pdf, 'กองทุนประกันสังคม........................บาท', marginX + 328, summaryY + 43, { size: 9.5 })

  const conditionY = summaryY + 54
  roundedBox(pdf, marginX + 12, conditionY, width - 24, 22, 3)
  text(pdf, 'ผู้ที่จ่ายเงิน', marginX + 18, conditionY + 15, { size: 11, style: 'bold' })
  const conditions = ['หัก ณ ที่จ่าย', 'ออกให้ตลอดไป', 'ออกให้ครั้งเดียว', 'อื่นๆ']
  conditions.forEach((condition, index) => {
    const x = marginX + 78 + index * 96
    drawCheckbox(pdf, x, conditionY + 5, (metadata.payerTaxCondition || 'หัก ณ ที่จ่าย') === condition)
    text(pdf, `(${index + 1}) ${condition}`, x + 18, conditionY + 15, { size: 10.5 })
  })

  const certifyY = conditionY + 28
  roundedBox(pdf, marginX + 12, certifyY, 138, 96, 3)
  text(pdf, 'คำเตือน', marginX + 18, certifyY + 16, { size: 11, style: 'bold' })
  wrappedText(pdf, 'ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ ต้องรับโทษทางอาญา', marginX + 50, certifyY + 16, 86, { size: 9.5, lineHeight: 12 })

  roundedBox(pdf, marginX + 154, certifyY, width - 178, 96, 3)
  text(pdf, 'ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ', 370, certifyY + 18, { size: 11, align: 'center' })
  if (signature) drawImage(pdf, signature, 286, certifyY + 40, 76, 30)
  text(pdf, 'ลงชื่อ', 212, certifyY + 66, { size: 11 })
  dottedLine(pdf, 238, certifyY + 66, 456)
  text(pdf, 'ผู้จ่ายเงิน', 462, certifyY + 66, { size: 11 })
  drawCertificateDate(pdf, certificateDate, 310, certifyY + 82)

  text(pdf, 'หมายเหตุ  เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง 1. กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง', marginX + 2, 800, { size: 8.5, style: 'bold' })
  text(pdf, '2. กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า   3. กรณีอื่นๆ ให้ใช้เลขประจำตัวผู้เสียภาษีอากรของกรมสรรพากร', marginX + 124, 814, { size: 8.5 })
  pdf.setLineWidth(0.2)
}

function drawPartyBox(pdf: jsPDF, { x, y, width, title, name, taxId, secondaryTaxId, address }: any) {
  roundedBox(pdf, x, y, width, 62, 3)
  text(pdf, title, x + 6, y + 16, { size: 11, style: 'bold' })
  text(pdf, 'เลขประจำตัวผู้เสียภาษีอากร (13หลัก)*', x + 326, y + 16, { size: 10.5, style: 'bold' })
  drawTaxIdBoxes(pdf, taxId, x + 326, y + 22)
  text(pdf, 'ชื่อ', x + 6, y + 37, { size: 11, style: 'bold' })
  dottedLine(pdf, x + 22, y + 37, x + 322)
  text(pdf, name || '-', x + 26, y + 35, { size: 11 })
  text(pdf, 'ที่อยู่', x + 6, y + 55, { size: 11, style: 'bold' })
  dottedLine(pdf, x + 28, y + 55, x + width - 6)
  text(pdf, address || '-', x + 32, y + 53, { size: 10.5 })
  void secondaryTaxId
}

function drawWithholdingIncomeTable(pdf: jsPDF, { x, y, width, lineItems, metadata, paymentDate, subtotal, withholdingTax, incomeCategoryCode }: any) {
  const descW = 282
  const dateW = 80
  const amountW = 84
  const taxW = width - descW - dateW - amountW
  const headerH = 28
  const rowH = 23
  const rows = [
    '1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)',
    '2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)',
    '3. ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)',
    '4. ดอกเบี้ย เงินปันผล ฯลฯ ตามมาตรา 40 (4)',
    '5. การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย เช่น ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ฯลฯ',
    '6. อื่นๆ (ระบุ) ........................................................................................',
  ]
  const totalRows = rows.length + Math.max(lineItems.length, 1)
  const tableH = headerH + rows.length * rowH + Math.max(lineItems.length, 1) * rowH + 24
  const defaultTaxRate = numberValue(metadata.taxRate)

  roundedBox(pdf, x, y, width, tableH, 3)
  pdf.line(x + descW, y, x + descW, y + tableH)
  pdf.line(x + descW + dateW, y, x + descW + dateW, y + tableH)
  pdf.line(x + descW + dateW + amountW, y, x + descW + dateW + amountW, y + tableH)
  pdf.line(x, y + headerH, x + width, y + headerH)

  text(pdf, 'ประเภทเงินได้พึงประเมินจ่าย', x + descW / 2, y + 18, { size: 11, align: 'center', style: 'bold' })
  text(pdf, 'วัน เดือน', x + descW + dateW / 2, y + 12, { size: 10, align: 'center', style: 'bold' })
  text(pdf, 'หรือปีภาษี ที่จ่าย', x + descW + dateW / 2, y + 24, { size: 10, align: 'center', style: 'bold' })
  text(pdf, 'จำนวนเงินที่จ่าย', x + descW + dateW + amountW / 2, y + 18, { size: 11, align: 'center', style: 'bold' })
  text(pdf, 'ภาษีที่หัก', x + descW + dateW + amountW + taxW / 2, y + 12, { size: 10, align: 'center', style: 'bold' })
  text(pdf, 'และนำส่งไว้', x + descW + dateW + amountW + taxW / 2, y + 24, { size: 10, align: 'center', style: 'bold' })

  let rowY = y + headerH
  rows.forEach((row, index) => {
    wrappedText(pdf, row, x + 6, rowY + 14, descW - 12, { size: 10.5, lineHeight: 11 })
    dottedLine(pdf, x + descW, rowY + rowH - 5, x + width)
    if (String(index + 1) === String(incomeCategoryCode) && lineItems.length === 0) {
      drawWithholdingIncomeValues(pdf, { x, rowY, descW, dateW, amountW, taxW, paymentDate, amount: subtotal, tax: withholdingTax })
    }
    rowY += rowH
  })

  const sourceItems = lineItems.length > 0 ? lineItems : [{ description: metadata.incomeType || '', amount: subtotal }]
  sourceItems.forEach((item: any) => {
    const amount = numberValue(item.amount)
    const tax = item.taxRate !== undefined
      ? Math.round(amount * numberValue(item.taxRate)) / 100
      : subtotal > 0
      ? Math.round((amount / subtotal) * withholdingTax * 100) / 100
      : Math.round(amount * defaultTaxRate) / 100
    text(pdf, item.description || metadata.incomeType || '', x + 18, rowY + 15, { size: 10.5 })
    drawWithholdingIncomeValues(pdf, { x, rowY, descW, dateW, amountW, taxW, paymentDate, amount, tax })
    dottedLine(pdf, x + descW, rowY + rowH - 5, x + width)
    rowY += rowH
  })

  pdf.line(x, rowY, x + width, rowY)
  text(pdf, 'รวมเงินที่จ่ายและภาษีที่หักนำส่ง', x + descW + dateW - 4, rowY + 16, { size: 11, align: 'right', style: 'bold' })
  text(pdf, money(subtotal), x + descW + dateW + amountW - 4, rowY + 16, { size: 12, align: 'right' })
  text(pdf, money(withholdingTax), x + width - 4, rowY + 16, { size: 12, align: 'right' })

  // Keep linter honest for table height reasoning.
  void totalRows
  return y + tableH
}

function drawWithholdingIncomeValues(pdf: jsPDF, { x, rowY, descW, dateW, amountW, paymentDate, amount, tax }: any) {
  text(pdf, paymentDate, x + descW + dateW - 5, rowY + 15, { size: 10.5, align: 'right' })
  text(pdf, money(amount), x + descW + dateW + amountW - 5, rowY + 15, { size: 10.5, align: 'right' })
  text(pdf, money(tax), x + descW + dateW + amountW + 66, rowY + 15, { size: 10.5, align: 'right' })
}

function drawCheckbox(pdf: jsPDF, x: number, y: number, checked: boolean) {
  pdf.setDrawColor('#8b8b8b')
  pdf.roundedRect(x, y, 12, 12, 2, 2)
  if (!checked) return
  pdf.setDrawColor(DARK)
  pdf.setLineWidth(1.2)
  pdf.line(x + 3, y + 6, x + 6, y + 10)
  pdf.line(x + 6, y + 10, x + 11, y + 3)
  pdf.setLineWidth(0.2)
}

function roundedBox(pdf: jsPDF, x: number, y: number, width: number, height: number, radius: number) {
  pdf.roundedRect(x, y, width, height, radius, radius)
}

function dottedLine(pdf: jsPDF, x1: number, y: number, x2: number) {
  const previous = pdf.getLineWidth()
  pdf.setLineDashPattern([1, 2], 0)
  pdf.line(x1, y, x2, y)
  pdf.setLineDashPattern([], 0)
  pdf.setLineWidth(previous)
}

function drawTaxIdBoxes(pdf: jsPDF, taxId: string, x: number, y: number) {
  const digits = onlyDigits(taxId).padEnd(13, ' ')
  const groups = [1, 4, 5, 2, 1]
  let digitIndex = 0
  let cursor = x
  groups.forEach((groupSize, groupIndex) => {
    for (let i = 0; i < groupSize; i += 1) {
      pdf.rect(cursor, y, 12, 15)
      const digit = digits[digitIndex]?.trim()
      if (digit) text(pdf, digit, cursor + 6, y + 11, { size: 10, align: 'center' })
      digitIndex += 1
      cursor += 12
    }
    if (groupIndex < groups.length - 1) {
      text(pdf, '-', cursor + 4, y + 11, { size: 10, align: 'center' })
      cursor += 9
    }
  })
}

function drawCompactTaxBoxes(pdf: jsPDF, taxId: string, x: number, y: number) {
  const digits = onlyDigits(taxId).slice(0, 10).padEnd(10, ' ')
  for (let i = 0; i < 10; i += 1) {
    const cursor = x + i * 11
    pdf.rect(cursor, y, 11, 15)
    const digit = digits[i]?.trim()
    if (digit) text(pdf, digit, cursor + 5.5, y + 11, { size: 9.5, align: 'center' })
  }
}

function drawCertificateDate(pdf: jsPDF, dateValue: string, x: number, y: number) {
  const [day, month, year] = dateValue.split('/')
  text(pdf, day || '', x - 34, y, { size: 10, align: 'center' })
  text(pdf, month || '', x, y, { size: 10, align: 'center' })
  text(pdf, year || '', x + 40, y, { size: 10, align: 'center' })
  dottedLine(pdf, x - 48, y + 3, x + 58)
  text(pdf, '(วัน เดือน ปี ที่ออกหนังสือรับรองฯ)', x + 5, y + 16, { size: 9, align: 'center' })
}

function drawLogoFallback(pdf: jsPDF, name: string) {
  const initials = getInitials(name)
  pdf.setDrawColor('#1e3a8a')
  pdf.setLineWidth(2)
  pdf.circle(64, 58, 26)
  text(pdf, initials, 64, 66, { size: 20, color: '#1e3a8a', align: 'center', style: 'bold' })
  pdf.setLineWidth(0.2)
}

function drawImage(pdf: jsPDF, image: ImageAsset, x: number, y: number, width: number, height: number) {
  try {
    pdf.addImage(image.dataUrl, image.format, x, y, width, height, undefined, 'FAST')
  } catch {
    // Bad image payloads should not block document generation.
  }
}

function text(pdf: jsPDF, value: string, x: number, y: number, options: {
  size?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  style?: 'normal' | 'bold'
} = {}) {
  pdf.setFont('THSarabun', options.style || 'normal')
  pdf.setFontSize(options.size || 12)
  pdf.setTextColor(options.color || DARK)
  pdf.text(String(value ?? ''), x, y, { align: options.align || 'left' })
}

function wrappedText(pdf: jsPDF, value: string, x: number, y: number, width: number, options: {
  size?: number
  lineHeight?: number
  style?: 'normal' | 'bold'
} = {}) {
  if (!value) return y
  const lines = splitText(pdf, value, width, options.size || 12)
  lines.forEach((line, index) => {
    text(pdf, line, x, y + index * (options.lineHeight || 14), { size: options.size || 12, style: options.style || 'normal' })
  })
  return y + lines.length * (options.lineHeight || 14)
}

function splitText(pdf: jsPDF, value: string, width: number, size: number): string[] {
  pdf.setFont('THSarabun', 'normal')
  pdf.setFontSize(size)
  const result = pdf.splitTextToSize(String(value), width)
  return Array.isArray(result) ? result : [result]
}

async function getImageAsset(url?: string | null): Promise<ImageAsset | null> {
  if (!url) return null

  try {
    if (url.startsWith('data:image/')) {
      return { dataUrl: url, format: url.includes('image/jpeg') || url.includes('image/jpg') ? 'JPEG' : 'PNG' }
    }

    if (url.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', url.replace(/^\/+/, ''))
      if (!fs.existsSync(filePath)) return null
      const bytes = fs.readFileSync(filePath)
      const mime = mimeFromPath(filePath)
      return { dataUrl: `data:${mime};base64,${bytes.toString('base64')}`, format: mime.includes('jpeg') ? 'JPEG' : 'PNG' }
    }

    if (/^https?:\/\//.test(url)) {
      const response = await fetch(url)
      if (!response.ok) return null
      const mime = response.headers.get('content-type') || 'image/png'
      const bytes = Buffer.from(await response.arrayBuffer())
      return { dataUrl: `data:${mime};base64,${bytes.toString('base64')}`, format: mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG' }
    }
  } catch {
    return null
  }

  return null
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function getPdfDocTitle(docType: DocType, fallback: string) {
  if (docType === 'INV') return 'ใบกำกับภาษี/ใบเสร็จรับเงิน'
  if (docType === 'QT') return 'ใบเสนอราคา'
  if (docType === 'BL') return 'ใบแจ้งหนี้'
  if (docType === 'RE') return 'ใบเสร็จรับเงิน'
  return fallback
}

function getDocumentSubtitle(docType: DocType) {
  if (docType === 'INV') return 'ต้นฉบับ (เอกสารออกเป็นชุด)'
  if (docType === 'QT') return 'Quotation'
  if (docType === 'BL') return 'Invoice'
  if (docType === 'RE') return 'Receipt'
  return ''
}

function getDocumentOwnerLabel(docType: DocType) {
  if (docType === 'QT') return 'ผู้เสนอ'
  if (docType === 'BL') return 'ผู้แจ้งหนี้'
  if (docType === 'RE') return 'ผู้รับเงิน'
  return 'ผู้ขาย'
}

function getDueDateLabel(docType: DocType) {
  if (docType === 'QT') return 'ใช้ได้ถึง'
  return 'ครบกำหนด'
}

function getCounterpartyLabel(docType: DocType) {
  if (docType === 'QT') return 'ลูกค้า/ผู้รับข้อเสนอ'
  if (docType === 'BL') return 'ลูกค้า/ผู้ถูกเรียกเก็บเงิน'
  if (docType === 'RE') return 'ลูกค้า/ผู้ชำระเงิน'
  return 'ลูกค้า'
}

function withBranch(name: string, branch?: string | null) {
  if (!branch || name.includes(branch)) return name
  return `${name} (${branch})`
}

function formatDateForPdf(value: number | Date) {
  const date = typeof value === 'number' ? new Date(value * 1000) : value
  return formatDateObject(date)
}

function formatDateInput(value: string) {
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function formatDateObject(date: Date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear())
  return `${day}/${month}/${year}`
}

function numberValue(value: unknown) {
  const number = typeof value === 'number' ? value : parseFloat(String(value || 0))
  return Number.isFinite(number) ? number : 0
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function money(value: unknown) {
  return formatNumber(numberValue(value))
}

function formatQuantity(value: unknown) {
  const number = numberValue(value)
  if (Number.isInteger(number)) return String(number)
  return formatNumber(number)
}

function formatQtyWithUnit(item: any) {
  const quantity = formatQuantity(item.quantity)
  return item.unit ? `${quantity} ${item.unit}` : quantity
}

function formatRate(value: number) {
  return Number.isInteger(value) ? String(value) : formatNumber(value)
}

function deriveVatRate(vatAmount: number, baseAmount: number) {
  if (vatAmount <= 0 || baseAmount <= 0) return 0
  return Math.round((vatAmount / baseAmount) * 10000) / 100
}

function paymentMethodMatches(actual: string, target: string) {
  if (!actual) return false
  if (actual === target) return true
  if (target === 'โอนเงิน') return actual.includes('โอนเงิน') || actual.toLowerCase().includes('transfer')
  if (target === 'บัตรเครดิต') return actual.includes('บัตร') || actual.toLowerCase().includes('credit')
  if (target === 'เงินสด') return actual.includes('เงินสด') || actual.toLowerCase().includes('cash')
  if (target === 'เช็ค') return actual.includes('เช็ค') || actual.toLowerCase().includes('cheque')
  return false
}

function onlyDigits(value: string) {
  return String(value || '').replace(/\D/g, '')
}

function mimeFromPath(filePath: string) {
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/png'
}

function getInitials(name: string) {
  const latin = name.match(/[A-Za-z]/g)?.join('').slice(0, 2)
  if (latin) return latin.toUpperCase()
  return name.replace(/\s/g, '').slice(0, 2) || 'AT'
}
