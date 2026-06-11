'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AdAccount {
  id: string
  name: string
  accountId: string
  currency: string
}

export default function MetaSettingsPage() {
  const router = useRouter()
  const [fetching, setFetching] = useState(true)
  const [connected, setConnected] = useState(false)
  const [connectedName, setConnectedName] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [adAccounts, setAdAccounts] = useState<AdAccount[] | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/meta/connect')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setConnected(data.connected)
        setConnectedName(data.adAccountName)
      })
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  async function handleVerify() {
    setError('')
    setAdAccounts(null)
    if (!token.trim()) {
      setError('กรุณาวางโทเค็นก่อน')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/meta/adaccounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === 'invalid_token'
          ? 'โทเค็นไม่ถูกต้องหรือหมดอายุ'
          : 'ไม่สามารถเชื่อมต่อ Meta ได้ กรุณาลองใหม่')
        return
      }
      if (!data.adAccounts?.length) {
        setError('ไม่พบบัญชีโฆษณาในโทเค็นนี้ (ต้องมีสิทธิ์ ads_read)')
        return
      }
      setAdAccounts(data.adAccounts)
      setSelectedId(data.adAccounts[0].id)
    } catch {
      setError('ไม่สามารถเชื่อมต่อ Meta ได้ กรุณาลองใหม่')
    } finally {
      setVerifying(false)
    }
  }

  async function handleSave() {
    const account = adAccounts?.find(a => a.id === selectedId)
    if (!account) return
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/meta/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token.trim(),
          adAccountId: account.id,
          adAccountName: account.name,
          currency: account.currency,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/meta-ads'), 1200)
      } else {
        const data = await res.json()
        setError(data.error === 'invalid_token'
          ? 'โทเค็นไม่ถูกต้องหรือหมดอายุ'
          : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-600">← ตั้งค่า</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">เชื่อมต่อ Meta Ads</h1>
        <p className="text-sm text-gray-400 mt-1">ดึงค่าโฆษณาและรายการเรียกเก็บเงินจาก Facebook/Meta มาแสดงในเมนู ค่าโฆษณา Meta</p>
      </div>

      {connected && (
        <div className="card p-4 bg-green-50 border border-green-100 text-sm text-green-700">
          ✓ เชื่อมต่อแล้ว{connectedName ? ` · ${connectedName}` : ''} — กรอกโทเค็นใหม่ด้านล่างหากต้องการเปลี่ยนโทเค็นหรือบัญชีโฆษณา
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Access Token</label>
          <textarea
            value={token}
            onChange={e => setToken(e.target.value)}
            rows={3}
            placeholder="วางโทเค็นจาก Meta ที่นี่ (EAAB...)"
            className="form-input w-full font-mono text-xs"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            วางโทเค็นจาก Meta (ต้องมีสิทธิ์ ads_read) — โทเค็นจะถูกเข้ารหัสก่อนบันทึก
            แนะนำใช้ System User Token จาก Business Manager เพราะไม่มีวันหมดอายุ
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          className="btn-primary btn-sm"
        >
          {verifying ? 'กำลังตรวจสอบ...' : 'ตรวจสอบโทเค็น'}
        </button>

        {adAccounts && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกบัญชีโฆษณา</label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="form-input w-full"
              >
                {adAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id}) — {a.currency}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saved}
              className="btn-primary"
            >
              {saved ? '✓ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกการเชื่อมต่อ'}
            </button>
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}
        {saved && <div className="text-sm text-green-600">เชื่อมต่อสำเร็จ! กำลังพาไปหน้าค่าโฆษณา Meta...</div>}
      </div>
    </div>
  )
}
