import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDocuments } from '@/db/queries/documents'
import { formatCurrency, formatDateThai } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  draft: 'ร่าง', issued: 'ออกแล้ว', paid: 'ชำระแล้ว', void: 'ยกเลิก',
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', issued: 'badge-issued', paid: 'badge-paid', void: 'badge-void',
}

const DOC_TABS = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'INV', label: 'ใบกำกับภาษี' },
  { key: 'EXP', label: 'ค่าใช้จ่าย' },
  { key: 'WT', label: 'หัก ณ ที่จ่าย' },
  { key: 'QT', label: 'ใบเสนอราคา' },
  { key: 'BL', label: 'ใบแจ้งหนี้' },
  { key: 'RE', label: 'ใบเสร็จ' },
]

type SearchParams = {
  type?: string
  status?: string
  page?: string
  q?: string
  sortBy?: 'date' | 'amount' | 'docNumber'
  sortDir?: 'asc' | 'desc'
}

export default async function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const tenantId = session.user.id
  const page = parseInt(searchParams.page || '1')
  const docType = (searchParams.type as DocType) || undefined
  const status = searchParams.status as any
  const search = searchParams.q
  const sortBy = searchParams.sortBy || 'date'
  const sortDir = searchParams.sortDir || 'desc'

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

  const createSortUrl = (field: 'date' | 'amount' | 'docNumber') => {
    const isCurrentField = sortBy === field
    const newDir = isCurrentField && sortDir === 'desc' ? 'asc' : 'desc'
    const params = new URLSearchParams()
    if (docType) params.set('type', docType)
    if (search) params.set('q', search)
    params.set('sortBy', field)
    params.set('sortDir', newDir)
    return `/documents?${params.toString()}`
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1 opacity-0 group-hover:opacity-100">↑↓</span>
    return <span className="text-blue-500 ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เอกสาร</h1>
          <p className="text-gray-500 text-sm mt-0.5">จัดการเอกสารบัญชีทั้งหมด</p>
        </div>
        <Link href="/documents/new" id="docs-new-btn" className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          สร้างเอกสาร
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Type Tabs */}
        <div className="flex flex-wrap gap-1">
          {DOC_TABS.map(tab => {
            const isActive = (searchParams.type || '') === tab.key
            const url = tab.key
              ? `/documents?type=${tab.key}${search ? `&q=${search}` : ''}`
              : `/documents${search ? `?q=${search}` : ''}`
            return (
              <a key={tab.key} href={url}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </a>
            )
          })}
        </div>

        {/* Search */}
        <form method="GET" action="/documents" className="flex gap-2">
          {docType && <input type="hidden" name="type" value={docType} />}
          <input
            id="doc-search"
            name="q"
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร หรือชื่อผู้ติดต่อ..."
            defaultValue={search}
            className="form-input flex-1 max-w-sm"
          />
          <button type="submit" className="btn-secondary btn-sm">ค้นหา</button>
          {search && <a href={`/documents${docType ? `?type=${docType}` : ''}`} className="btn-ghost btn-sm">ล้าง</a>}
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
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <Link href={createSortUrl('docNumber')} className="group flex items-center hover:text-blue-600 transition-colors">
                    เลขที่เอกสาร <SortIcon field="docNumber" />
                  </Link>
                </th>
                <th>ประเภท</th>
                <th>ผู้ติดต่อ</th>
                <th className="text-right">
                  <Link href={createSortUrl('amount')} className="group flex items-center justify-end hover:text-blue-600 transition-colors">
                    จำนวนเงิน <SortIcon field="amount" />
                  </Link>
                </th>
                <th>สถานะ</th>
                <th>
                  <Link href={createSortUrl('date')} className="group flex items-center hover:text-blue-600 transition-colors">
                    วันที่ <SortIcon field="date" />
                  </Link>
                </th>
                <th>Drive</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-12">
                    <div className="space-y-3">
                      <div className="text-4xl">📄</div>
                      <div>ยังไม่มีเอกสาร</div>
                      <Link href="/documents/new" className="text-blue-600 hover:underline text-sm">สร้างเอกสารแรก →</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map(doc => {
                  const snapshot = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
                  const driveIcon = doc.driveStatus === 'uploaded' ? '☁️✓' : doc.driveStatus === 'pending' ? '☁️⟳' : doc.driveStatus === 'failed' ? '☁️✕' : '—'
                  return (
                    <tr key={doc.id}>
                      <td>
                        <Link href={`/documents/${doc.id}`} className="font-mono text-blue-600 hover:underline text-xs font-medium">
                          {doc.docNumber}
                        </Link>
                      </td>
                      <td><span className="text-xs text-gray-600">{DOC_TYPE_LABELS[doc.docType as DocType]}</span></td>
                      <td><span className="text-sm text-gray-700 max-w-[160px] truncate block">{snapshot?.name || '—'}</span></td>
                      <td className="text-right font-mono text-sm font-semibold text-gray-900">
                        {formatCurrency(doc.totalAmount)}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[doc.status] || 'badge-draft'}`}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">{formatDateThai(doc.date)}</td>
                      <td className="text-xs text-gray-400">{driveIcon}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
            {page > 1 && (
              <a href={`/documents?page=${page - 1}${docType ? `&type=${docType}` : ''}${search ? `&q=${search}` : ''}`}
                className="btn-secondary btn-sm">← ก่อนหน้า</a>
            )}
            <span className="text-sm text-gray-500">หน้า {page} / {pages}</span>
            {page < pages && (
              <a href={`/documents?page=${page + 1}${docType ? `&type=${docType}` : ''}${search ? `&q=${search}` : ''}`}
                className="btn-secondary btn-sm">ถัดไป →</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
