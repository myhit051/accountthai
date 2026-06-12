'use client'

import { useState, useEffect, useRef } from 'react'
import { Product } from '@/db/schema'
import { createProduct } from '@/actions/products'

interface Props {
  products: Product[]
  value: string
  onChangeText: (text: string) => void
  onSelect: (product: Product) => void
  onCreated: (product: Product) => void
  placeholder?: string
}

export default function ProductSearch({
  products,
  value,
  onChangeText,
  onSelect,
  onCreated,
  placeholder = 'พิมพ์เพื่อค้นหาสินค้า...',
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState<Product[]>([])
  // dropdown ใช้ position: fixed อ้างอิงตำแหน่งช่องกรอก เพื่อไม่ให้โดน overflow ของตารางตัดทิ้ง
  const inputRef = useRef<HTMLInputElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

  // Quick-add modal state
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'product', unit: 'ชิ้น', unitPrice: '0', vatType: 'vat' })

  const query = value || ''

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setFiltered(products.slice(0, 8))
      return
    }
    setFiltered(
      products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q))
      ).slice(0, 8)
    )
  }, [query, products])

  const hasExactMatch = products.some(p => p.name.trim().toLowerCase() === query.trim().toLowerCase())
  const showCreate = query.trim().length > 0 && !hasExactMatch

  // อัปเดตตำแหน่ง dropdown ให้ตรงกับช่องกรอก (รวมตอน scroll/resize ระหว่างเปิดอยู่)
  useEffect(() => {
    if (!isOpen) return
    const updateCoords = () => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [isOpen])

  function handleSelect(product: Product) {
    setIsOpen(false)
    onSelect(product)
  }

  function openQuickAdd() {
    setForm({ name: query.trim(), type: 'product', unit: 'ชิ้น', unitPrice: '0', vatType: 'vat' })
    setIsOpen(false)
    setQuickAddOpen(true)
  }

  async function handleQuickAddSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const price = parseFloat(form.unitPrice)
      const result = await createProduct({
        name: form.name.trim(),
        type: form.type as 'product' | 'service',
        unit: form.unit || 'ชิ้น',
        unitPrice: Number.isFinite(price) ? price : 0,
        vatType: form.vatType as 'vat' | 'none',
      })
      if (result.success && result.product) {
        onCreated(result.product as unknown as Product)
        setQuickAddOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="form-input text-sm py-1.5"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { onChangeText(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        autoComplete="off"
        required
      />

      {isOpen && coords && (filtered.length > 0 || showCreate) && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          style={{ top: coords.top, left: coords.left, width: coords.width }}>
          {filtered.map(product => (
            <button
              key={product.id}
              type="button"
              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
              onMouseDown={() => handleSelect(product)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                <div className="text-xs font-mono text-gray-500 flex-shrink-0">{product.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                {product.code && <span>{product.code}</span>}
                {product.unit && <span>/ {product.unit}</span>}
              </div>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
              onMouseDown={(e) => { e.preventDefault(); openQuickAdd() }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              บันทึก &quot;{query.trim()}&quot; เป็นสินค้าใหม่
            </button>
          )}
        </div>
      )}

      {quickAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onMouseDown={() => setQuickAddOpen(false)}>
          <div className="card w-full max-w-md p-5 space-y-3" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">เพิ่มสินค้าใหม่</h3>
            <div>
              <label className="form-label">ชื่อสินค้า / บริการ *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ชื่อสินค้า" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">ประเภท</label>
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="product">สินค้า</option>
                  <option value="service">บริการ</option>
                </select>
              </div>
              <div>
                <label className="form-label">หน่วย</label>
                <input className="form-input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="ชิ้น" />
              </div>
              <div>
                <label className="form-label">ราคา/หน่วย</label>
                <input className="form-input text-right font-mono" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
              </div>
              <div>
                <label className="form-label">ภาษีมูลค่าเพิ่ม</label>
                <select className="form-input" value={form.vatType} onChange={(e) => setForm({ ...form, vatType: e.target.value })}>
                  <option value="vat">มี VAT 7%</option>
                  <option value="none">ไม่มี VAT</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" className="btn-secondary" onClick={() => setQuickAddOpen(false)} disabled={saving}>ยกเลิก</button>
              <button type="button" className="btn-primary" onClick={handleQuickAddSave} disabled={saving || !form.name.trim()}>
                {saving ? <><div className="spinner w-4 h-4" /> กำลังบันทึก...</> : 'บันทึกและเลือก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
