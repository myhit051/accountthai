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
  const kindValue = String(form.get('kind') || 'logo')
  const kind = ['logo', 'signature', 'stamp'].includes(kindValue) ? kindValue : 'logo'
  if (!file) {
    return new NextResponse('No file provided', { status: 400 })
  }

  try {
    const url = await uploadCompanyAsset(tenantId, kind, file)

    const assetColumn = kind === 'signature'
      ? { signatureUrl: url }
      : kind === 'stamp'
      ? { stampUrl: url }
      : { logoUrl: url }

    await db.update(tenants).set({
      ...assetColumn,
      updatedAt: Math.floor(Date.now() / 1000)
    }).where(eq(tenants.id, tenantId))

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Logo upload error:', error)
    return new NextResponse('Upload failed', { status: 500 })
  }
}

async function uploadCompanyAsset(tenantId: string, kind: string, file: File) {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const hasBlobToken = token && token !== 'your-vercel-blob-token'

  if (hasBlobToken) {
    try {
      const blob = await put(`company-assets/${kind}/${tenantId}-${file.name}`, file, {
        access: 'public',
        addRandomSuffix: true,
      })
      return blob.url
    } catch (error) {
      console.error('Vercel Blob upload failed, falling back to database asset:', error)
    }
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image file is larger than 2MB')
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const mime = file.type || 'image/png'
  return `data:${mime};base64,${bytes.toString('base64')}`
}
