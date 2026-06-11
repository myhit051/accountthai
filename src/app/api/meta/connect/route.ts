import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { metaIntegrations } from '@/db/schema'
import { encryptToken } from '@/lib/utils'
import { fetchAdAccounts, MetaTokenError } from '@/lib/meta'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const [integration] = await db.select({
    adAccountId: metaIntegrations.adAccountId,
    adAccountName: metaIntegrations.adAccountName,
    connectedAt: metaIntegrations.connectedAt,
  }).from(metaIntegrations).where(eq(metaIntegrations.tenantId, session.user.id)).limit(1)

  return NextResponse.json({
    connected: !!integration,
    adAccountId: integration?.adAccountId || null,
    adAccountName: integration?.adAccountName || null,
  })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const { accessToken, adAccountId, adAccountName, currency } = await request.json()

  if (!accessToken || !adAccountId) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  // Re-validate the token before saving
  try {
    await fetchAdAccounts(accessToken.trim())
  } catch (error) {
    if (error instanceof MetaTokenError) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
    }
    console.error('Meta connect validation error:', error)
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 })
  }

  const encrypted = encryptToken(accessToken.trim())
  const now = Math.floor(Date.now() / 1000)

  const existing = await db.select({ tenantId: metaIntegrations.tenantId })
    .from(metaIntegrations).where(eq(metaIntegrations.tenantId, tenantId)).limit(1)

  if (existing.length === 0) {
    await db.insert(metaIntegrations).values({
      tenantId,
      accessToken: encrypted,
      adAccountId,
      adAccountName: adAccountName || null,
      currency: currency || null,
      connectedAt: now,
    })
  } else {
    await db.update(metaIntegrations).set({
      accessToken: encrypted,
      adAccountId,
      adAccountName: adAccountName || null,
      currency: currency || null,
      connectedAt: now,
    }).where(eq(metaIntegrations.tenantId, tenantId))
  }

  return NextResponse.json({ success: true })
}
