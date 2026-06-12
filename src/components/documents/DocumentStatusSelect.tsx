'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateDocumentStatus } from '@/actions/documents'
import {
  DOC_STATUS_OPTIONS,
  DOC_STATUS_SELECT_CLASS,
  statusLabel,
  normalizeStatus,
} from '@/lib/doc-status'
import type { DocStatus } from '@/db/schema'
import { useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  docId: string
  status: string
  docType?: string
}

export default function DocumentStatusSelect({ docId, status, docType }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [selectedStatus, setSelectedStatus] = useState<DocStatus>(normalizeStatus(status))
  const [pendingVoid, setPendingVoid] = useState(false)
  const [isPending, startTransition] = useTransition()

  function applyStatus(nextStatus: DocStatus) {
    const previousStatus = selectedStatus
    setSelectedStatus(nextStatus)
    startTransition(async () => {
      try {
        await updateDocumentStatus(docId, nextStatus)
        router.refresh()
        toast.success(`เปลี่ยนสถานะเป็น "${statusLabel(nextStatus, docType)}" แล้ว`)
      } catch {
        setSelectedStatus(previousStatus)
        toast.error('เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่')
      }
    })
  }

  function handleChange(nextStatus: DocStatus) {
    if (nextStatus === selectedStatus) return
    if (nextStatus === 'void') {
      setPendingVoid(true)
      return
    }
    applyStatus(nextStatus)
  }

  return (
    <>
      <select
        aria-label="เปลี่ยนสถานะเอกสาร"
        className={`min-w-[136px] rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-colors ${DOC_STATUS_SELECT_CLASS[selectedStatus]} ${isPending ? 'opacity-60' : ''}`}
        disabled={isPending}
        value={selectedStatus}
        onChange={(event) => handleChange(event.target.value as DocStatus)}
      >
        {DOC_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>{statusLabel(option, docType)}</option>
        ))}
      </select>

      <ConfirmDialog
        open={pendingVoid}
        danger
        title="ยืนยันยกเลิกเอกสาร"
        message="เปลี่ยนสถานะเอกสารนี้เป็น “ยกเลิก” ใช่หรือไม่?"
        confirmLabel="ยกเลิกเอกสาร"
        cancelLabel="ปิด"
        loading={isPending}
        onConfirm={() => {
          setPendingVoid(false)
          applyStatus('void')
        }}
        onCancel={() => setPendingVoid(false)}
      />
    </>
  )
}
