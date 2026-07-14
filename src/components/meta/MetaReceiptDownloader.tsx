'use client'

import { useState } from 'react'

interface Receipt {
  transactionId: string
  url: string
}

export default function MetaReceiptDownloader({ receipts }: { receipts: Receipt[] }) {
  const [message, setMessage] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function downloadReceipts() {
    if (receipts.length === 0 || downloading) return

    setDownloading(true)
    setMessage('กำลังส่งคำขอดาวน์โหลด กรุณาอนุญาตการดาวน์โหลดหลายไฟล์หากเบราว์เซอร์ถาม')

    const frames: HTMLIFrameElement[] = []
    for (const [index, receipt] of receipts.entries()) {
      const frame = document.createElement('iframe')
      frame.hidden = true
      frame.title = `ดาวน์โหลดใบเสร็จ ${receipt.transactionId}`
      document.body.appendChild(frame)
      frames.push(frame)
      frame.src = receipt.url

      if (index < receipts.length - 1) {
        await new Promise(resolve => window.setTimeout(resolve, 800))
      }
    }

    window.setTimeout(() => frames.forEach(frame => frame.remove()), 30_000)
    setMessage(`ส่งคำขอดาวน์โหลด ${receipts.length} รายการแล้ว หากไม่มีไฟล์ กรุณาตรวจว่าล็อกอิน Facebook และอนุญาตการดาวน์โหลดหลายไฟล์`)
    setDownloading(false)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={downloadReceipts}
        disabled={receipts.length === 0 || downloading}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? 'กำลังดาวน์โหลด…' : `ดาวน์โหลดใบเสร็จทั้งหมด (${receipts.length})`}
      </button>
      {message && <span className="text-xs text-gray-500">{message}</span>}
    </div>
  )
}
