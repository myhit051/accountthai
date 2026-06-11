import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { metaIntegrations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  await db.delete(metaIntegrations).where(eq(metaIntegrations.tenantId, session.user.id))

  return NextResponse.json({ success: true })
}

// Used by the plain <a> button on the settings page
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  await db.delete(metaIntegrations).where(eq(metaIntegrations.tenantId, session.user.id))

  return NextResponse.redirect(new URL('/settings', request.url))
}
