'use client'

import { ReactNode } from 'react'
import { deleteDocument } from '@/actions/documents'

export default function DeleteDocumentButton({ docId, docNumber, className, children }: {
  docId: string
  docNumber: string
  className?: string
  children?: ReactNode
}) {
  return (
    <form
      action={deleteDocument.bind(null, docId)}
      onSubmit={(event) => {
        if (!confirm(`ลบเอกสารร่าง ${docNumber} ใช่หรือไม่?`)) {
          event.preventDefault()
        }
      }}
    >
      <button type="submit" className={className || 'btn-danger btn-sm'}>
        {children || 'ลบ'}
      </button>
    </form>
  )
}
