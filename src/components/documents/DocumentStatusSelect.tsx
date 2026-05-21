'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { updateDocumentStatus, type DocumentStatus } from '@/actions/documents'

interface Props {
  docId: string
  status: string
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'ร่าง',
  issued: 'รอดำเนินการ',
  paid: 'เก็บเงินแล้ว',
  void: 'ยกเลิก',
}

const STATUS_CLASSES: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  issued: 'bg-blue-50 text-blue-700 border-blue-100',
  paid: 'bg-green-50 text-green-700 border-green-100',
  void: 'bg-red-50 text-red-700 border-red-100',
}

const STATUS_OPTIONS: DocumentStatus[] = ['draft', 'issued', 'paid', 'void']

function normalizeStatus(status: string): DocumentStatus {
  return STATUS_OPTIONS.includes(status as DocumentStatus) ? status as DocumentStatus : 'draft'
}

export default function DocumentStatusSelect({ docId, status }: Props) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus>(normalizeStatus(status))
  const [isPending, startTransition] = useTransition()

  function handleChange(nextStatus: DocumentStatus) {
    if (nextStatus === selectedStatus) return
    if (nextStatus === 'void' && !window.confirm('ยืนยันเปลี่ยนสถานะเอกสารเป็นยกเลิก?')) return

    const previousStatus = selectedStatus
    setSelectedStatus(nextStatus)
    startTransition(async () => {
      try {
        await updateDocumentStatus(docId, nextStatus)
        router.refresh()
      } catch {
        setSelectedStatus(previousStatus)
        window.alert('เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่')
      }
    })
  }

  return (
    <select
      aria-label="เปลี่ยนสถานะเอกสาร"
      className={`min-w-[136px] rounded-lg border px-3 py-1.5 text-sm font-medium outline-none transition-colors ${STATUS_CLASSES[selectedStatus]} ${isPending ? 'opacity-60' : ''}`}
      disabled={isPending}
      value={selectedStatus}
      onChange={(event) => handleChange(event.target.value as DocumentStatus)}
    >
      {STATUS_OPTIONS.map(option => (
        <option key={option} value={option}>{STATUS_LABELS[option]}</option>
      ))}
    </select>
  )
}
