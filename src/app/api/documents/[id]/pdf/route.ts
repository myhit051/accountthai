import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generatePdfBuffer } from '@/lib/pdf'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const { id } = await params
  
  const result = await generatePdfBuffer(id, tenantId)
  
  if (!result) {
    return new NextResponse('Not found or PDF generation failed', { status: 404 })
  }

  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'
  return new NextResponse(new Uint8Array(result.pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
    },
  })
}
