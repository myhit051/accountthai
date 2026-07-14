'use client'

import { useState } from 'react'

interface Receipt {
  transactionId: string
  url: string
}

export default function MetaReceiptDownloader({ receipts }: { receipts: Receipt[] }) {
  const [message, setMessage] = useState('')
  const [blockedReceipts, setBlockedReceipts] = useState<Receipt[]>([])

  function openReceipts() {
    if (receipts.length === 0) return

    let opened = 0
    const blocked: Receipt[] = []
    for (const receipt of receipts) {
      const tab = window.open('about:blank', '_blank')
      if (tab) {
        tab.opener = null
        tab.location.replace(receipt.url)
        window.setTimeout(() => {
          if (!tab.closed) tab.close()
        }, 15_000)
        opened++
      } else {
        blocked.push(receipt)
      }
    }

    setBlockedReceipts(blocked)
    setMessage(opened === receipts.length
      ? `เปิดใบเสร็จ ${opened} รายการแล้ว แท็บจะปิดอัตโนมัติภายใน 15 วินาที`
      : `เบราว์เซอร์เปิดได้ ${opened} จาก ${receipts.length} รายการ กดรายการที่เหลือด้านล่างหรืออนุญาตป๊อปอัปแล้วลองใหม่`)
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
      {blockedReceipts.length > 0 && (
        <div className="basis-full flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-amber-600">รายการที่ถูกบล็อก:</span>
          {blockedReceipts.map((receipt, index) => (
            <a
              key={receipt.transactionId}
              href={receipt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary btn-sm"
            >
              ใบเสร็จ {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
