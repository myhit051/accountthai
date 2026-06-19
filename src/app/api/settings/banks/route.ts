import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { bankAccounts } from '@/db/schema'
import { getBankAccounts } from '@/db/queries/banks'
import { eq } from 'drizzle-orm'

function genId() {
  return 'bank_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6)
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const accounts = await getBankAccounts(session.user.id)
  return NextResponse.json({ accounts })
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const data = await request.json()
  const bankName = (data.bankName || '').trim()
  const accountNumber = (data.accountNumber || '').trim()
  if (!bankName || !accountNumber) {
    return NextResponse.json({ error: 'กรุณากรอกธนาคารและเลขที่บัญชี' }, { status: 400 })
  }

  const now = Math.floor(Date.now() / 1000)
  const isDefault = Boolean(data.isDefault)

  // มีได้ค่าเริ่มต้นเดียว — ถ้าตั้งอันนี้เป็นค่าเริ่มต้น ให้ปลดอันอื่น
  if (isDefault) {
    await db.update(bankAccounts).set({ isDefault: false }).where(eq(bankAccounts.tenantId, tenantId))
  }

  await db.insert(bankAccounts).values({
    id: genId(),
    tenantId,
    bankName,
    accountName: (data.accountName || '').trim() || null,
    accountNumber,
    isDefault,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ success: true })
}
