import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import { getContacts } from '@/db/queries/contacts'
import { getProducts } from '@/db/queries/products'
import { getBankAccounts } from '@/db/queries/banks'
import { getDocumentById } from '@/db/queries/documents'
import DocumentForm from '@/components/documents/DocumentForm'
import Link from 'next/link'

const DOC_TYPE_ICONS: Record<DocType, string> = {
  INV: '🧾', EXP: '💸', WT: '📋', QT: '📝', BL: '📑', RE: '✅',
}

const DOC_TYPES: DocType[] = ['INV', 'EXP', 'WT', 'QT', 'BL', 'RE']

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; from?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { type, from } = await searchParams
  const tenantId = session.user.id
  const docType = type as DocType

  // Show type selector if no type selected
  if (!docType || !DOC_TYPES.includes(docType)) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/documents" className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">เลือกประเภทเอกสาร</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DOC_TYPES.map(type => (
            <a
              key={type}
              id={`select-type-${type.toLowerCase()}`}
              href={`/documents/new?type=${type}`}
              className="card p-5 flex flex-col items-center gap-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="text-3xl">{DOC_TYPE_ICONS[type]}</div>
              <div className="text-center">
                <div className="text-xs font-bold text-blue-600 font-mono">{type}</div>
                <div className="text-sm font-medium text-gray-800 mt-0.5 group-hover:text-blue-600 transition-colors">
                  {DOC_TYPE_LABELS[type]}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    )
  }

  const [contacts, products, bankAccounts] = await Promise.all([
    getContacts(tenantId),
    getProducts(tenantId),
    getBankAccounts(tenantId),
  ])

  // คัดลอกจากเอกสารเดิม: ดึงข้อมูลมาเติมในฟอร์มสร้าง (ไม่มี id/เลขที่/วันที่ → เป็นการสร้างใหม่ รอแก้ไข+บันทึก)
  let prefill: Record<string, unknown> | undefined
  if (from) {
    const src = await getDocumentById(from, tenantId)
    if (src) {
      // รีเซ็ตวันที่ในเอกสารให้ว่าง → ฟอร์มจะ default เป็นวันนี้ (เลขที่/เดือนจะอิงวันที่ใหม่ ไม่ใช่ของเดิม)
      let metadata = src.metadata
      try {
        const m = JSON.parse(src.metadata || '{}')
        delete m.paymentDate
        delete m.certificateDate
        metadata = JSON.stringify(m)
      } catch {}
      prefill = {
        docType: src.docType,
        contactId: src.contactId,
        contactSnapshot: src.contactSnapshot,
        dueDate: src.dueDate,
        lineItems: src.lineItems,
        notes: src.notes,
        metadata,
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/documents/new" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {DOC_TYPE_ICONS[docType]} สร้าง{DOC_TYPE_LABELS[docType]}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">เลขที่จะถูกกำหนดอัตโนมัติ</p>
        </div>
      </div>

      <DocumentForm contacts={contacts} products={products} bankAccounts={bankAccounts} docType={docType} initialData={prefill} />
    </div>
  )
}
