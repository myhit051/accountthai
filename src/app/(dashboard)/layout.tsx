import type { Metadata } from 'next'
import Sidebar from '@/components/layout/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { tenants } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'AccountThai',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  // Auto-heal missing tenant record for Google OAuth users
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, session.user.id),
  })
  
  if (!existingTenant) {
    await db.insert(tenants).values({
      id: session.user.id,
      name: session.user.name || 'บริษัทของฉัน',
      email: session.user.email,
    })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="main-content min-h-screen">
          <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
