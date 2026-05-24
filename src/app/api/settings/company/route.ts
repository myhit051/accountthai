import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { tenants } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const [tenant] = await db.select().from(tenants)
    .where(eq(tenants.id, tenantId)).limit(1)

  return NextResponse.json({ tenant: tenant || null })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const data = await request.json()
  const now = Math.floor(Date.now() / 1000)

  // Upsert tenant
  const existing = await db.select({ id: tenants.id }).from(tenants)
    .where(eq(tenants.id, tenantId)).limit(1)

  if (existing.length === 0) {
    await db.insert(tenants).values({
      id: tenantId,
      name: data.name,
      taxId: data.taxId,
      address: data.address,
          branch: data.branch || 'สำนักงานใหญ่',
          phone: data.phone,
          email: data.email,
          logoUrl: data.logoUrl,
          signatureUrl: data.signatureUrl,
          stampUrl: data.stampUrl,
          createdAt: now,
          updatedAt: now,
        })
  } else {
    await db.update(tenants).set({
      name: data.name,
      taxId: data.taxId,
      address: data.address,
      branch: data.branch,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logoUrl,
      signatureUrl: data.signatureUrl,
      stampUrl: data.stampUrl,
      updatedAt: now,
    }).where(eq(tenants.id, tenantId))
  }

  return NextResponse.json({ success: true })
}
