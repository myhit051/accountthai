'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct, ProductData } from '@/actions/products'
import { Product } from '@/db/schema'
import { EXPENSE_CATEGORIES } from '@/lib/expense-categories'

const TYPE_OPTIONS = [
  { value: 'product', label: 'สินค้า' },
  { value: 'service', label: 'บริการ' },
]

const VAT_OPTIONS = [
  { value: 'vat', label: 'มี VAT 7%' },
  { value: 'none', label: 'ไม่มี VAT' },
]

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = parseFloat(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const data = new FormData(form)

    const name = String(data.get('name') || '').trim()
    if (!name) {
      setError('กรุณากรอกชื่อสินค้า')
      return
    }

    const costRaw = String(data.get('cost') || '').trim()
    const payload: ProductData = {
      code: String(data.get('code') || '') || undefined,
      name,
      description: String(data.get('description') || '') || undefined,
      type: (data.get('type') as ProductData['type']) || 'product',
      unit: String(data.get('unit') || '') || undefined,
      unitPrice: parseNumber(data.get('unitPrice')),
      cost: costRaw ? parseNumber(data.get('cost')) : undefined,
      vatType: (data.get('vatType') as ProductData['vatType']) || 'vat',
      category: String(data.get('category') || '') || undefined,
    }

    setLoading(true)
    const result = product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload)

    if (result.success) router.push('/products')
    else {
      setError('เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label" htmlFor="code">รหัสสินค้า</label>
          <input id="code" name="code" className="form-input font-mono" placeholder="เช่น P-001" defaultValue={product?.code || ''} />
        </div>
        <div>
          <label className="form-label" htmlFor="type">ประเภท</label>
          <select id="type" name="type" className="form-input" defaultValue={product?.type || 'product'}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="name">ชื่อสินค้า / บริการ *</label>
          <input id="name" name="name" className="form-input" required placeholder="ชื่อสินค้าหรือบริการ" defaultValue={product?.name || ''} />
        </div>
        <div>
          <label className="form-label" htmlFor="unit">หน่วย</label>
          <input id="unit" name="unit" className="form-input" placeholder="ชิ้น" defaultValue={product?.unit || 'ชิ้น'} />
        </div>
        <div>
          <label className="form-label" htmlFor="vatType">ภาษีมูลค่าเพิ่ม</label>
          <select id="vatType" name="vatType" className="form-input" defaultValue={product?.vatType || 'vat'}>
            {VAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="unitPrice">ราคา/หน่วย (บาท)</label>
          <input id="unitPrice" name="unitPrice" type="number" min="0" step="0.01" className="form-input text-right font-mono" placeholder="0.00" defaultValue={product?.unitPrice || ''} />
        </div>
        <div>
          <label className="form-label" htmlFor="cost">ต้นทุน/หน่วย (บาท)</label>
          <input id="cost" name="cost" type="number" min="0" step="0.01" className="form-input text-right font-mono" placeholder="ไม่ระบุ" defaultValue={product?.cost ?? ''} />
        </div>
        <div>
          <label className="form-label" htmlFor="category">หมวดหมู่ค่าใช้จ่าย</label>
          <select id="category" name="category" className="form-input" defaultValue={product?.category || ''}>
            <option value="">ไม่ระบุ</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">ใช้เติมอัตโนมัติเมื่อเลือกสินค้านี้ในบันทึกค่าใช้จ่าย</p>
        </div>
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="description">คำอธิบาย</label>
          <textarea id="description" name="description" className="form-input h-20 resize-none" placeholder="รายละเอียดเพิ่มเติม..." defaultValue={product?.description || ''} />
        </div>
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</div>}

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">ยกเลิก</button>
        <button id="save-product-btn" type="submit" disabled={loading} className="btn-primary">
          {loading ? <><div className="spinner w-4 h-4" /> กำลังบันทึก...</> : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}
