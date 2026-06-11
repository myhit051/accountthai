import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  getMetaIntegration,
  fetchBillingCharges,
  fetchDailySpend,
  metaReceiptUrl,
  MetaTokenError,
  BillingCharge,
  DailySpend,
} from '@/lib/meta'
import { formatDateThai } from '@/lib/utils'
import MetaSpendChart from '@/components/meta/MetaSpendChart'

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default async function MetaAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string; until?: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const defaultSince = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
  const since = /^\d{4}-\d{2}-\d{2}$/.test(params.since || '') ? params.since! : toDateInput(defaultSince)
  const until = /^\d{4}-\d{2}-\d{2}$/.test(params.until || '') ? params.until! : toDateInput(now)

  const integration = await getMetaIntegration(session.user.id)

  if (!integration) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">ค่าโฆษณา Meta</h1>
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📣</div>
          <div className="text-gray-700 font-medium mb-1">ยังไม่ได้เชื่อมต่อ Meta Ads</div>
          <div className="text-sm text-gray-400 mb-4">เชื่อมต่อด้วย Access Token เพื่อดูค่าโฆษณาและรายการเรียกเก็บเงินจาก Facebook/Meta</div>
          <Link href="/settings/meta" className="btn-primary">เชื่อมต่อเลย</Link>
        </div>
      </div>
    )
  }

  const currency = integration.currency || 'THB'
  let charges: BillingCharge[] = []
  let daily: DailySpend[] = []
  let errorCard: 'token' | 'fetch' | null = null

  try {
    ;[charges, daily] = await Promise.all([
      fetchBillingCharges(integration.accessToken, integration.adAccountId, since, until),
      fetchDailySpend(integration.accessToken, integration.adAccountId, since, until),
    ])
  } catch (error) {
    errorCard = error instanceof MetaTokenError ? 'token' : 'fetch'
    if (errorCard === 'fetch') console.error('Meta ads page error:', error)
  }

  if (errorCard) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">ค่าโฆษณา Meta</h1>
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          {errorCard === 'token' ? (
            <>
              <div className="text-gray-700 font-medium mb-1">โทเค็น Meta หมดอายุหรือไม่ถูกต้อง</div>
              <div className="text-sm text-gray-400 mb-4">กรุณาเชื่อมต่อใหม่ด้วยโทเค็นที่ใช้งานได้</div>
              <Link href="/settings/meta" className="btn-primary">เชื่อมต่อใหม่</Link>
            </>
          ) : (
            <>
              <div className="text-gray-700 font-medium mb-1">ไม่สามารถดึงข้อมูลจาก Meta ได้</div>
              <div className="text-sm text-gray-400">กรุณาลองใหม่อีกครั้งในอีกสักครู่</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const totalSpend = daily.reduce((s, d) => s + d.spend, 0)
  const totalCharged = charges.reduce((s, c) => s + c.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">ค่าโฆษณา Meta</h1>
        <Link href="/settings/meta" className="btn-secondary btn-sm">⚙️ ตั้งค่าการเชื่อมต่อ</Link>
      </div>

      {/* Date range filter */}
      <div className="card p-4">
        <form method="GET" action="/meta-ads" className="flex gap-3 items-center flex-wrap">
          <label className="text-sm text-gray-500">ตั้งแต่</label>
          <input type="date" name="since" defaultValue={since} className="form-input w-40" />
          <label className="text-sm text-gray-500">ถึง</label>
          <input type="date" name="until" defaultValue={until} className="form-input w-40" />
          <button type="submit" className="btn-primary">ดูข้อมูล</button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'ค่าใช้จ่ายรวม (Insights)', value: formatMoney(totalSpend, currency), color: 'text-blue-600', bg: 'bg-blue-50', icon: '📊' },
          { label: 'ยอดเรียกเก็บรวม (Billing)', value: formatMoney(totalCharged, currency), color: 'text-orange-600', bg: 'bg-orange-50', icon: '🧾' },
          { label: 'บัญชีโฆษณา', value: integration.adAccountName || integration.adAccountId, color: 'text-gray-800', bg: 'bg-gray-50', icon: '📣' },
        ].map((c, i) => (
          <div key={i} className="metric-card">
            <div className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center text-lg`}>{c.icon}</div>
            <div className={`metric-value ${c.color}`}>{c.value}</div>
            <div className="metric-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Daily spend */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ค่าใช้จ่ายรายวัน</h2>
        <MetaSpendChart data={daily} />
        {daily.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th className="text-right">ค่าใช้จ่าย</th>
                </tr>
              </thead>
              <tbody>
                {[...daily].reverse().map(d => (
                  <tr key={d.date}>
                    <td className="text-sm">{formatDateThai(new Date(d.date))}</td>
                    <td className="text-right font-mono text-sm">{formatMoney(d.spend, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Billing charges */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">รายการเรียกเก็บเงิน (Billing)</h2>
          <p className="text-xs text-gray-400 mt-0.5">ทุกครั้งที่ Meta ตัดเงิน — กด &quot;เปิดใบเสร็จ&quot; เพื่อดู/ดาวน์โหลดใบเสร็จจริงจาก Facebook</p>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th className="text-right">จำนวนเงิน</th>
                <th>Transaction ID</th>
                <th>ใบเสร็จ</th>
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">ยังไม่มีข้อมูลในช่วงเวลานี้</td>
                </tr>
              ) : charges.map((c, i) => (
                <tr key={`${c.transactionId}-${i}`}>
                  <td className="text-sm">{formatDateThai(new Date(c.date))}</td>
                  <td className="text-right font-mono text-sm font-semibold">{formatMoney(c.amount, c.currency || currency)}</td>
                  <td className="font-mono text-xs text-gray-500">{c.transactionId || '—'}</td>
                  <td>
                    {c.transactionId ? (
                      <a
                        href={metaReceiptUrl(c.transactionId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        เปิดใบเสร็จ ↗
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
