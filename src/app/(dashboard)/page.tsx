import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboardStats, getRecentDocuments } from '@/db/queries/dashboard'
import { formatCurrency, formatDateThai } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import DocTypeChart from '@/components/documents/DocTypeChart'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  draft: 'ร่าง', issued: 'ออกแล้ว', paid: 'ชำระแล้ว', void: 'ยกเลิก',
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', issued: 'badge-issued', paid: 'badge-paid', void: 'badge-void',
}

const THAI_MONTHS = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const resolvedParams = await searchParams
  const tenantId = session.user.id // single-tenant: user IS the tenant
  const now = new Date()
  const year = parseInt(resolvedParams.year || String(now.getFullYear()))
  const month = parseInt(resolvedParams.month || String(now.getMonth() + 1))

  const [stats, recentDocs] = await Promise.all([
    getDashboardStats(tenantId, year, month),
    getRecentDocuments(tenantId, 5),
  ])

  // Month navigation
  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const prevUrl = `/?year=${prevDate.getFullYear()}&month=${prevDate.getMonth() + 1}`
  const nextUrl = `/?year=${nextDate.getFullYear()}&month=${nextDate.getMonth() + 1}`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-500 text-sm mt-0.5">ภาพรวมธุรกิจของคุณ</p>
        </div>
        <Link
          href="/documents/new"
          className="btn-primary"
          id="dashboard-new-doc"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          สร้างเอกสาร
        </Link>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <a href={prevUrl} className="btn-secondary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </a>
        <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">
          {THAI_MONTHS[month]} {year}
        </span>
        {!isCurrentMonth && (
          <a href={nextUrl} className="btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
          </a>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายได้รวม', value: formatCurrency(stats.income), icon: '📈', color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'ค่าใช้จ่าย', value: formatCurrency(stats.expense), icon: '📉', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'VAT รวม', value: formatCurrency(stats.vat), icon: '🧾', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'เอกสารทั้งหมด', value: stats.docCount.toString(), icon: '📄', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((card, i) => (
          <div key={i} className="metric-card">
            <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center text-lg`}>
              {card.icon}
            </div>
            <div className={`metric-value ${card.color}`}>{card.value}</div>
            <div className="metric-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">จำนวนเอกสารตามประเภท</h2>
          <DocTypeChart byType={stats.byType} />
        </div>

        {/* Outstanding */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">ใบแจ้งหนี้ค้างชำระ</h2>
            <span className="badge badge-issued">{stats.outstanding.length}</span>
          </div>
          {stats.outstanding.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-6">✓ ไม่มียอดค้างชำระ</div>
          ) : (
            <div className="space-y-2">
              {stats.outstanding.map((doc) => {
                const snapshot = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
                return (
                  <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-xs font-mono text-blue-600">{doc.docNumber}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        {snapshot?.name || 'ไม่ระบุ'}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-900 font-mono">
                      {formatCurrency(doc.totalAmount)}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="card">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-sm font-semibold text-gray-700">เอกสารล่าสุด</h2>
          <Link href="/documents" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ประเภท</th>
                <th>ผู้ติดต่อ</th>
                <th className="text-right">จำนวนเงิน</th>
                <th>สถานะ</th>
                <th>วันที่</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-8">
                    ยังไม่มีเอกสาร{' '}
                    <Link href="/documents/new" className="text-blue-600 hover:underline">สร้างเอกสารแรก →</Link>
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => {
                  const snapshot = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
                  return (
                    <tr key={doc.id} onClick={() => {}} className="cursor-pointer">
                      <td>
                        <Link href={`/documents/${doc.id}`} className="font-mono text-blue-600 hover:underline text-xs">
                          {doc.docNumber}
                        </Link>
                      </td>
                      <td><span className="text-xs text-gray-600">{DOC_TYPE_LABELS[doc.docType as DocType]}</span></td>
                      <td><span className="text-sm text-gray-700">{snapshot?.name || '—'}</span></td>
                      <td className="text-right font-mono text-sm font-medium text-gray-900">
                        {formatCurrency(doc.totalAmount)}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_CLASS[doc.status] || 'badge-draft'}`}>
                          {STATUS_LABELS[doc.status] || doc.status}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500">
                        {formatDateThai(doc.date)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
