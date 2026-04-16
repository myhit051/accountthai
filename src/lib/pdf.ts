import { getDocumentById } from '@/db/queries/documents'
import { formatCurrency, amountInThaiWords, formatDateThai, getPdfFilename } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import { db } from '@/db'
import { tenants } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function generatePdfBuffer(id: string, tenantId: string): Promise<{ pdf: Buffer | string, filename: string, isHtml: boolean } | null> {
  const doc = await getDocumentById(id, tenantId)
  if (!doc) return null

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)

  const lineItems = JSON.parse(doc.lineItems || '[]')
  const contact = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
  const docTypeLabel = DOC_TYPE_LABELS[doc.docType as DocType] || doc.docType

  const html = generatePdfHtml({
    doc,
    lineItems,
    contact,
    tenant,
    docTypeLabel,
  })

  const partnerName = contact?.name || 'noname'
  const filename = getPdfFilename(tenant?.name || 'company', doc.docNumber, partnerName)
  
  try {
    let browser
    try {
      const chromium = await import('@sparticuz/chromium-min')
      const puppeteer = await import('puppeteer-core')
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(
          process.env.CHROMIUM_PATH || undefined
        ),
        headless: true,
      })
    } catch {
      // Fallback
      return { pdf: html, filename: filename.replace('.pdf', '.html'), isHtml: true }
    }

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })
    await browser.close()
    
    return { pdf: Buffer.from(pdf), filename, isHtml: false }
  } catch (error) {
    console.error('PDF generation error:', error)
    return null
  }
}

export function generatePdfHtml({ doc, lineItems, contact, tenant, docTypeLabel }: any) {
  const vatRow = doc.vatAmount > 0
    ? `<tr><td style="text-align:right;padding:4px 8px;color:#666">ภาษีมูลค่าเพิ่ม 7%</td><td style="text-align:right;padding:4px 8px;font-family:monospace">\${formatCurrency(doc.vatAmount)}</td></tr>`
    : ''

  const lineItemsHtml = lineItems.map((item: any, i: number) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:8px;text-align:center;color:#888">\${i + 1}</td>
      <td style="padding:8px">\${item.description}</td>
      <td style="padding:8px;text-align:center;font-family:monospace">\${item.quantity}</td>
      <td style="padding:8px">\${item.unit}</td>
      <td style="padding:8px;text-align:right;font-family:monospace">\${formatCurrency(item.unitPrice)}</td>
      <td style="padding:8px;text-align:right;font-family:monospace;font-weight:600">\${formatCurrency(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1e293b; background: white; }
  .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
  .company-info { font-size: 12px; color: #64748b; line-height: 1.7; }
  .company-name { font-size: 15px; font-weight: 700; color: #1e293b; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 20px; font-weight: 700; color: #2563eb; }
  .doc-number { font-family: monospace; font-size: 14px; font-weight: 600; color: #1e293b; }
  .contact-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
  .contact-box { background: #f8fafc; border-radius: 8px; padding: 12px 16px; width: 48%; font-size: 12px; line-height: 1.7; }
  .contact-box-title { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #f1f5f9; padding: 8px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .totals { margin-top: 16px; margin-left: auto; width: 280px; }
  .totals tr td { padding: 4px 8px; font-size: 13px; }
  .grand-total { font-size: 15px; font-weight: 700; color: #2563eb; border-top: 2px solid #e2e8f0; }
  .amount-words { margin-top: 8px; font-size: 12px; color: #64748b; font-style: italic; }
  .signature-section { display: flex; justify-content: flex-end; margin-top: 48px; }
  .signature-box { text-align: center; width: 180px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 11px; color: #94a3b8; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body style="padding: 0px;">
  <div class="doc-header">
    <div>
      \${tenant?.logoUrl ? \`<img src="\${tenant.logoUrl}" style="height:48px;margin-bottom:8px;object-fit:contain;max-width:150px" />\` : ''}
      <div class="company-name">\${tenant?.name || 'บริษัทของคุณ'}</div>
      <div class="company-info">
        \${tenant?.taxId ? \`เลขประจำตัวผู้เสียภาษี: \${tenant.taxId}<br>\` : ''}
        \${tenant?.address ? \`\${tenant.address}<br>\` : ''}
        \${tenant?.branch ? \`สาขา: \${tenant.branch}<br>\` : ''}
        \${tenant?.phone ? \`โทร: \${tenant.phone}\` : ''}
      </div>
    </div>
    <div class="doc-title">
      <h1>\${docTypeLabel}</h1>
      <div class="doc-number">\${doc.docNumber}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px">วันที่: \${formatDateThai(doc.date)}</div>
      \${doc.dueDate ? \`<div style="font-size:12px;color:#64748b">กำหนดชำระ: \${formatDateThai(doc.dueDate)}</div>\` : ''}
    </div>
  </div>

  <div class="contact-section">
    <div class="contact-box">
      <div class="contact-box-title">ผู้ขาย / บริษัท</div>
      <div style="font-weight:600">\${tenant?.name || ''}</div>
      \${tenant?.taxId ? \`<div>เลขภาษี: \${tenant.taxId}</div>\` : ''}
    </div>
    <div class="contact-box">
      <div class="contact-box-title">ผู้ซื้อ / ลูกค้า</div>
      \${contact ? \`
        <div style="font-weight:600">\${contact.name}</div>
        \${contact.taxId ? \`<div>เลขภาษี: \${contact.taxId}</div>\` : ''}
        \${contact.address ? \`<div>\${contact.address}</div>\` : ''}
        \${contact.branch ? \`<div>สาขา: \${contact.branch}</div>\` : ''}
      \` : '<div style="color:#94a3b8">ไม่ระบุ</div>'}
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width:5%;text-align:center">ลำดับ</th>
        <th style="text-align:left">รายการ</th>
        <th style="width:8%;text-align:center">จำนวน</th>
        <th style="width:8%">หน่วย</th>
        <th style="width:14%;text-align:right">ราคา/หน่วย</th>
        <th style="width:16%;text-align:right">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>\${lineItemsHtml}</tbody>
  </table>

  <table class="totals">
    <tr>
      <td style="text-align:right;color:#666">ยอดก่อนภาษี</td>
      <td style="text-align:right;font-family:monospace">\${formatCurrency(doc.subtotal)}</td>
    </tr>
    \${vatRow}
    <tr class="grand-total">
      <td style="text-align:right;padding:8px 8px 4px">ยอดรวมทั้งสิ้น</td>
      <td style="text-align:right;padding:8px 8px 4px;font-family:monospace">\${formatCurrency(doc.totalAmount)}</td>
    </tr>
  </table>
  <div class="amount-words">(\${amountInThaiWords(doc.totalAmount)})</div>

  \${doc.notes ? \`<div style="margin-top:16px;font-size:12px;color:#64748b"><strong>หมายเหตุ:</strong> \${doc.notes}</div>\` : ''}

  <div class="signature-section">
    <div class="signature-box">
      <div style="height:48px"></div>
      ผู้มีอำนาจลงนาม / Authorized Signature
    </div>
  </div>

  \${doc.referenceNumber ? \`<div style="margin-top:12px;font-size:11px;color:#94a3b8">อ้างอิงเอกสาร: \${doc.referenceNumber}</div>\` : ''}

  <div class="footer">สร้างโดย AccountThai — ระบบจัดการเอกสารบัญชีออนไลน์</div>
</body>
</html>`
}
