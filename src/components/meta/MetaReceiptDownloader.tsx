'use client'

import { useState } from 'react'

interface Receipt {
  transactionId: string
  url: string
}

export default function MetaReceiptDownloader({ receipts }: { receipts: Receipt[] }) {
  const [message, setMessage] = useState('')

  function openReceipts() {
    if (receipts.length === 0) return

    let opened = 0
    for (const receipt of receipts) {
      const tab = window.open(receipt.url, '_blank', 'noopener,noreferrer')
      if (tab) opened++
    }

    setMessage(opened === receipts.length
      ? `เปิดใบเสร็จ ${opened} รายการแล้ว ดาวน์โหลด PDF จากหน้า Meta ได้เลย`
      : `เปิดได้ ${opened} จาก ${receipts.length} รายการ กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้แล้วกดอีกครั้ง`)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={openReceipts}
        disabled={receipts.length === 0}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        เปิดใบเสร็จทั้งหมด ({receipts.length})
      </button>
      {message && <span className="text-xs text-gray-500">{message}</span>}
    </div>
  )
}
