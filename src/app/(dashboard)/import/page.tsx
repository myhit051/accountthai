'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { createDocument } from '@/actions/documents'
import { DocType } from '@/db/schema'

type RowData = Record<string, string | number>

const FIELD_MAPPINGS = [
  { key: 'description', label: 'รายการ / คำอธิบาย', required: true },
  { key: 'quantity', label: 'จำนวน', required: false },
  { key: 'unit', label: 'หน่วย', required: false },
  { key: 'unitPrice', label: 'ราคา/หน่วย', required: true },
  { key: 'contactName', label: 'ชื่อผู้ติดต่อ', required: false },
  { key: 'contactTaxId', label: 'เลขผู้เสียภาษี', required: false },
  { key: 'date', label: 'วันที่', required: false },
]

export default function ImportPage() {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload')
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<RowData[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importType, setImportType] = useState<DocType>('INV')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState({ success: 0, error: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<RowData>(ws, { defval: '' })

      if (json.length === 0) return
      const cols = Object.keys(json[0])
      setColumns(cols)
      setRows(json)
      setStep('map')
    }
    reader.readAsArrayBuffer(file)
  }

  function validatePreview() {
    const errs: string[] = []
    rows.forEach((row, i) => {
      const desc = mapping.description ? String(row[mapping.description] || '') : ''
      const price = mapping.unitPrice ? Number(row[mapping.unitPrice] || 0) : 0
      if (!desc) errs.push(`แถวที่ ${i + 1}: ไม่มีรายการ`)
      if (isNaN(price) || price < 0) errs.push(`แถวที่ ${i + 1}: ราคาไม่ถูกต้อง`)
    })
    setErrors(errs)
    setStep('preview')
  }

  async function handleImport() {
    setImporting(true)
    let success = 0
    let errorCount = 0

    for (const row of rows) {
      try {
        const desc = mapping.description ? String(row[mapping.description] || '') : 'นำเข้าจาก Excel'
        const qty = mapping.quantity ? Number(row[mapping.quantity] || 1) : 1
        const unit = mapping.unit ? String(row[mapping.unit] || 'ชิ้น') : 'ชิ้น'
        const price = mapping.unitPrice ? Number(row[mapping.unitPrice] || 0) : 0
        const amount = qty * price
        const subtotal = amount
        const vatAmount = importType === 'INV' ? Math.round(subtotal * 0.07 * 100) / 100 : 0
        const totalAmount = subtotal + vatAmount

        const contactName = mapping.contactName ? String(row[mapping.contactName] || '') : ''
        const contactTaxId = mapping.contactTaxId ? String(row[mapping.contactTaxId] || '') : ''

        await createDocument({
          docType: importType,
          date: Math.floor(Date.now() / 1000),
          lineItems: [{ id: 'imported', description: desc, quantity: qty, unit, unitPrice: price, amount }],
          subtotal,
          vatAmount,
          totalAmount,
          contactSnapshot: contactName ? JSON.stringify({ name: contactName, taxId: contactTaxId }) : undefined,
        })
        success++
      } catch {
        errorCount++
      }
    }

    setResult({ success, error: errorCount })
    setImporting(false)
    setStep('done')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">นำเข้าข้อมูล</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {['upload', 'map', 'preview', 'done'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s ? 'bg-blue-600 text-white' :
              ['upload', 'map', 'preview', 'done'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className={step === s ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              {['อัปโหลดไฟล์', 'จับคู่คอลัมน์', 'ตรวจสอบ', 'เสร็จสิ้น'][i]}
            </span>
            {i < 3 && <span className="text-gray-200">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="card p-6 space-y-4">
          <div className="mb-4">
            <label className="form-label">ประเภทเอกสารที่ต้องการนำเข้า</label>
            <select id="import-doc-type" className="form-input max-w-xs"
              value={importType} onChange={e => setImportType(e.target.value as DocType)}>
              {['INV', 'EXP', 'QT', 'BL', 'RE'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-300 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-3xl mb-3">📂</div>
            <div className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</div>
            <div className="text-xs text-gray-400 mt-1">รองรับ .xlsx และ .csv</div>
          </div>
          <input
            ref={fileRef}
            id="import-file-input"
            type="file"
            accept=".xlsx,.csv,.xls"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'map' && (
        <div className="card p-6 space-y-4">
          <div className="text-sm text-gray-500">พบ {rows.length} แถว | {columns.length} คอลัมน์</div>
          <div className="space-y-3">
            {FIELD_MAPPINGS.map(field => (
              <div key={field.key} className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 w-36 flex-shrink-0">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <select
                  className="form-input flex-1"
                  value={mapping[field.key] || ''}
                  onChange={e => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                >
                  <option value="">— ไม่จับคู่ —</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep('upload')} className="btn-secondary">กลับ</button>
            <button id="next-mapping-btn" onClick={validatePreview} className="btn-primary">ตรวจสอบ →</button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && (
        <div className="card p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <div className="text-sm font-semibold text-red-600">พบปัญหา {errors.length} รายการ</div>
              {errors.slice(0, 5).map((e, i) => (
                <div key={i} className="text-xs text-red-500">{e}</div>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600">
            จะนำเข้า: <span className="font-semibold text-green-600">{rows.length - errors.length} รายการ</span>
            {errors.length > 0 && <span className="text-red-500 ml-2">ข้าม: {errors.length} รายการ</span>}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-64">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  {Object.values(mapping).filter(Boolean).map(col => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(mapping).filter(Boolean).map(col => (
                      <td key={col}>{String(row[col] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep('map')} className="btn-secondary">กลับ</button>
            <button
              id="confirm-import-btn"
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="btn-primary"
            >
              {importing ? <><div className="spinner w-4 h-4" /> กำลังนำเข้า...</> : `นำเข้า ${rows.length} รายการ`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="card p-8 text-center space-y-4">
          <div className="text-4xl">🎉</div>
          <div className="text-xl font-bold text-gray-900">นำเข้าเสร็จสมบูรณ์!</div>
          <div className="space-y-1 text-sm">
            <div className="text-green-600">✓ นำเข้าสำเร็จ {result.success} รายการ</div>
            {result.error > 0 && <div className="text-red-500">✕ ข้ามไป {result.error} รายการ</div>}
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <a href="/documents" className="btn-primary">ดูเอกสาร →</a>
            <button onClick={() => { setStep('upload'); setRows([]); setColumns([]) }} className="btn-secondary">นำเข้าใหม่</button>
          </div>
        </div>
      )}
    </div>
  )
}
