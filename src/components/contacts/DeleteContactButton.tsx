'use client'

import { useState, useTransition } from 'react'
import { deleteContact } from '@/actions/contacts'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

export default function DeleteContactButton({ id, name }: { id: string, name: string }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteContact(id)
        setOpen(false)
        toast.success(`ลบ "${name}" แล้ว`)
      } catch {
        setOpen(false)
        toast.error('ลบผู้ติดต่อไม่สำเร็จ')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
        onClick={() => setOpen(true)}
      >
        {isPending ? 'กำลังลบ...' : 'ลบ'}
      </button>
      <ConfirmDialog
        open={open}
        danger
        title="ลบผู้ติดต่อ"
        message={`ลบ "${name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
