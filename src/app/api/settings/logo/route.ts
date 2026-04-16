import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { tenants } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id

  const form = await request.formData()
  const file = form.get('file') as File
  if (!file) {
    return new NextResponse('No file provided', { status: 400 })
  }

  try {
    const blob = await put(`logos/${tenantId}-${file.name}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    // Update tenant logoUrl
    await db.update(tenants).set({
      logoUrl: blob.url,
      updatedAt: Math.floor(Date.now() / 1000)
    }).where(eq(tenants.id, tenantId))

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Logo upload error:', error)
    return new NextResponse('Upload failed', { status: 500 })
  }
}
