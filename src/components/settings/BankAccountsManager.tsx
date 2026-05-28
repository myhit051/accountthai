'use client'

import { useEffect, useState, useTransition } from 'react'
import type { BankAccount } from '@/db/schema'
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
  listMyBankAccounts,
} from '@/actions/bank-accounts'

interface Props {
  initialAccounts?: BankAccount[]
}

interface FormState {
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
}

const EMPTY_FORM: FormState = {
  bankName: '',
  accountNumber: '',
  accountName: '',
  isDefault: false,
}

export default function BankAccountsManager({ initialAccounts }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts ?? [])
  const [loading, setLoading] = useState(!initialAccounts)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (initialAccounts) return
    let cancelled = false
    listMyBankAccounts()
      .then(data => { if (!cancelled) setAccounts(data) })
      .catch(() => { if (!cancelled) setError('โหลดบัญชีรับเงินไม่สำเร็จ') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [initialAccounts])

  function startAdd() {
    setEditingId(null)
    setAdding(true)
    setForm({ ...EMPTY_FORM, isDefault: accounts.length === 0 })
    setError('')
  }

  function startEdit(account: BankAccount) {
    setAdding(false)
    setEditingId(account.id)
    setForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName || '',
      isDefault: !!account.isDefault,
    })
    setError('')
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (!form.bankName.trim() || !form.accountNumber.trim()) {
      setError('กรุณากรอกชื่อธนาคารและเลขบัญชี')
      return
    }
    startTransition(async () => {
      try {
        if (editingId) {
          await updateBankAccount(editingId, form)
          setAccounts(prev => prev.map(a =>
            a.id === editingId
              ? { ...a, ...form, accountName: form.accountName || null }
              : form.isDefault ? { ...a, isDefault: false } : a
          ))
        } else {
          const { id } = await createBankAccount(form)
          const now = Math.floor(Date.now() / 1000)
          const newAccount: BankAccount = {
            id,
            tenantId: '',
            bankName: form.bankName.trim(),
            accountNumber: form.accountNumber.trim(),
            accountName: form.accountName.trim() || null,
            isDefault: form.isDefault || accounts.length === 0,
            sortOrder: accounts.length,
            deletedAt: null,
            createdAt: now,
            updatedAt: now,
          }
          setAccounts(prev => {
            const next = newAccount.isDefault
              ? prev.map(a => ({ ...a, isDefault: false }))
              : prev
            return [...next, newAccount]
          })
        }
        cancel()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      }
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบบัญชีนี้?')) return
    startTransition(async () => {
      try {
        await deleteBankAccount(id)
        setAccounts(prev => {
          const target = prev.find(a => a.id === id)
          const filtered = prev.filter(a => a.id !== id)
          if (target?.isDefault && filtered.length > 0 && !filtered.some(a => a.isDefault)) {
            return filtered.map((a, i) => i === 0 ? { ...a, isDefault: true } : a)
          }
          return filtered
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ลบบัญชีไม่สำเร็จ')
      }
    })
  }

  async function handleSetDefault(id: string) {
    startTransition(async () => {
      try {
        await setDefaultBankAccount(id)
        setAccounts(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ตั้งค่า default ไม่สำเร็จ')
      }
    })
  }

  const isFormOpen = adding || editingId !== null

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-gray-700">บัญชีรับเงิน</h2>
          <p className="text-xs text-gray-500 mt-1">เลือกได้ตอนออกเอกสาร และใช้แสดงใน PDF</p>
        </div>
        {!isFormOpen && (
          <button type="button" onClick={startAdd} className="btn-secondary btn-sm">
            + เพิ่มบัญชี
          </button>
        )}
      </div>

      {loading && (
        <div className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-6 text-center">
          กำลังโหลด...
        </div>
      )}

      {!loading && accounts.length === 0 && !isFormOpen && (
        <div className="text-sm text-gray-400 bg-gray-50 rounded-lg px-4 py-6 text-center">
          ยังไม่มีบัญชีรับเงิน — กด "+ เพิ่มบัญชี" เพื่อเริ่มต้น
        </div>
      )}

      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map(account => (
            <div
              key={account.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{account.bankName}</span>
                  {account.isDefault && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">default</span>
                  )}
                </div>
                <div className="text-gray-500 font-mono text-xs mt-0.5">
                  {account.accountNumber}
                  {account.accountName && <span className="ml-2 font-sans text-gray-400">— {account.accountName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!account.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(account.id)}
                    disabled={pending}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1"
                  >
                    ตั้ง default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(account)}
                  disabled={pending}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                >
                  แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(account.id)}
                  disabled={pending}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label" htmlFor="bank-name">ธนาคาร / ประเภทบัญชี *</label>
              <input
                id="bank-name"
                className="form-input"
                placeholder="เช่น กสิกรไทย ออมทรัพย์"
                value={form.bankName}
                onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="account-number">เลขที่บัญชี *</label>
              <input
                id="account-number"
                className="form-input font-mono"
                placeholder="0000000000"
                value={form.accountNumber}
                onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="account-name">ชื่อบัญชี (ไม่บังคับ)</label>
              <input
                id="account-name"
                className="form-input"
                placeholder="ชื่อเจ้าของบัญชี"
                value={form.accountName}
                onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="rounded"
              checked={form.isDefault}
              onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
            />
            ตั้งเป็นบัญชีเริ่มต้น
          </label>
          {error && <div className="text-sm text-red-500 bg-red-50 rounded px-3 py-2">{error}</div>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancel} className="btn-secondary btn-sm" disabled={pending}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary btn-sm" disabled={pending}>
              {pending ? 'กำลังบันทึก...' : editingId ? 'บันทึก' : 'เพิ่ม'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
