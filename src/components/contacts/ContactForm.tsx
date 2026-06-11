'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContact, updateContact, ContactData } from '@/actions/contacts'
import { Contact } from '@/db/schema'
import { Building2, FileText, Landmark, Mail, MapPin, Phone, Save, UserRound, X } from 'lucide-react'

const TYPE_OPTIONS = [
  { value: 'customer', label: 'ลูกค้า', description: 'ใช้กับเอกสารขาย' },
  { value: 'vendor', label: 'ผู้ขาย', description: 'ใช้กับค่าใช้จ่าย' },
  { value: 'both', label: 'ลูกค้า / ผู้ขาย', description: 'ใช้ได้ทั้งสองฝั่ง' },
]

export default function ContactForm({ contact }: { contact?: Contact }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    const taxId = String(data.get('taxId') || '')
    if (taxId && taxId.length !== 13) {
      setError('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
      return
    }

    const payload: ContactData = {
      name: String(data.get('name') || ''),
      taxId: taxId || undefined,
      address: String(data.get('address') || '') || undefined,
      branch: String(data.get('branch') || '') || undefined,
      phone: String(data.get('phone') || '') || undefined,
      email: String(data.get('email') || '') || undefined,
      type: (data.get('type') as ContactData['type']) || 'customer',
    }

    setLoading(true)
    const result = contact
      ? await updateContact(contact.id, payload)
      : await createContact(payload)

    if (result.success) router.push('/contacts')
    else {
      setError('เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  const defaultType = contact?.type || 'customer'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="sticky top-4 z-20 rounded-lg border border-gray-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {contact ? 'แก้ไขรายชื่อผู้ติดต่อ' : 'สร้างรายชื่อผู้ติดต่อ'}
            </div>
            <p className="text-xs text-gray-500">ข้อมูลนี้จะถูกดึงไปใช้ในเอกสารขาย ค่าใช้จ่าย และภาษี</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              <X size={16} aria-hidden="true" />
              ปิดหน้าต่าง
            </button>
            <button id="save-contact-btn" type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <><div className="spinner w-4 h-4" /> กำลังบันทึก...</>
              ) : (
                <><Save size={16} aria-hidden="true" /> บันทึกแล้วปิด</>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 size={18} className="text-blue-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-800">ข้อมูลผู้ติดต่อ</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="form-label">ประเภท</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TYPE_OPTIONS.map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        defaultChecked={defaultType === option.value}
                        className="peer sr-only"
                      />
                      <span className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2">
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500 peer-checked:text-blue-600">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="name">ชื่อ / บริษัท *</label>
                <input id="name" name="name" className="form-input" required placeholder="ชื่อบริษัท หรือชื่อบุคคล" defaultValue={contact?.name || ''} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label" htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</label>
                  <input id="taxId" name="taxId" className="form-input font-mono" maxLength={13} placeholder="0000000000000" pattern="\d{13}" inputMode="numeric" autoComplete="off" defaultValue={contact?.taxId || ''} />
                </div>
                <div>
                  <label className="form-label" htmlFor="branch">สำนักงาน/สาขา</label>
                  <input id="branch" name="branch" className="form-input" placeholder="สำนักงานใหญ่ หรือสาขา 00001" defaultValue={contact?.branch || ''} />
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="address">ที่อยู่</label>
                <textarea id="address" name="address" className="form-input h-28 resize-none" placeholder="ที่อยู่เต็ม..." defaultValue={contact?.address || ''} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UserRound size={18} className="text-blue-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-800">รายละเอียดผู้ติดต่อ</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="form-label" htmlFor="phone">โทรศัพท์</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} aria-hidden="true" />
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" className="form-input pl-9" placeholder="02-000-0000" defaultValue={contact?.phone || ''} />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="email">อีเมล</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} aria-hidden="true" />
                  <input id="email" name="email" type="email" inputMode="email" autoComplete="email" className="form-input pl-9" placeholder="contact@company.com" defaultValue={contact?.email || ''} />
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <FileText size={18} className="text-blue-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-gray-800">นำไปใช้กับเอกสาร</h2>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <span>ชื่อ ที่อยู่ เลขภาษี และสาขาจะถูกบันทึกเป็น snapshot ในเอกสารตอนสร้าง</span>
              </div>
              <div className="flex gap-3">
                <Landmark size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <span>เลือกเป็นผู้ขายเมื่อใช้กับค่าใช้จ่ายหรือหนังสือหัก ณ ที่จ่าย</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
