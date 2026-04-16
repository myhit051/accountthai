import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import { formatCurrency, formatDateThai } from '@/lib/utils'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const tenantId = session.user.id
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

  const startTs = Math.floor(new Date(year, month - 1, 1).getTime() / 1000)
  const endTs = Math.floor(new Date(year, month, 0, 23, 59, 59).getTime() / 1000)

  const docs = await db.select().from(documents).where(
    and(
      eq(documents.tenantId, tenantId),
      eq(documents.isDeleted, false),
      gte(documents.date, startTs),
      lte(documents.date, endTs)
    )
  )

  const rows = docs.map(doc => {
    const contact = doc.contactSnapshot ? JSON.parse(doc.contactSnapshot) : null
    return {
      'เลขที่เอกสาร': doc.docNumber,
      'ประเภท': doc.docType,
      'ผู้ติดต่อ': contact?.name || '',
      'เลขผู้เสียภาษี': contact?.taxId || '',
      'วันที่': formatDateThai(doc.date),
      'ยอดก่อนภาษี': doc.subtotal,
      'VAT': doc.vatAmount,
      'ยอดรวม': doc.totalAmount,
      'สถานะ': doc.status,
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, `รายงาน ${month}-${year}`)

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = `รายงาน_${year}_${String(month).padStart(2, '0')}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}
