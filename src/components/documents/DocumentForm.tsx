'use client'

import { useState } from 'react'
import { Contact, DocType, DOC_TYPE_LABELS } from '@/db/schema'
import ContactSearch from './ContactSearch'
import { createDocument, updateDocument, LineItem } from '@/actions/documents'
import { formatCurrency, amountInThaiWords, calculateInclusiveVat } from '@/lib/utils'

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

const PAYMENT_DOC_TYPES: DocType[] = ['INV', 'BL', 'RE']
const VAT_SUPPORTED_DOC_TYPES: DocType[] = ['INV', 'QT', 'BL', 'RE', 'EXP']
const DISCOUNT_RATE_DOC_TYPES: DocType[] = ['INV', 'QT', 'BL', 'RE']
const EXPENSE_CATEGORIES = [
  'ซื้อสินค้าไว้ขาย',
  'ค่าขนส่งสินค้า/ลอจิสติกส์',
  'ค่าเช่า',
  'ค่าสาธารณูปโภค',
  'ค่าโฆษณา',
  'ค่าบริการ',
  'ค่าใช้จ่ายเบ็ดเตล็ด',
  'อื่นๆ',
]

function todayInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultMetadata(docType: DocType): Record<string, string> {
  return {
    filingForm: 'ภ.ง.ด.3',
    taxRate: '3',
    withholdingTaxRate: '3',
    withholdingTaxEnabled: 'false',
    paymentMethod: docType === 'EXP' ? 'บัตรเครดิต' : PAYMENT_DOC_TYPES.includes(docType) ? 'โอนเงิน' : '',
    paymentDate: todayInputValue(),
    certificateDate: todayInputValue(),
    payerTaxCondition: 'หัก ณ ที่จ่าย',
    incomeCategoryCode: '5',
    discountRate: '0',
    discountAmount: '0',
    withholdingTaxAmount: '0',
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function parseMoney(value?: string) {
  const parsed = parseFloat(value || '0')
  return Number.isFinite(parsed) ? parsed : 0
}

function createLineItem(docType: DocType, category = ''): LineItem {
  return {
    id: generateLineId(),
    description: '',
    category: docType === 'EXP' ? category : undefined,
    quantity: 1,
    unit: docType === 'EXP' ? '' : 'ชิ้น',
    unitPrice: 0,
    taxRate: docType === 'WT' ? 3 : undefined,
    amount: 0,
  }
}

export default function DocumentForm({ contacts, docType, initialData }: Props) {
  const initialMetadata = initialData?.metadata
    ? { ...getDefaultMetadata(docType), ...JSON.parse(initialData.metadata) }
    : getDefaultMetadata(docType)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(
    initialData?.contactId ? contacts.find(c => c.id === initialData.contactId) || null : null
  )
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate * 1000).toISOString().split('T')[0] : '')
  const [includeVat, setIncludeVat] = useState(initialData ? initialMetadata.priceIncludesVat === 'true' : VAT_TYPES[docType])
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems ? JSON.parse(initialData.lineItems) : [
    createLineItem(docType),
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, string>>(
    initialMetadata
  )

  const lineItemsTotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0))
  const discountRate = DISCOUNT_RATE_DOC_TYPES.includes(docType) ? Math.min(Math.max(parseMoney(metadata.discountRate), 0), 100) : 0
  const salesDiscountAmount = roundMoney(lineItemsTotal * discountRate / 100)
  const expenseDiscountAmount = docType === 'EXP' ? Math.min(roundMoney(parseMoney(metadata.discountAmount)), lineItemsTotal) : 0
  const discountAmount = DISCOUNT_RATE_DOC_TYPES.includes(docType) ? salesDiscountAmount : expenseDiscountAmount
  const totalAfterDiscount = Math.max(lineItemsTotal - discountAmount, 0)
  const {
    subtotal,
    vatAmount,
    totalAmount: baseTotalAmount,
  } = includeVat
    ? calculateInclusiveVat(totalAfterDiscount)
    : { subtotal: totalAfterDiscount, vatAmount: 0, totalAmount: totalAfterDiscount }

  const invoiceWithholdingEnabled = PAYMENT_DOC_TYPES.includes(docType) && metadata.withholdingTaxEnabled === 'true'
  const expenseWithholdingTaxAmount = docType === 'EXP' ? roundMoney(parseMoney(metadata.withholdingTaxAmount)) : 0
  const withholdingTaxRate = docType === 'WT'
    ? parseFloat(metadata.taxRate || '3')
    : parseFloat(metadata.withholdingTaxRate || '3')
  const shouldCalculateWithholdingTax = docType === 'WT' || invoiceWithholdingEnabled || expenseWithholdingTaxAmount > 0
  const withholdingTaxAmount = docType === 'EXP'
    ? expenseWithholdingTaxAmount
    : docType === 'WT'
    ? roundMoney(lineItems.reduce((sum, item) => sum + item.amount * (item.taxRate ?? withholdingTaxRate) / 100, 0))
    : shouldCalculateWithholdingTax
    ? roundMoney(subtotal * withholdingTaxRate / 100)
    : 0

  const totalAmount = baseTotalAmount
  const netPayable = Math.max(totalAmount - withholdingTaxAmount, 0)

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
      createLineItem(docType, metadata.expenseCategory || ''),
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
    const payloadMetadata = {
      ...metadata,
      priceIncludesVat: includeVat ? 'true' : 'false',
    }
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
      withholdingTax: shouldCalculateWithholdingTax ? withholdingTaxAmount : 0,
      notes,
      metadata: payloadMetadata,
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
              <label className="form-label">หมวดหมู่ค่าใช้จ่ายเริ่มต้น</label>
              <select 
                className="form-input" 
                value={metadata.expenseCategory || ''} 
                onChange={e => setMetadata(prev => ({...prev, expenseCategory: e.target.value}))}
              >
                <option value="">เลือกหมวดหมู่...</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">ผู้จัดทำ</label>
              <input
                type="text"
                className="form-input"
                value={metadata.preparerName || ''}
                onChange={e => setMetadata(prev => ({ ...prev, preparerName: e.target.value }))}
                placeholder="ชื่อผู้จัดทำเอกสาร"
              />
            </div>
            <div>
              <label className="form-label">ส่วนลด</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input text-right font-mono"
                value={metadata.discountAmount || '0'}
                onChange={e => setMetadata(prev => ({ ...prev, discountAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">หัก ณ ที่จ่าย</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input text-right font-mono"
                value={metadata.withholdingTaxAmount || '0'}
                onChange={e => setMetadata(prev => ({ ...prev, withholdingTaxAmount: e.target.value }))}
              />
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
                <option value="เช็ค">เช็ค</option>
                <option value="โอนเงิน">โอนเงิน</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
              </select>
            </div>
            <div>
              <label className="form-label">วันที่ชำระ</label>
              <input
                type="date"
                className="form-input"
                value={metadata.paymentDate || todayInputValue()}
                onChange={e => setMetadata(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ธนาคาร</label>
              <input
                type="text"
                className="form-input"
                value={metadata.bankName || ''}
                onChange={e => setMetadata(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="เช่น กสิกรไทย"
              />
            </div>
            <div>
              <label className="form-label">เลขที่ / เลขบัญชี / บัตร</label>
              <input
                type="text"
                className="form-input font-mono"
                value={metadata.bankAccount || ''}
                onChange={e => setMetadata(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="เช่น ****-****-****-7722"
              />
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
              <label className="form-label">ลำดับในแบบ</label>
              <input
                type="text"
                className="form-input"
                value={metadata.sequenceNumber || ''}
                onChange={e => setMetadata(prev => ({ ...prev, sequenceNumber: e.target.value }))}
                placeholder="ถ้ามี"
              />
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
              <label className="form-label">หมวดเงินได้ในหนังสือรับรอง</label>
              <select
                className="form-input"
                value={metadata.incomeCategoryCode || '5'}
                onChange={e => setMetadata(prev => ({ ...prev, incomeCategoryCode: e.target.value }))}
              >
                <option value="1">1. เงินเดือน ค่าจ้าง โบนัส</option>
                <option value="2">2. ค่าธรรมเนียม ค่านายหน้า</option>
                <option value="3">3. ค่าแห่งลิขสิทธิ์</option>
                <option value="4">4. ดอกเบี้ย / เงินปันผล</option>
                <option value="5">5. ค่าบริการ ค่าโฆษณา ค่าเช่า ค่าขนส่ง</option>
                <option value="6">6. อื่นๆ</option>
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
            <div>
              <label className="form-label">วันที่จ่ายเงิน</label>
              <input
                type="date"
                className="form-input"
                value={metadata.paymentDate || todayInputValue()}
                onChange={e => setMetadata(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">วันที่ออกหนังสือรับรอง</label>
              <input
                type="date"
                className="form-input"
                value={metadata.certificateDate || todayInputValue()}
                onChange={e => setMetadata(prev => ({ ...prev, certificateDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ผู้ที่จ่ายเงิน</label>
              <select
                className="form-input"
                value={metadata.payerTaxCondition || 'หัก ณ ที่จ่าย'}
                onChange={e => setMetadata(prev => ({ ...prev, payerTaxCondition: e.target.value }))}
              >
                <option value="หัก ณ ที่จ่าย">หัก ณ ที่จ่าย</option>
                <option value="ออกให้ตลอดไป">ออกให้ตลอดไป</option>
                <option value="ออกให้ครั้งเดียว">ออกให้ครั้งเดียว</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="form-label">เล่มที่</label>
              <input
                type="text"
                className="form-input"
                value={metadata.certificateBookNo || ''}
                onChange={e => setMetadata(prev => ({ ...prev, certificateBookNo: e.target.value }))}
                placeholder="ถ้ามี"
              />
            </div>
          </div>
        </div>
      )}

      {PAYMENT_DOC_TYPES.includes(docType) && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">รายละเอียดการชำระเงิน</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">ผู้ขาย</label>
              <input
                type="text"
                className="form-input"
                value={metadata.sellerName || ''}
                onChange={e => setMetadata(prev => ({ ...prev, sellerName: e.target.value }))}
                placeholder="ชื่อผู้ขาย / ผู้รับผิดชอบ"
              />
            </div>
            <div>
              <label className="form-label">ช่องทางการชำระเงิน</label>
              <select
                className="form-input"
                value={metadata.paymentMethod || 'โอนเงิน'}
                onChange={e => setMetadata(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="เงินสด">เงินสด</option>
                <option value="เช็ค">เช็ค</option>
                <option value="โอนเงิน">โอนเงิน</option>
                <option value="บัตรเครดิต">บัตรเครดิต</option>
              </select>
            </div>
            <div>
              <label className="form-label">ธนาคาร / ประเภทบัญชี</label>
              <input
                type="text"
                className="form-input"
                value={metadata.bankName || ''}
                onChange={e => setMetadata(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="เช่น กสิกรไทย ออมทรัพย์"
              />
            </div>
            <div>
              <label className="form-label">เลขที่บัญชี / เลขเช็ค</label>
              <input
                type="text"
                className="form-input font-mono"
                value={metadata.bankAccount || ''}
                onChange={e => setMetadata(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="0000000000"
              />
            </div>
            <div>
              <label className="form-label">วันที่รับชำระ</label>
              <input
                type="date"
                className="form-input"
                value={metadata.paymentDate || todayInputValue()}
                onChange={e => setMetadata(prev => ({ ...prev, paymentDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">ภาษีหัก ณ ที่จ่าย</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={invoiceWithholdingEnabled}
                    onChange={e => setMetadata(prev => ({ ...prev, withholdingTaxEnabled: e.target.checked ? 'true' : 'false' }))}
                  />
                  หัก ณ ที่จ่าย
                </label>
                <select
                  className="form-input"
                  value={metadata.withholdingTaxRate || '3'}
                  onChange={e => setMetadata(prev => ({ ...prev, withholdingTaxRate: e.target.value }))}
                  disabled={!invoiceWithholdingEnabled}
                >
                  <option value="1">1%</option>
                  <option value="2">2%</option>
                  <option value="3">3%</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dates */}
      {(docType === 'BL' || docType === 'QT') && (
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {docType === 'QT' ? 'เงื่อนไขใบเสนอราคา' : 'เงื่อนไขการชำระเงิน'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="due-date">
                {docType === 'QT' ? 'ใช้ได้ถึง' : 'วันครบกำหนด'}
              </label>
              <input
                id="due-date"
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="payment-terms">
                {docType === 'QT' ? 'เงื่อนไข / หมายเหตุ' : 'เงื่อนไขการชำระเงิน'}
              </label>
              <input
                id="payment-terms"
                type="text"
                className="form-input"
                value={metadata.paymentTerms || ''}
                onChange={(e) => setMetadata(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder={docType === 'QT' ? 'เช่น ราคานี้ยืนได้ 15 วัน' : 'เช่น ชำระภายใน 30 วัน'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">รายการสินค้า / บริการ</h2>
          {VAT_SUPPORTED_DOC_TYPES.includes(docType) && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                id="include-vat"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="rounded"
              />
              ราคาที่กรอกรวม VAT 7%
            </label>
          )}
        </div>

        <div className="line-items-table">
          <table className="w-full">
            <thead>
              <tr>
                <th className={docType === 'EXP' ? 'w-[28%]' : 'w-[38%]'}>รายการ</th>
                {docType === 'EXP' && <th className="w-[20%]">หมวดหมู่</th>}
                <th className={docType === 'EXP' || docType === 'WT' ? 'w-[9%] text-center' : 'w-[10%] text-center'}>จำนวน</th>
                <th className={docType === 'EXP' || docType === 'WT' ? 'w-[10%]' : 'w-[12%]'}>หน่วย</th>
                <th className={docType === 'EXP' || docType === 'WT' ? 'w-[16%] text-right' : 'w-[18%] text-right'}>ราคา/หน่วย</th>
                {docType === 'WT' && <th className="w-[10%] text-center">ภาษี %</th>}
                <th className={docType === 'EXP' || docType === 'WT' ? 'w-[13%] text-right' : 'w-[16%] text-right'}>จำนวนเงิน</th>
                <th className={docType === 'EXP' ? 'w-[4%]' : 'w-[6%]'}></th>
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
                  {docType === 'EXP' && (
                    <td>
                      <select
                        className="form-input text-sm py-1.5"
                        value={item.category || metadata.expenseCategory || ''}
                        onChange={(e) => updateLineItem(item.id, 'category', e.target.value)}
                      >
                        <option value="">เลือก...</option>
                        {EXPENSE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </td>
                  )}
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
                  {docType === 'WT' && (
                    <td>
                      <input
                        type="number"
                        className="form-input text-center text-sm py-1.5 font-mono"
                        min="0"
                        step="0.01"
                        value={item.taxRate ?? withholdingTaxRate}
                        onChange={(e) => updateLineItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  )}
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
            <span className="text-gray-500">รวมเป็นเงิน</span>
            <span className="font-mono font-medium">{formatCurrency(lineItemsTotal)}</span>
          </div>
          {DISCOUNT_RATE_DOC_TYPES.includes(docType) && (
            <div className="flex items-center justify-between gap-3 text-gray-500">
              <label htmlFor="discount-rate">ส่วนลด</label>
              <div className="flex items-center gap-2">
                <input
                  id="discount-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className="form-input w-20 py-1 text-right font-mono"
                  value={metadata.discountRate || '0'}
                  onChange={e => setMetadata(prev => ({ ...prev, discountRate: e.target.value }))}
                />
                <span>%</span>
                <span className="font-mono text-red-600 w-24 text-right">-{formatCurrency(discountAmount)}</span>
              </div>
            </div>
          )}
          {(DISCOUNT_RATE_DOC_TYPES.includes(docType) || (docType === 'EXP' && discountAmount > 0)) && (
            <>
              {docType === 'EXP' && discountAmount > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>ส่วนลด</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>ราคาหลังหักส่วนลด</span>
                <span className="font-mono">{formatCurrency(totalAfterDiscount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2">
            <span>จำนวนเงินรวมทั้งสิ้น</span>
            <span className="font-mono text-blue-600">{formatCurrency(totalAmount)}</span>
          </div>
          {includeVat && (
            <div className="space-y-2 border-t border-gray-200 pt-2">
              <div className="flex justify-between text-gray-500">
                <span>ภาษีมูลค่าเพิ่ม 7%</span>
                <span className="font-mono">{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>ราคาไม่รวมภาษีมูลค่าเพิ่ม</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}
          {shouldCalculateWithholdingTax && (
            <div className="flex justify-between text-gray-500 border-t border-gray-200 pt-2">
              <span>{docType === 'EXP' ? 'หัก ณ ที่จ่าย' : `ภาษีหัก ณ ที่จ่าย (${withholdingTaxRate}%)`}</span>
              <span className="font-mono text-red-600">-{formatCurrency(withholdingTaxAmount)}</span>
            </div>
          )}
          {shouldCalculateWithholdingTax && (
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>ยอดชำระ</span>
              <span className="font-mono text-green-600">{formatCurrency(netPayable)}</span>
            </div>
          )}
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
