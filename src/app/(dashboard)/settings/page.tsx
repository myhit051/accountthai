import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { tenants, driveIntegrations, metaIntegrations } from '@/db/schema'
import { getBankAccounts } from '@/db/queries/banks'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const tenantId = session.user.id

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  const [drive] = await db.select({ tenantId: driveIntegrations.tenantId, connectedAt: driveIntegrations.connectedAt })
    .from(driveIntegrations).where(eq(driveIntegrations.tenantId, tenantId)).limit(1)
  const [meta] = await db.select({
    tenantId: metaIntegrations.tenantId,
    adAccountName: metaIntegrations.adAccountName,
    connectedAt: metaIntegrations.connectedAt,
  }).from(metaIntegrations).where(eq(metaIntegrations.tenantId, tenantId)).limit(1)
  const banks = await getBankAccounts(tenantId)

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>

      {/* Company Profile */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-800">ข้อมูลบริษัท</h2>
          <Link href="/settings/company" className="btn-secondary btn-sm">แก้ไข</Link>
        </div>
        {tenant ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'ชื่อบริษัท', value: tenant.name },
              { label: 'เลขประจำตัวผู้เสียภาษี', value: tenant.taxId || '—' },
              { label: 'สาขา', value: tenant.branch || '—' },
              { label: 'โทรศัพท์', value: tenant.phone || '—' },
              { label: 'อีเมล', value: tenant.email || '—' },
            ].map(f => (
              <div key={f.label}>
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="font-medium text-gray-800 mt-0.5">{f.value}</div>
              </div>
            ))}
            <div className="col-span-2">
              <div className="text-xs text-gray-400">ที่อยู่</div>
              <div className="font-medium text-gray-800 mt-0.5">{tenant.address || '—'}</div>
            </div>
            {tenant.logoUrl && (
              <div className="col-span-2">
                <div className="text-xs text-gray-400 mb-2">โลโก้</div>
                <img src={tenant.logoUrl} alt="logo" className="h-12 object-contain" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-gray-400 text-sm mb-3">ยังไม่ได้ตั้งค่าข้อมูลบริษัท</div>
            <Link href="/settings/company" className="btn-primary btn-sm">ตั้งค่าเลย</Link>
          </div>
        )}
      </div>

      {/* Bank Accounts */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-gray-800">บัญชีธนาคาร</h2>
            <p className="text-sm text-gray-400 mt-0.5">ตั้งค่าไว้ครั้งเดียว แล้วเลือกจาก dropdown ตอนออกเอกสาร</p>
          </div>
          <Link href="/settings/banks" className="btn-secondary btn-sm">จัดการ</Link>
        </div>
        {banks.length > 0 ? (
          <div className="space-y-1.5">
            {banks.map(b => (
              <div key={b.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-800">{b.bankName}</span>
                <span className="font-mono text-gray-500">{b.accountNumber}</span>
                {b.isDefault && <span className="badge badge-issued text-xs">ค่าเริ่มต้น</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">ยังไม่ได้ตั้งค่าบัญชีธนาคาร</div>
        )}
      </div>

      {/* Google Drive */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Google Drive</h2>
            <p className="text-sm text-gray-400 mt-0.5">เชื่อมต่อเพื่อ backup PDF อัตโนมัติ</p>
          </div>
          {drive ? (
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-medium text-sm">☁️✓ เชื่อมต่อแล้ว</span>
              <a href="/api/drive/disconnect" className="btn-secondary btn-sm text-red-500">ยกเลิก</a>
            </div>
          ) : (
            <a id="connect-drive-btn" href="/api/drive/auth" className="btn-primary btn-sm">
              เชื่อมต่อ Google Drive
            </a>
          )}
        </div>
        {drive && (
          <div className="text-xs text-gray-400">
            เชื่อมต่อเมื่อ: {drive.connectedAt ? new Date((drive.connectedAt as number) * 1000).toLocaleDateString('th-TH') : '—'}
          </div>
        )}
      </div>

      {/* Meta Ads */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Meta Ads</h2>
            <p className="text-sm text-gray-400 mt-0.5">เชื่อมต่อเพื่อดูค่าโฆษณาและใบเสร็จจาก Facebook/Meta</p>
          </div>
          {meta ? (
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-medium text-sm">📣✓ เชื่อมต่อแล้ว</span>
              <Link href="/settings/meta" className="btn-secondary btn-sm">แก้ไข</Link>
              <a href="/api/meta/disconnect" className="btn-secondary btn-sm text-red-500">ยกเลิก</a>
            </div>
          ) : (
            <Link id="connect-meta-btn" href="/settings/meta" className="btn-primary btn-sm">
              เชื่อมต่อ Meta Ads
            </Link>
          )}
        </div>
        {meta && (
          <div className="text-xs text-gray-400">
            บัญชีโฆษณา: {meta.adAccountName || '—'} · เชื่อมต่อเมื่อ: {meta.connectedAt ? new Date((meta.connectedAt as number) * 1000).toLocaleDateString('th-TH') : '—'}
          </div>
        )}
      </div>

      {/* Account */}
      <div className="card p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-800">บัญชีผู้ใช้</h2>
        <div className="text-sm">
          <div className="text-xs text-gray-400">ชื่อ</div>
          <div className="font-medium text-gray-800">{session.user.name}</div>
        </div>
        <div className="text-sm">
          <div className="text-xs text-gray-400">อีเมล</div>
          <div className="font-medium text-gray-800">{session.user.email}</div>
        </div>
      </div>
    </div>
  )
}
