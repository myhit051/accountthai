import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getDocumentById } from '@/db/queries/documents'
import { formatCurrency, formatDateThai, amountInThaiWords } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import { issueDocument, markDocumentPaid, voidDocument, duplicateDocument, convertDocument, deleteDocument } from '@/actions/documents'
import Link from 'next/link'
import PdfPreviewModal from '@/components/documents/PdfPreviewModal'
import DriveUploader from '@/components/documents/DriveUploader'

const STATUS_LABELS: Record<string, string> = {
  draft: 'ร่าง', issued: 'ออกแล้ว', paid: 'ชำระแล้ว', void: 'ยกเลิก',
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', issued: 'badge-issued', paid: 'badge-paid', void: 'badge-void',
}

type Props = { params: Promise<{ id: string }> }

export default async function DocumentDetailPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { id } = await params
  const tenantId = session.user.id
  const doc = await getDocumentById(id, tenantId)
  if (!doc) notFound()

  const lineItems = JSON.parse(doc.lineItems || '[]')
  const contact = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
  const metadata = doc.metadata ? JSON.parse(doc.metadata) : {}
  const isDraft = doc.status === 'draft'
  const isIssued = doc.status === 'issued'
  const isBlOrRe = ['BL', 'RE'].includes(doc.docType)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/documents" className="hover:text-gray-600">เอกสาร</Link>
            <span>/</span>
            <span className="text-gray-600 font-mono">{doc.docNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{DOC_TYPE_LABELS[doc.docType as DocType]}</h1>
            <span className={`badge ${STATUS_CLASS[doc.status]}`}>{STATUS_LABELS[doc.status]}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* PDF Preview */}
          <PdfPreviewModal docId={doc.id} docNumber={doc.docNumber} />

          {/* Duplicate */}
          <form action={duplicateDocument.bind(null, doc.id)}>
            <button type="submit" id="duplicate-btn" className="btn-secondary btn-sm">คัดลอก</button>
          </form>

          {/* Convert */}
          {doc.docType === 'QT' && (isIssued || isDraft) && (
            <form action={convertDocument.bind(null, doc.id, 'BL')}>
              <button type="submit" id="convert-to-bl-btn" className="btn-secondary btn-sm">→ ใบแจ้งหนี้</button>
            </form>
          )}
          {doc.docType === 'BL' && isIssued && (
            <form action={convertDocument.bind(null, doc.id, 'RE')}>
              <button type="submit" id="convert-to-re-btn" className="btn-secondary btn-sm">→ ใบเสร็จ</button>
            </form>
          )}

          {/* Issue */}
          {isDraft && (
            <form action={issueDocument.bind(null, doc.id)}>
              <button type="submit" id="issue-btn" className="btn-primary btn-sm">ออกเอกสาร</button>
            </form>
          )}

          {/* Mark Paid */}
          {isIssued && isBlOrRe && (
            <form action={markDocumentPaid.bind(null, doc.id)}>
              <button type="submit" id="mark-paid-btn" className="btn-primary btn-sm bg-green-600 hover:bg-green-700">บันทึกชำระเงิน</button>
            </form>
          )}

          {/* Void */}
          {(isDraft || isIssued) && (
            <form action={async (formData: FormData) => {
              'use server'
              await voidDocument(doc.id, formData.get('reason') as string || 'ยกเลิกเอกสาร')
            }}>
              <button type="submit" id="void-btn" className="btn-danger btn-sm" onClick={(e) => {
                const reason = prompt('กรุณาระบุเหตุผลการยกเลิก')
                if (!reason) e.preventDefault()
              }}>
                ยกเลิก
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Document Detail Card */}
      <div className="card p-6 space-y-6">
        {/* Header section */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">เลขที่เอกสาร</div>
            <div className="text-xl font-mono font-bold text-gray-900 flex items-center gap-2">
              {doc.docNumber}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" title="เลขที่ถูกล็อค">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="text-sm text-gray-400 mt-1">วันที่: {formatDateThai(doc.date)}</div>
            {doc.dueDate && <div className="text-sm text-gray-400">กำหนดชำระ: {formatDateThai(doc.dueDate)}</div>}
            {doc.referenceNumber && (
              <div className="text-sm text-gray-400 mt-1">อ้างอิง: <span className="font-mono text-blue-600">{doc.referenceNumber}</span></div>
            )}
          </div>

          {contact && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 min-w-[200px]">
              <div className="text-xs text-gray-400 font-medium mb-2">ผู้รับ / คู่ค้า</div>
              <div className="font-semibold text-gray-900">{contact.name}</div>
              {contact.taxId && <div className="text-gray-500">เลขภาษี: <span className="font-mono">{contact.taxId}</span></div>}
              {contact.address && <div className="text-gray-500">{contact.address}</div>}
              {contact.branch && <div className="text-gray-500">สาขา: {contact.branch}</div>}
            </div>
          )}
        </div>

        {/* Line Items */}
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">รายการ</div>
          <table className="line-items-table w-full text-sm">
            <thead>
              <tr>
                <th>รายการ</th>
                <th className="text-center">จำนวน</th>
                <th>หน่วย</th>
                <th className="text-right">ราคา/หน่วย</th>
                <th className="text-right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="py-2.5">{item.description}</td>
                  <td className="text-center font-mono">{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td className="text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-right font-mono font-medium">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto w-64 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>ยอดก่อนภาษี</span>
            <span className="font-mono">{formatCurrency(doc.subtotal)}</span>
          </div>
          {doc.vatAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>VAT 7%</span>
              <span className="font-mono">{formatCurrency(doc.vatAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200 text-base">
            <span>ยอดรวม</span>
            <span className="font-mono text-blue-600">{formatCurrency(doc.totalAmount)}</span>
          </div>
          <div className="text-xs text-gray-400 text-right italic">
            ({amountInThaiWords(doc.totalAmount)})
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">หมายเหตุ</div>
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{doc.notes}</div>
          </div>
        )}

        {/* Void Reason */}
        {doc.status === 'void' && doc.voidReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="text-xs font-semibold text-red-500 mb-1">เหตุผลการยกเลิก</div>
            <div className="text-sm text-red-700">{doc.voidReason}</div>
          </div>
        )}

        {/* Drive Status */}
        <div className="flex items-center gap-2 text-sm text-gray-400 border-t border-gray-100 pt-4">
          <span>Google Drive:</span>
          {doc.driveStatus === 'uploaded' ? (
            <a href={doc.driveUrl || '#'} target="_blank" className="text-green-500 hover:underline font-medium">☁️✓ อัปโหลดแล้ว</a>
          ) : doc.driveStatus === 'pending' ? (
            <span className="text-yellow-500">☁️⟳ กำลังอัปโหลด</span>
          ) : doc.driveStatus === 'failed' ? (
            <span className="text-red-400">☁️✕ อัปโหลดไม่สำเร็จ</span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
      {doc.driveStatus === 'pending' && <DriveUploader docId={doc.id} />}
    </div>
  )
}
