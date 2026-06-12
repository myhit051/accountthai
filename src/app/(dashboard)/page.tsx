import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboardStats, getRecentDocuments, getContactCount, getCompanyProfileStatus, hasDriveConnected } from '@/db/queries/dashboard'
import { formatCurrency, formatDateThai } from '@/lib/utils'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import DocTypeChart from '@/components/documents/DocTypeChart'
import Link from 'next/link'
import { DOC_STATUS_BADGE_CLASS, statusLabel, normalizeStatus } from '@/lib/doc-status'
import { Building2, CheckCircle2, Circle, Cloud, FileText, Users } from 'lucide-react'

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

  const [stats, recentDocs, contactCount, companyProfile, driveConnected] = await Promise.all([
    getDashboardStats(tenantId, year, month),
    getRecentDocuments(tenantId, 5),
    getContactCount(tenantId),
    getCompanyProfileStatus(tenantId),
    hasDriveConnected(tenantId),
  ])

  const quickStartSteps = [
    {
      label: 'ตั้งค่าบริษัท',
      description: 'กรอกเลขภาษี ที่อยู่ โลโก้ และข้อมูลเอกสาร',
      href: '/settings/company',
      complete: companyProfile.isComplete,
      icon: Building2,
    },
    {
      label: 'เพิ่มผู้ติดต่อ',
      description: 'เตรียมรายชื่อลูกค้าและผู้ขายไว้ใช้ออกเอกสาร',
      href: '/contacts',
      complete: contactCount > 0,
      icon: Users,
    },
    {
      label: 'สร้างเอกสารแรก',
      description: 'ออกใบเสนอราคา ใบกำกับภาษี หรือค่าใช้จ่าย',
      href: '/documents/new',
      complete: stats.docCount > 0,
      icon: FileText,
    },
    {
      label: 'เชื่อมต่อ Google Drive',
      description: 'สำรองสำเนา PDF อัตโนมัติเข้าโฟลเดอร์ที่กำหนด',
      href: '/settings',
      complete: driveConnected,
      icon: Cloud,
    },
  ]
  const completedQuickStart = quickStartSteps.filter((step) => step.complete).length

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

      {/* Quick start */}
      <div className="card overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="border-b border-blue-100 bg-blue-50/80 p-5 lg:w-72 lg:border-b-0 lg:border-r">
            <div className="text-xs font-semibold text-blue-700">เริ่มต้นใช้งาน AccountThai</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{completedQuickStart}/{quickStartSteps.length}</div>
            <p className="mt-1 text-sm text-gray-500">
              ทำขั้นตอนหลักให้ครบเพื่อให้เอกสารและรายงานพร้อมใช้งานจริง
            </p>
          </div>
          <div className="grid flex-1 grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {quickStartSteps.map((step) => {
              const Icon = step.icon
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  className="group flex min-h-36 flex-col justify-between p-5 transition-colors hover:bg-blue-50/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-gray-100">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    {step.complete ? (
                      <CheckCircle2 className="text-green-500" size={18} aria-label="เสร็จแล้ว" />
                    ) : (
                      <Circle className="text-gray-300 group-hover:text-blue-400" size={18} aria-label="ยังไม่เสร็จ" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-700">{step.label}</div>
                    <p className="mt-1 text-sm leading-5 text-gray-500">{step.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
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
                    <tr key={doc.id}>
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
                        <span className={`badge ${DOC_STATUS_BADGE_CLASS[normalizeStatus(doc.status)]}`}>
                          {statusLabel(normalizeStatus(doc.status), doc.docType)}
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
