import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateMultiPdfBuffer } from '@/lib/pdf'

export const runtime = 'nodejs'

// รวมหลายเอกสารเป็น PDF ไฟล์เดียว: /api/documents/pdf?ids=a,b,c
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const idsParam = request.nextUrl.searchParams.get('ids') || ''
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)

  if (ids.length === 0) return new NextResponse('No documents selected', { status: 400 })
  if (ids.length > 100) return new NextResponse('Too many documents', { status: 400 })

  const result = await generateMultiPdfBuffer(ids, tenantId)
  if (!result) return new NextResponse('Not found or PDF generation failed', { status: 404 })

  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'
  return new NextResponse(new Uint8Array(result.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    },
  })
}
