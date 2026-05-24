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
  signatureUrl?: string
  stampUrl?: string
}

type AssetKind = 'logo' | 'signature' | 'stamp'

export default function CompanySettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [uploadingAsset, setUploadingAsset] = useState<AssetKind | null>(null)

  useEffect(() => {
    fetch('/api/settings/company')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(({ tenant }) => setTenant(tenant))
      .catch(() => setError('โหลดข้อมูลบริษัทไม่สำเร็จ'))
      .finally(() => setFetching(false))
  }, [])

  async function handleAssetUpload(kind: AssetKind, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAsset(kind)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)

    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const { url } = await res.json()
        const field = kind === 'signature' ? 'signatureUrl' : kind === 'stamp' ? 'stampUrl' : 'logoUrl'
        setTenant(prev => ({
          name: prev?.name || '',
          taxId: prev?.taxId || '',
          address: prev?.address || '',
          branch: prev?.branch || 'สำนักงานใหญ่',
          phone: prev?.phone || '',
          email: prev?.email || '',
          logoUrl: prev?.logoUrl,
          signatureUrl: prev?.signatureUrl,
          stampUrl: prev?.stampUrl,
          [field]: url,
        }))
      } else {
        setError('อัปโหลดรูปไม่สำเร็จ')
      }
    } catch {
      setError('อัปโหลดรูปไม่สำเร็จ')
    } finally {
      setUploadingAsset(null)
      e.target.value = ''
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
          logoUrl: tenant?.logoUrl,
          signatureUrl: tenant?.signatureUrl,
          stampUrl: tenant?.stampUrl,
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
        <h2 className="text-sm font-medium text-gray-700 mb-4">รูปสำหรับเอกสาร PDF</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AssetUploader
            title="โลโก้บริษัท"
            description="ใช้หัวเอกสาร"
            imageUrl={tenant?.logoUrl}
            uploading={uploadingAsset === 'logo'}
            onChange={(e) => handleAssetUpload('logo', e)}
          />
          <AssetUploader
            title="ลายเซ็น"
            description="ใช้ช่องผู้อนุมัติ/ผู้รับเงิน"
            imageUrl={tenant?.signatureUrl}
            uploading={uploadingAsset === 'signature'}
            onChange={(e) => handleAssetUpload('signature', e)}
          />
          <AssetUploader
            title="ตราประทับ"
            description="ใช้คู่กับลายเซ็น"
            imageUrl={tenant?.stampUrl}
            uploading={uploadingAsset === 'stamp'}
            onChange={(e) => handleAssetUpload('stamp', e)}
          />
        </div>
        <p className="text-sm text-gray-500 mt-4">รองรับ PNG/JPG ขนาดไม่เกิน 2MB แนะนำพื้นหลังโปร่งใสสำหรับลายเซ็นและตราประทับ</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label" htmlFor="company-name">ชื่อบริษัท *</label>
            <input id="company-name" name="name" className="form-input" required placeholder="บริษัท ตัวอย่าง จำกัด" defaultValue={tenant?.name || ''} />
          </div>
          <div>
            <label className="form-label" htmlFor="company-taxid">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
            <input id="company-taxid" name="taxId" className="form-input font-mono" maxLength={13} placeholder="0000000000000" pattern="\d{13}" defaultValue={tenant?.taxId || ''} />
          </div>
          <div>
            <label className="form-label" htmlFor="company-branch">สาขา</label>
            <input id="company-branch" name="branch" className="form-input" placeholder="สำนักงานใหญ่" defaultValue={tenant?.branch || 'สำนักงานใหญ่'} />
          </div>
          <div className="col-span-2">
            <label className="form-label" htmlFor="company-address">ที่อยู่</label>
            <textarea id="company-address" name="address" className="form-input h-24 resize-none" placeholder="ที่อยู่ของบริษัท..." defaultValue={tenant?.address || ''} />
          </div>
          <div>
            <label className="form-label" htmlFor="company-phone">โทรศัพท์</label>
            <input id="company-phone" name="phone" type="tel" className="form-input" placeholder="02-000-0000" defaultValue={tenant?.phone || ''} />
          </div>
          <div>
            <label className="form-label" htmlFor="company-email">อีเมล</label>
            <input id="company-email" name="email" type="email" className="form-input" placeholder="info@company.com" defaultValue={tenant?.email || ''} />
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

function AssetUploader({ title, description, imageUrl, uploading, onChange }: {
  title: string
  description: string
  imageUrl?: string
  uploading: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="h-24 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-3">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-gray-400 text-xs">ยังไม่มีรูป</span>
        )}
      </div>
      <div className="font-medium text-gray-900 text-sm">{title}</div>
      <div className="text-xs text-gray-500 mb-3">{description}</div>
      <label className="btn-secondary btn-sm cursor-pointer w-full justify-center">
        {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
        <input type="file" className="hidden" accept="image/*" onChange={onChange} disabled={uploading} />
      </label>
    </div>
  )
}
