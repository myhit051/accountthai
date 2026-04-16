import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadDocumentToDrive } from '@/lib/drive'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getPdfFilename } from '@/lib/utils'
import { tenants } from '@/db/schema'

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docId = formData.get('docId') as string

    if (!file || !docId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const [doc] = await db.select().from(documents)
      .where(and(eq(documents.id, docId), eq(documents.tenantId, tenantId)))
      .limit(1)

    if (!doc) {
      return new NextResponse('Document not found', { status: 404 })
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)

    const contact = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
    const partnerName = contact?.name || 'noname'
    const filename = getPdfFilename(tenant?.name || 'company', doc.docNumber, partnerName)

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await uploadDocumentToDrive(tenantId, doc.id, doc.docNumber, doc.docType, buffer, filename)

    if (!result) {
      return new NextResponse('Drive upload failed', { status: 500 })
    }

    return NextResponse.json({ success: true, url: result.webViewLink })
  } catch (error) {
    console.error('Upload blob error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
