import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generatePdfBuffer } from '@/lib/pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  
  const result = await generatePdfBuffer(params.id, tenantId)
  
  if (!result) {
    return new NextResponse('Not found or PDF generation failed', { status: 404 })
  }

  if (result.isHtml) {
    return new NextResponse(result.pdf, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  return new NextResponse(result.pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    },
  })
}
