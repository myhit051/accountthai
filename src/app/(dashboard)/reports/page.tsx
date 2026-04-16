import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { documents, tenants } from '@/db/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string }
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const tenantId = session.user.id
  const now = new Date()
  const year = parseInt(searchParams.year || String(now.getFullYear()))
  const month = parseInt(searchParams.month || String(now.getMonth() + 1))

  const startTs = Math.floor(new Date(year, month - 1, 1).getTime() / 1000)
  const endTs = Math.floor(new Date(year, month, 0, 23, 59, 59).getTime() / 1000)

  const docs = await db.select().from(documents).where(
    and(
      eq(documents.tenantId, tenantId),
      eq(documents.isDeleted, false),
      gte(documents.date, startTs),
      lte(documents.date, endTs)
    )
  )

  const active = docs.filter(d => d.status !== 'void')
  const income = active.filter(d => ['INV', 'RE'].includes(d.docType)).reduce((s, d) => s + d.totalAmount, 0)
  const expense = active.filter(d => d.docType === 'EXP').reduce((s, d) => s + d.totalAmount, 0)
  const vatSales = active.filter(d => d.docType === 'INV').reduce((s, d) => s + d.vatAmount, 0)
  const vatPurchase = active.filter(d => d.docType === 'EXP').reduce((s, d) => s + d.vatAmount, 0)
  const vatNet = vatSales - vatPurchase

  // Export URL
  const exportUrl = `/api/reports/export?year=${year}&month=${month}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
        <a href={exportUrl} id="export-excel-btn" className="btn-secondary">
          📥 ส่งออก Excel
        </a>
      </div>

      {/* Month/Year picker */}
      <div className="card p-4 flex items-center gap-4">
        <form method="GET" action="/reports" className="flex gap-3 items-center">
          <select name="month" defaultValue={month} className="form-input w-36">
            {THAI_MONTHS.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select name="year" defaultValue={year} className="form-input w-24">
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">ดูรายงาน</button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายได้รวม', value: formatCurrency(income), color: 'text-green-600', bg: 'bg-green-50', icon: '📈' },
          { label: 'ค่าใช้จ่ายรวม', value: formatCurrency(expense), color: 'text-orange-600', bg: 'bg-orange-50', icon: '📉' },
          { label: 'ภาษีขาย (VAT)', value: formatCurrency(vatSales), color: 'text-blue-600', bg: 'bg-blue-50', icon: '📊' },
          { label: 'VAT ต้องชำระ', value: formatCurrency(Math.max(0, vatNet)), color: 'text-purple-600', bg: 'bg-purple-50', icon: '💼' },
        ].map((c, i) => (
          <div key={i} className="metric-card">
            <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center text-lg`}>{c.icon}</div>
            <div className={`metric-value ${c.color}`}>{c.value}</div>
            <div className="metric-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* VAT Detail */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">สรุป VAT สำหรับการยื่นภาษี</h2>
        <div className="divide-y divide-gray-100">
          {[
            { label: 'ภาษีขาย (จากใบกำกับภาษี INV)', value: vatSales, color: 'text-blue-600' },
            { label: 'ภาษีซื้อ (จากค่าใช้จ่าย EXP)', value: vatPurchase, color: 'text-orange-600' },
            { label: 'VAT สุทธิ (ต้องชำระ/ขอคืน)', value: vatNet, color: vatNet >= 0 ? 'text-red-600' : 'text-green-600', bold: true },
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-3">
              <span className="text-sm text-gray-600">{row.label}</span>
              <span className={`font-mono text-sm font-${row.bold ? 'bold' : 'medium'} ${row.color}`}>
                {formatCurrency(row.value)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          💡 หากยอด VAT สุทธิเป็นบวก = ต้องชำระ VAT เพิ่ม | หากเป็นลบ = สามารถขอคืนภาษีได้
        </div>
      </div>

      {/* Document List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">เอกสารทั้งหมด {THAI_MONTHS[month]} {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>เลขที่</th>
                <th>ประเภท</th>
                <th>ผู้ติดต่อ</th>
                <th className="text-right">ยอดก่อนภาษี</th>
                <th className="text-right">VAT</th>
                <th className="text-right">ยอดรวม</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">ไม่มีเอกสารในเดือนนี้</td>
                </tr>
              ) : active.map(doc => {
                const contact = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
                return (
                  <tr key={doc.id}>
                    <td><Link href={`/documents/${doc.id}`} className="font-mono text-xs text-blue-600 hover:underline">{doc.docNumber}</Link></td>
                    <td className="text-xs">{doc.docType}</td>
                    <td className="text-sm">{contact?.name || '—'}</td>
                    <td className="text-right font-mono text-sm">{formatCurrency(doc.subtotal)}</td>
                    <td className="text-right font-mono text-sm">{formatCurrency(doc.vatAmount)}</td>
                    <td className="text-right font-mono text-sm font-semibold">{formatCurrency(doc.totalAmount)}</td>
                    <td><span className={`badge badge-${doc.status}`}>{doc.status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
