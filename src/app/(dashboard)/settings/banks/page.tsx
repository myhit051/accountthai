'use client'

import { useState, useEffect } from 'react'

interface BankAccount {
  id: string
  bankName: string
  accountName: string | null
  accountNumber: string
  isDefault: boolean
}

const EMPTY = { bankName: '', accountName: '', accountNumber: '', isDefault: false }

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null) // null = ไม่ได้แก้, 'new' = เพิ่มใหม่
  const [form, setForm] = useState(EMPTY)

  async function load() {
    try {
      const res = await fetch('/api/settings/banks')
      if (!res.ok) throw new Error()
      const { accounts } = await res.json()
      setAccounts(accounts)
    } catch {
      setError('โหลดข้อมูลบัญชีไม่สำเร็จ')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { load() }, [])

  function startAdd() {
    setForm({ ...EMPTY, isDefault: accounts.length === 0 })
    setEditingId('new')
    setError('')
  }

  function startEdit(acc: BankAccount) {
    setForm({
      bankName: acc.bankName,
      accountName: acc.accountName || '',
      accountNumber: acc.accountNumber,
      isDefault: acc.isDefault,
    })
    setEditingId(acc.id)
    setError('')
  }

  function cancel() {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
  }

  async function save() {
    if (!form.bankName.trim() || !form.accountNumber.trim()) {
      setError('กรุณากรอกธนาคารและเลขที่บัญชี')
      return
    }
    setSaving(true)
    setError('')
    try {
      const isNew = editingId === 'new'
      const res = await fetch(isNew ? '/api/settings/banks' : `/api/settings/banks/${editingId}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      cancel()
      await load()
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  async function remove(acc: BankAccount) {
    if (!confirm(`ลบบัญชี "${acc.bankName} ${acc.accountNumber}" ?`)) return
    try {
      const res = await fetch(`/api/settings/banks/${acc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await load()
    } catch {
      setError('ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/settings" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </a>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">บัญชีธนาคาร</h1>
          <p className="text-gray-500 text-sm mt-0.5">ตั้งค่าไว้ครั้งเดียว แล้วเลือกจาก dropdown ตอนออกเอกสารได้เลย</p>
        </div>
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="card p-6 space-y-3">
        {fetching ? (
          <div className="text-center text-gray-400 py-6">Loading...</div>
        ) : accounts.length === 0 && editingId !== 'new' ? (
          <div className="text-center py-6">
            <div className="text-gray-400 text-sm mb-3">ยังไม่มีบัญชีธนาคาร</div>
            <button onClick={startAdd} className="btn-primary btn-sm">เพิ่มบัญชีแรก</button>
          </div>
        ) : (
          <>
            {accounts.map(acc => (
              editingId === acc.id ? (
                <BankForm key={acc.id} form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
              ) : (
                <div key={acc.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{acc.bankName}</span>
                      {acc.isDefault && <span className="badge badge-issued text-xs">ค่าเริ่มต้น</span>}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">{acc.accountNumber}</div>
                    {acc.accountName && <div className="text-xs text-gray-400">{acc.accountName}</div>}
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button onClick={() => startEdit(acc)} className="text-xs text-gray-400 hover:text-blue-600">แก้ไข</button>
                    <button onClick={() => remove(acc)} className="text-xs text-gray-400 hover:text-red-500">ลบ</button>
                  </div>
                </div>
              )
            ))}

            {editingId === 'new' ? (
              <BankForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
            ) : (
              <button onClick={startAdd} className="btn-secondary btn-sm w-full justify-center">+ เพิ่มบัญชีธนาคาร</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function BankForm({ form, setForm, onSave, onCancel, saving }: {
  form: typeof EMPTY
  setForm: (f: typeof EMPTY) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="form-label">ธนาคาร / ประเภทบัญชี *</label>
          <input className="form-input" value={form.bankName} placeholder="เช่น กสิกรไทย ออมทรัพย์"
            onChange={e => setForm({ ...form, bankName: e.target.value })} />
        </div>
        <div>
          <label className="form-label">เลขที่บัญชี *</label>
          <input className="form-input font-mono" value={form.accountNumber} placeholder="0000000000"
            onChange={e => setForm({ ...form, accountNumber: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="form-label">ชื่อบัญชี (ถ้ามี)</label>
          <input className="form-input" value={form.accountName} placeholder="เช่น บริษัท ตัวอย่าง จำกัด"
            onChange={e => setForm({ ...form, accountName: e.target.value })} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={form.isDefault}
          onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
        ตั้งเป็นบัญชีเริ่มต้น (เติมให้อัตโนมัติตอนสร้างเอกสารใหม่)
      </label>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary btn-sm" disabled={saving}>ยกเลิก</button>
        <button onClick={onSave} className="btn-primary btn-sm" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}
