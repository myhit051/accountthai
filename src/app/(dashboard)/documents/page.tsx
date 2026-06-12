import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDocuments } from '@/db/queries/documents'
import { formatCurrency, formatDateThai } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType, DocStatus } from '@/db/schema'
import Link from 'next/link'
import { duplicateDocument, convertDocument } from '@/actions/documents'
import DocumentStatusSelect from '@/components/documents/DocumentStatusSelect'
import DeleteDocumentButton from '@/components/documents/DeleteDocumentButton'
import EmptyState from '@/components/ui/EmptyState'
import { DOC_STATUS_DOT_CLASS, DOC_STATUS_LABELS, DOC_STATUS_OPTIONS } from '@/lib/doc-status'
import { Copy, Download, Eye, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

const DOC_TABS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'INV', label: 'ใบกำกับภาษี' },
  { key: 'EXP', label: 'ค่าใช้จ่าย' },
  { key: 'WT', label: 'หัก ณ ที่จ่าย' },
  { key: 'QT', label: 'ใบเสนอราคา' },
  { key: 'BL', label: 'ใบแจ้งหนี้' },
  { key: 'RE', label: 'ใบเสร็จ' },
]

const STATUS_TABS = [
  { key: '', label: 'แสดงทั้งหมด' },
  ...DOC_STATUS_OPTIONS.map((s) => ({ key: s, label: DOC_STATUS_LABELS[s] })),
]

type SearchParams = {
  type?: string
  status?: string
  page?: string
  q?: string
  sortBy?: 'date' | 'amount' | 'docNumber'
  sortDir?: 'asc' | 'desc'
}

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const resolvedParams = await searchParams
  const tenantId = session.user.id
  const page = parseInt(resolvedParams.page || '1')
  const docType = (resolvedParams.type as DocType) || undefined
  const status = resolvedParams.status as any
  const search = resolvedParams.q
  const sortBy = resolvedParams.sortBy || 'date'
  const sortDir = resolvedParams.sortDir || 'desc'

  const { documents: docs, total, pages } = await getDocuments({
    tenantId,
    docType,
    status,
    search,
    sortBy,
    sortOrder: sortDir,
    page,
    pageSize: 20,
  })

  const createUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (docType) params.set('type', docType)
    if (status) params.set('status', status)
    if (search) params.set('q', search)
    if (sortBy) params.set('sortBy', sortBy)
    if (sortDir) params.set('sortDir', sortDir)

    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })

    const query = params.toString()
    return query ? `/documents?${query}` : '/documents'
  }

  const createSortUrl = (field: 'date' | 'amount' | 'docNumber') => {
    const isCurrentField = sortBy === field
    const newDir = isCurrentField && sortDir === 'desc' ? 'asc' : 'desc'
    return createUrl({ sortBy: field, sortDir: newDir, page: undefined })
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-300 group-hover:text-gray-500">↑↓</span>
    return <span className="ml-1 text-blue-600">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เอกสาร</h1>
          <p className="text-gray-500 text-sm mt-0.5">จัดการเอกสารบัญชีทั้งหมด</p>
        </div>
        <Link href="/documents/new" id="docs-new-btn" className="btn-primary px-5 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          สร้างใหม่
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Type Tabs */}
        <div className="flex flex-wrap gap-1">
          {DOC_TABS.map(tab => {
            const isActive = (resolvedParams.type || '') === tab.key
            return (
              <Link key={tab.key} href={createUrl({ type: tab.key || undefined, page: undefined })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(tab => {
            const isActive = (resolvedParams.status || '') === tab.key
            return (
              <Link
                key={tab.key}
                href={createUrl({ status: tab.key || undefined, page: undefined })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {/* Search */}
        <form method="GET" action="/documents" className="flex gap-2">
          {docType && <input type="hidden" name="type" value={docType} />}
          {status && <input type="hidden" name="status" value={status} />}
          <input
            id="doc-search"
            name="q"
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร หรือชื่อผู้ติดต่อ..."
            defaultValue={search}
            className="form-input flex-1 max-w-sm"
          />
          <button type="submit" className="btn-secondary btn-sm">ค้นหา</button>
          {search && <Link href={createUrl({ q: undefined, page: undefined })} className="btn-ghost btn-sm">ล้าง</Link>}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">ทั้งหมด {total} รายการ</span>
          {pages > 1 && (
            <span className="text-sm text-gray-500">หน้า {page} / {pages}</span>
          )}
        </div>
        {docs.length === 0 ? (
          <EmptyState
            icon="📄"
            title="ยังไม่มีเอกสาร"
            description="เริ่มต้นด้วยการสร้างเอกสารใบแรกของคุณ"
            actionLabel="สร้างเอกสารแรก"
            actionHref="/documents/new"
          />
        ) : (
        <>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input type="checkbox" aria-label="เลือกเอกสารทั้งหมด" className="h-4 w-4 rounded border-gray-300" />
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <Link href={createSortUrl('date')} className="group flex items-center hover:text-gray-700 transition-colors">
                    วันที่ <SortIcon field="date" />
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  <Link href={createSortUrl('docNumber')} className="group flex items-center hover:text-gray-700 transition-colors">
                    เลขที่เอกสาร <SortIcon field="docNumber" />
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อลูกค้า/ชื่อโปรเจ็ค</th>
                <th className="px-4 py-3 text-left font-semibold">วันครบกำหนด</th>
                <th className="px-4 py-3 text-right font-semibold">
                  <Link href={createSortUrl('amount')} className="group flex items-center justify-end hover:text-gray-700 transition-colors">
                    ยอดรวมสุทธิ <SortIcon field="amount" />
                  </Link>
                </th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="w-16 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(doc => {
                  const snapshot = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
                  const editHref = `/documents/${doc.id}/edit`
                  const detailHref = `/documents/${doc.id}`
                  const netTotal = Math.max(doc.totalAmount - (doc.withholdingTax || 0), 0)
                  const statusDot = DOC_STATUS_DOT_CLASS[doc.status as DocStatus] || DOC_STATUS_DOT_CLASS.draft
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" aria-label={`เลือก ${doc.docNumber}`} className="h-4 w-4 rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={editHref} className="block whitespace-nowrap text-gray-900 hover:text-blue-700">
                          {formatDateThai(doc.date)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={editHref} className="flex items-center gap-3 font-mono text-gray-900 hover:text-blue-700">
                          <span className={`h-2 w-2 rounded-full ${statusDot}`} />
                          <span>{doc.docNumber}</span>
                        </Link>
                        <div className="mt-0.5 text-xs text-gray-400">{DOC_TYPE_LABELS[doc.docType as DocType]}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={editHref} className="block max-w-[260px] truncate font-medium text-gray-900 hover:text-blue-700">
                          {snapshot?.name || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={editHref} className="block text-gray-700 hover:text-blue-700">
                          {doc.dueDate ? formatDateThai(doc.dueDate) : '-'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={editHref} className="block font-mono text-sm font-semibold text-gray-900 hover:text-blue-700">
                          {formatCurrency(netTotal)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <DocumentStatusSelect docId={doc.id} status={doc.status} docType={doc.docType} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <details className="relative inline-block">
                          <summary className="list-none [&::-webkit-details-marker]:hidden">
                            <span className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                              <MoreHorizontal size={18} aria-hidden="true" />
                              <span className="sr-only">เมนูเอกสาร {doc.docNumber}</span>
                            </span>
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
                            <Link href={editHref} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Pencil size={15} aria-hidden="true" />
                              แก้ไข
                            </Link>
                            <Link href={detailHref} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye size={15} aria-hidden="true" />
                              ดูรายละเอียด
                            </Link>
                            <a href={`/api/documents/${doc.id}/pdf?download=1`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Download size={15} aria-hidden="true" />
                              ดาวน์โหลด PDF
                            </a>
                            <form action={duplicateDocument.bind(null, doc.id)}>
                              <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                <Copy size={15} aria-hidden="true" />
                                คัดลอก
                              </button>
                            </form>
                            {doc.docType === 'BL' && (doc.status === 'issued' || doc.status === 'paid') && (
                              <form action={convertDocument.bind(null, doc.id, 'INV')}>
                                <button type="submit" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                  <FileText size={15} aria-hidden="true" />
                                  → ใบกำกับภาษี
                                </button>
                              </form>
                            )}
                            {doc.status === 'draft' && (
                              <DeleteDocumentButton
                                docId={doc.id}
                                docNumber={doc.docNumber}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={15} aria-hidden="true" />
                                ลบร่าง
                              </DeleteDocumentButton>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <ul className="md:hidden divide-y divide-gray-100">
          {docs.map(doc => {
            const snapshot = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
            const detailHref = `/documents/${doc.id}`
            const netTotal = Math.max(doc.totalAmount - (doc.withholdingTax || 0), 0)
            const statusDot = DOC_STATUS_DOT_CLASS[doc.status as DocStatus] || DOC_STATUS_DOT_CLASS.draft
            return (
              <li key={doc.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <Link href={detailHref} className="min-w-0">
                    <div className="flex items-center gap-2 font-mono text-gray-900">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${statusDot}`} />
                      <span className="truncate">{doc.docNumber}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">{DOC_TYPE_LABELS[doc.docType as DocType]}</div>
                  </Link>
                  <div className="whitespace-nowrap text-right font-mono text-sm font-semibold text-gray-900">
                    {formatCurrency(netTotal)}
                  </div>
                </div>
                <Link href={detailHref} className="block">
                  <div className="truncate text-sm font-medium text-gray-900">{snapshot?.name || '—'}</div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {formatDateThai(doc.date)}
                    {doc.dueDate ? ` · ครบกำหนด ${formatDateThai(doc.dueDate)}` : ''}
                  </div>
                </Link>
                <div className="pt-1">
                  <DocumentStatusSelect docId={doc.id} status={doc.status} docType={doc.docType} />
                </div>
              </li>
            )
          })}
        </ul>
        </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            {page > 1 && (
              <Link href={createUrl({ page: String(page - 1) })}
                className="btn-secondary btn-sm">← ก่อนหน้า</Link>
            )}
            <span className="text-sm text-gray-500">หน้า {page} / {pages}</span>
            {page < pages && (
              <Link href={createUrl({ page: String(page + 1) })}
                className="btn-secondary btn-sm">ถัดไป →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
