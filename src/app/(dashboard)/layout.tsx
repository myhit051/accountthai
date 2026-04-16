import type { Metadata } from 'next'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'AccountThai',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="main-content min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
