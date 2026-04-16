import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AccountThai — ระบบจัดการเอกสารบัญชีออนไลน์',
  description: 'สร้างใบกำกับภาษี ใบแจ้งหนี้ ใบเสร็จรับเงิน และอีกมากมาย พร้อม PDF export และ Google Drive Auto-backup',
  keywords: 'ใบกำกับภาษี, ใบแจ้งหนี้, ระบบบัญชี, บัญชีไทย, เอกสารบัญชี',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
