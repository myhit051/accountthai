'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContact, ContactData } from '@/actions/contacts'

const TYPE_OPTIONS = [
  { value: 'customer', label: 'ลูกค้า' },
  { value: 'vendor', label: 'ผู้ขาย' },
  { value: 'both', label: 'ลูกค้า / ผู้ขาย' },
]

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    const result = await createContact({
      name: data.get('name') as string,
      taxId: taxId || undefined,
      address: (data.get('address') as string) || undefined,
      branch: (data.get('branch') as string) || undefined,
      phone: (data.get('phone') as string) || undefined,
      email: (data.get('email') as string) || undefined,
      type: (data.get('type') as ContactData['type']) || 'customer',
    })
    if (result.success) router.push('/contacts')
    else { setError('เกิดข้อผิดพลาด'); setLoading(false) }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มผู้ติดต่อ</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="form-label" htmlFor="name">ชื่อ / บริษัท *</label>
            <input id="name" name="name" className="form-input" required placeholder="ชื่อบริษัท หรือชื่อบุคคล" />
          </div>
          <div>
            <label className="form-label" htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</label>
            <input id="taxId" name="taxId" className="form-input font-mono" maxLength={13} placeholder="0000000000000" pattern="\d{13}" />
          </div>
          <div>
            <label className="form-label" htmlFor="branch">สาขา</label>
            <input id="branch" name="branch" className="form-input" placeholder="สำนักงานใหญ่" />
          </div>
          <div className="col-span-2">
            <label className="form-label" htmlFor="address">ที่อยู่</label>
            <textarea id="address" name="address" className="form-input h-20 resize-none" placeholder="ที่อยู่เต็ม..." />
          </div>
          <div>
            <label className="form-label" htmlFor="phone">โทรศัพท์</label>
            <input id="phone" name="phone" type="tel" className="form-input" placeholder="02-000-0000" />
          </div>
          <div>
            <label className="form-label" htmlFor="email">อีเมล</label>
            <input id="email" name="email" type="email" className="form-input" placeholder="contact@company.com" />
          </div>
          <div>
            <label className="form-label" htmlFor="type">ประเภท</label>
            <select id="type" name="type" className="form-input">
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">ยกเลิก</button>
          <button id="save-contact-btn" type="submit" disabled={loading} className="btn-primary">
            {loading ? <><div className="spinner w-4 h-4" /> กำลังบันทึก...</> : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  )
}
