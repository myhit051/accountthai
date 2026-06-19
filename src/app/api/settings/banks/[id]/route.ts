import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { bankAccounts } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const { id } = await params
  const data = await request.json()
  const bankName = (data.bankName || '').trim()
  const accountNumber = (data.accountNumber || '').trim()
  if (!bankName || !accountNumber) {
    return NextResponse.json({ error: 'กรุณากรอกธนาคารและเลขที่บัญชี' }, { status: 400 })
  }

  const isDefault = Boolean(data.isDefault)
  if (isDefault) {
    await db.update(bankAccounts).set({ isDefault: false }).where(eq(bankAccounts.tenantId, tenantId))
  }

  await db.update(bankAccounts).set({
    bankName,
    accountName: (data.accountName || '').trim() || null,
    accountNumber,
    isDefault,
    updatedAt: Math.floor(Date.now() / 1000),
  }).where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const tenantId = session.user.id
  const { id } = await params

  await db.update(bankAccounts).set({
    deletedAt: Math.floor(Date.now() / 1000),
  }).where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)))

  return NextResponse.json({ success: true })
}
