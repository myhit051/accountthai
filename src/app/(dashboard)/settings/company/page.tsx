'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TenantData {
  name: string
  taxId: string
  address: string
  branch: string
  phone: string
  email: string
  logoUrl?: string
}

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    // We don't have a direct GET endpoint for tenant in API. 
    // We can just rely on user filling if it's not present, or create a quick GET endpoint if needed.
    // For now, let's just initialize empty since the task is Logo Upload.
    setFetching(false)
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const { url } = await res.json()
        setTenant(prev => prev ? { ...prev, logoUrl: url } : { name: '', taxId: '', address: '', branch: '', phone: '', email: '', logoUrl: url })
      } else {
        setError('อัปโหลดโลโก้ไม่สำเร็จ')
      }
    } catch {
      setError('อัปโหลดโลโก้ไม่สำเร็จ')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    const taxId = data.get('taxId') as string
    if (taxId && taxId.length !== 13) {
      setError('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          taxId: taxId || undefined,
          address: data.get('address'),
          branch: data.get('branch'),
          phone: data.get('phone'),
          email: data.get('email'),
          // Backend doesn't strictly need logoUrl update here, since logo upload API updates it immediately
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/settings'), 1500)
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    } catch {
      setError('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-center text-gray-400">Loading...</div>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </a>
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลบริษัท</h1>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">โลโก้บริษัท (แสดงบนเอกสาร PDF)</h2>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {tenant?.logoUrl ? (
              <img src={tenant.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-xs">ไม่มีโลโก้</span>
            )}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer">
              {uploadingLogo ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ (สูงสุด 2MB)'}
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
            <p className="text-sm text-gray-500 mt-2">อัตราส่วนที่แนะนำ 4:1 หรือ 1:1, พื้นหลังโปร่งใส</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label" htmlFor="company-name">ชื่อบริษัท *</label>
            <input id="company-name" name="name" className="form-input" required placeholder="บริษัท ตัวอย่าง จำกัด" />
          </div>
          <div>
            <label className="form-label" htmlFor="company-taxid">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
            <input id="company-taxid" name="taxId" className="form-input font-mono" maxLength={13} placeholder="0000000000000" pattern="\d{13}" />
          </div>
          <div>
            <label className="form-label" htmlFor="company-branch">สาขา</label>
            <input id="company-branch" name="branch" className="form-input" placeholder="สำนักงานใหญ่" defaultValue="สำนักงานใหญ่" />
          </div>
          <div className="col-span-2">
            <label className="form-label" htmlFor="company-address">ที่อยู่</label>
            <textarea id="company-address" name="address" className="form-input h-24 resize-none" placeholder="ที่อยู่ของบริษัท..." />
          </div>
          <div>
            <label className="form-label" htmlFor="company-phone">โทรศัพท์</label>
            <input id="company-phone" name="phone" type="tel" className="form-input" placeholder="02-000-0000" />
          </div>
          <div>
            <label className="form-label" htmlFor="company-email">อีเมล</label>
            <input id="company-email" name="email" type="email" className="form-input" placeholder="info@company.com" />
          </div>
        </div>

        {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>}
        {saved && <div className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3">✓ บันทึกสำเร็จ</div>}

        <div className="flex gap-3 justify-end pt-2">
          <a href="/settings" className="btn-secondary">ยกเลิก</a>
          <button id="save-company-btn" type="submit" disabled={loading} className="btn-primary">
            {loading ? <><div className="spinner w-4 h-4" /> กำลังบันทึก...</> : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}
