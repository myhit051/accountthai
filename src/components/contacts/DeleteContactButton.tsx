'use client'

import { useTransition } from 'react'
import { deleteContact } from '@/actions/contacts'

export default function DeleteContactButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <button 
      type="button"
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
      onClick={() => { 
        if (confirm(`ลบ "${name}" ใช่หรือไม่?`)) {
          startTransition(async () => {
            await deleteContact(id)
          })
        }
      }}
    >
      {isPending ? "กำลังลบ..." : "ลบ"}
    </button>
  )
}
