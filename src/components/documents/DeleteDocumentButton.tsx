'use client'

import { ReactNode, useState, useTransition } from 'react'
import { deleteDocument } from '@/actions/documents'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'

export default function DeleteDocumentButton({ docId, docNumber, className, children }: {
  docId: string
  docNumber: string
  className?: string
  children?: ReactNode
}) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteDocument(docId)
        // deleteDocument redirects on success — code below runs only on error
      } catch (err) {
        // redirect() throws a special error we must rethrow
        if (err && typeof err === 'object' && 'digest' in err && String((err as { digest?: string }).digest).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setOpen(false)
        toast.error('ลบเอกสารไม่สำเร็จ')
      }
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className || 'btn-danger btn-sm'}>
        {children || 'ลบ'}
      </button>
      <ConfirmDialog
        open={open}
        danger
        title="ลบเอกสารร่าง"
        message={`ลบเอกสารร่าง ${docNumber} ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบ"
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}
