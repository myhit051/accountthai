import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { driveIntegrations } from '@/db/schema'
import { encryptToken } from '@/lib/utils'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return NextResponse.redirect('/login')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return new NextResponse('Missing code', { status: 400 })

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return new NextResponse('Token exchange failed', { status: 400 })
  }

  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  // Store encrypted tokens
  await db.insert(driveIntegrations).values({
    tenantId,
    accessToken: encryptToken(tokenData.access_token),
    refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
    tokenExpiry: tokenData.expires_in ? now + tokenData.expires_in : null,
    connectedAt: now,
  }).onConflictDoUpdate({
    target: driveIntegrations.tenantId,
    set: {
      accessToken: encryptToken(tokenData.access_token),
      refreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
      tokenExpiry: tokenData.expires_in ? now + tokenData.expires_in : null,
    },
  })

  return NextResponse.redirect(new URL('/settings', request.url))
}
