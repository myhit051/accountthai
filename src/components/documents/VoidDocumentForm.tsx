'use client'

import { useRef } from 'react'
import { voidDocumentFromForm } from '@/actions/documents'

interface Props {
  docId: string
}

export default function VoidDocumentForm({ docId }: Props) {
  const reasonRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const reason = window.prompt('กรุณาระบุเหตุผลการยกเลิก')
    if (!reason?.trim()) {
      event.preventDefault()
      return
    }

    if (reasonRef.current) {
      reasonRef.current.value = reason.trim()
    }
  }

  return (
    <form action={voidDocumentFromForm.bind(null, docId)} onSubmit={handleSubmit}>
      <input ref={reasonRef} type="hidden" name="reason" />
      <button type="submit" id="void-btn" className="btn-danger btn-sm">
        ยกเลิก
      </button>
    </form>
  )
}
