'use client'

import { useState, useCallback } from 'react'
import { Contact, DocType, DOC_TYPE_LABELS } from '@/db/schema'
import ContactSearch from './ContactSearch'
import { createDocument, updateDocument, LineItem } from '@/actions/documents'
import { formatCurrency, amountInThaiWords, calculateVat } from '@/lib/utils'

interface Props {
  contacts: Contact[]
  docType: DocType
  initialData?: any
}

function generateLineId() {
  return Math.random().toString(36).substring(2, 9)
}

const VAT_TYPES: Record<DocType, boolean> = {
  INV: true, QT: true, BL: true, RE: true, EXP: false, WT: false,
}

export default function DocumentForm({ contacts, docType, initialData }: Props) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    initialData?.contactId ? contacts.find(c => c.id === initialData.contactId) || null : null
  )
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate * 1000).toISOString().split('T')[0] : '')
  const [includeVat, setIncludeVat] = useState(initialData ? initialData.vatAmount > 0 : VAT_TYPES[docType])
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems ? JSON.parse(initialData.lineItems) : [
    { id: generateLineId(), description: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, amount: 0 },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, string>>(
    initialData?.metadata ? JSON.parse(initialData.metadata) : {
      filingForm: 'ภ.ง.ด.3',
      taxRate: '3',
    }
  )

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const { vatAmount, totalAmount: baseTotalAmount } = includeVat
    ? calculateVat(subtotal)
    : { vatAmount: 0, totalAmount: subtotal }

  const withholdingTaxAmount = docType === 'WT' 
    ? Math.round(subtotal * parseFloat(metadata.taxRate || '3')) / 100 
    : 0

  const totalAmount = baseTotalAmount

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = Math.round(Number(updated.quantity) * Number(updated.unitPrice) * 100) / 100
        }
        return updated
      })
    )
  }

  function addLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: generateLineId(), description: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, amount: 0 },
    ])
  }

  function removeLineItem(id: string) {
    if (lineItems.length <= 1) return
    setLineItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const today = Math.floor(Date.now() / 1000)
    const payload = {
      docType,
      date: initialData?.date || today,
      dueDate: dueDate ? Math.floor(new Date(dueDate).getTime() / 1000) : undefined,
      contactId: selectedContact?.id,
      contactSnapshot: selectedContact ? JSON.stringify({
        name: selectedContact.name,
        taxId: selectedContact.taxId,
        address: selectedContact.address,
        branch: selectedContact.branch,
        phone: selectedContact.phone,
        email: selectedContact.email,
      }) : undefined,
      lineItems,
      subtotal,
      vatAmount,
      totalAmount,
      withholdingTax: docType === 'WT' ? withholdingTaxAmount : undefined,
      notes,
      metadata,
    }

    if (initialData?.id) {
      await updateDocument(initialData.id, payload)
    } else {
      await createDocument(payload)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">ข้อมูลผู้ติดต่อ / คู่ค้า</h2>
        <ContactSearch
          contacts={contacts}
          onSelect={setSelectedContact}
          placeholder="ค้นหาลูกค้า หรือผู้ขาย..."
        />
        {selectedContact && (
          <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
            <div className="font-semibold text-gray-900">{selectedContact.name}</div>
            {selectedContact.taxId && <div className="text-gray-500">เลขภาษี: <span className="font-mono">{selectedContact.taxId}</span></div>}
            {selectedContact.address && <div className="text-gray-500">ที่อยู่: {selectedContact.address}</div>}
            {selectedContact.branch && <div className="text-gray-500">สาขา: {selectedContact.branch}</div>}
          </div>
        )}
      </div>

      {docType === 'EXP' && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">รายละเอียดค่าใช้จ่าย</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">หมวดหมู่ค่าใช้จ่าย</label>
              <select 
                className="form-input" 
                value={metadata.expenseCategory || ''} 
                onChange={e => setMetadata(prev => ({...prev, expenseCategory: e.target.value}))}
              >
                <option value="">เลือกหมวดหมู่...</option>
                <option value="ค่าเช่า">ค่าเช่า</option>
                <option value="ค่าขนส่ง">ค่าขนส่ง</option>
                <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค</option>
                <option value="ค่าวัตถุดิบ/สินค้า">ค่าวัตถุดิบ/สินค้า</option>
                <option value="เงินเดือน/ค่าจ้าง">เงินเดือน/ค่าจ้าง</option>
                <option value="ค่าใช้จ่ายเบ็ดเตล็ด">ค่าใช้จ่ายเบ็ดเตล็ด</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="form-label">ช่องทางการชำระเงิน</label>
              <select 
                className="form-input" 
                value={metadata.paymentMethod || ''} 
                onChange={e => setMetadata(prev => ({...prev, paymentMethod: e.target.value}))}
              >
                <option value="">เลือกช่องทางชำระเงิน...</option>
                <option value="เงินสด">เงินสด</option>
                <option value="โอนเงิน/PromptPay">โอนเงิน/PromptPay</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
                <option value="เช็ค">เช็ค</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {docType === 'WT' && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">รายละเอียดหัก ณ ที่จ่าย</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">แบบแสดงรายการภาษี</label>
              <select 
                className="form-input" 
                value={metadata.filingForm || 'ภ.ง.ด.3'} 
                onChange={e => setMetadata(prev => ({...prev, filingForm: e.target.value}))}
              >
                <option value="ภ.ง.ด.3">ภ.ง.ด.3 (บุคคลธรรมดา)</option>
                <option value="ภ.ง.ด.53">ภ.ง.ด.53 (นิติบุคคล)</option>
              </select>
            </div>
            <div>
              <label className="form-label">ประเภทเงินได้</label>
              <select 
                className="form-input" 
                value={metadata.incomeType || ''} 
                onChange={e => setMetadata(prev => ({...prev, incomeType: e.target.value}))}
              >
                <option value="">เลือกประเภทเงินได้...</option>
                <option value="ค่าบริการ">ค่าบริการ</option>
                <option value="ค่าโฆษณา">ค่าโฆษณา</option>
                <option value="ค่าจ้างทำของ">ค่าจ้างทำของ</option>
                <option value="ค่าเช่า">ค่าเช่า</option>
                <option value="ค่าขนส่ง">ค่าขนส่ง</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="form-label">อัตราภาษีหัก ณ ที่จ่าย (%)</label>
              <select 
                className="form-input" 
                value={metadata.taxRate || '3'} 
                onChange={e => setMetadata(prev => ({...prev, taxRate: e.target.value}))}
              >
                <option value="1">1% (ค่าขนส่ง)</option>
                <option value="2">2% (ค่าโฆษณา)</option>
                <option value="3">3% (ค่าบริการ, ค่าจ้างทำของ)</option>
                <option value="5">5% (ค่าเช่า, นักแสดง)</option>
                <option value="10">10% (เงินปันผล)</option>
                <option value="15">15%</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Dates */}
      {(docType === 'BL' || docType === 'QT') && (
        <div className="card p-5">
          <label className="form-label">วันครบกำหนด</label>
          <input
            id="due-date"
            type="date"
            className="form-input max-w-xs"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      )}

      {/* Line Items */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">รายการสินค้า / บริการ</h2>
          {VAT_TYPES[docType] && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                id="include-vat"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="rounded"
              />
              รวม VAT 7%
            </label>
          )}
        </div>

        <div className="line-items-table">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-[38%]">รายการ</th>
                <th className="w-[10%] text-center">จำนวน</th>
                <th className="w-[12%]">หน่วย</th>
                <th className="w-[18%] text-right">ราคา/หน่วย</th>
                <th className="w-[16%] text-right">จำนวนเงิน</th>
                <th className="w-[6%]"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="text"
                      className="form-input text-sm py-1.5"
                      placeholder="รายละเอียด..."
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-center text-sm py-1.5"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-input text-sm py-1.5"
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-input text-right text-sm py-1.5 font-mono"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="text-right font-mono text-sm font-semibold text-gray-900 px-3">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1"
                      disabled={lineItems.length <= 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          id="add-line-item"
          onClick={addLineItem}
          className="btn-ghost btn-sm text-blue-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          เพิ่มรายการ
        </button>

        {/* Totals */}
        <div className="ml-auto w-72 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">ยอดก่อนภาษี</span>
            <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
          </div>
          {includeVat && (
            <div className="flex justify-between text-gray-500">
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span className="font-mono">{formatCurrency(vatAmount)}</span>
            </div>
          )}
          {docType === 'WT' && (
            <div className="flex justify-between text-gray-500">
              <span>ภาษีหัก ณ ที่จ่าย ({metadata.taxRate}%)</span>
              <span className="font-mono text-red-600">-{formatCurrency(withholdingTaxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>ยอดรวมทั้งสิ้น</span>
            <span className="font-mono text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
          {totalAmount > 0 && (
            <div className="text-xs text-gray-400 text-right italic">
              ({amountInThaiWords(totalAmount)})
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="card p-5">
        <label className="form-label" htmlFor="notes">หมายเหตุ</label>
        <textarea
          id="notes"
          className="form-input h-20 resize-none"
          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <a href="/documents" className="btn-secondary">ยกเลิก</a>
        <button
          id="save-draft-btn"
          type="submit"
          disabled={isSubmitting || lineItems.some(i => !i.description)}
          className="btn-primary"
        >
          {isSubmitting ? (
            <><div className="spinner w-4 h-4" /> กำลังบันทึก...</>
          ) : 'บันทึกแบบร่าง'}
        </button>
      </div>
    </form>
  )
}
