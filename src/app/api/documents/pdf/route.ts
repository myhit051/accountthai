import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { auth } from '@/lib/auth'
import { generatePdfBuffer } from '@/lib/pdf'

export const runtime = 'nodejs'

// ดาวน์โหลดหลายเอกสารเป็นไฟล์ ZIP โดยแยก PDF รายการละ 1 ไฟล์: /api/documents/pdf?ids=a,b,c
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const idsParam = request.nextUrl.searchParams.get('ids') || ''
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean)

  if (ids.length === 0) return new NextResponse('No documents selected', { status: 400 })
  if (ids.length > 100) return new NextResponse('Too many documents', { status: 400 })

  const zip = new JSZip()
  const seen = new Set<string>()
  let added = 0

  for (const id of ids) {
    const result = await generatePdfBuffer(id, tenantId)
    if (!result) continue
    // กันชื่อไฟล์ซ้ำ (ปกติ docNumber ไม่ซ้ำอยู่แล้ว แต่กันไว้)
    let name = result.filename
    if (seen.has(name)) name = name.replace(/\.pdf$/i, '') + `-${added + 1}.pdf`
    seen.add(name)
    zip.file(name, result.pdf)
    added += 1
  }

  if (added === 0) return new NextResponse('Not found or PDF generation failed', { status: 404 })

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="documents-${added}.zip"`,
    },
  })
}
