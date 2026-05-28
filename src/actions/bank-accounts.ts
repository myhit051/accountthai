'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { bankAccounts } from '@/db/schema'
import { and, eq, isNull, ne } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { getBankAccounts } from '@/db/queries/bank-accounts'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function listMyBankAccounts() {
  const session = await getSession()
  return getBankAccounts(session.user.id)
}

export interface BankAccountInput {
  bankName: string
  accountNumber: string
  accountName?: string
  isDefault?: boolean
}

export async function createBankAccount(data: BankAccountInput) {
  const session = await getSession()
  const tenantId = session.user.id
  const bankName = data.bankName.trim()
  const accountNumber = data.accountNumber.trim()
  if (!bankName || !accountNumber) throw new Error('กรุณากรอกข้อมูลธนาคารและเลขบัญชี')

  const id = generateId()
  const now = Math.floor(Date.now() / 1000)
  const existing = await db.select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
  const isFirst = existing.length === 0
  const isDefault = isFirst || data.isDefault === true

  if (isDefault) {
    await db.update(bankAccounts)
      .set({ isDefault: false, updatedAt: now })
      .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
  }

  await db.insert(bankAccounts).values({
    id,
    tenantId,
    bankName,
    accountNumber,
    accountName: data.accountName?.trim() || null,
    isDefault,
    sortOrder: existing.length,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/settings/company')
  return { id }
}

export async function updateBankAccount(id: string, data: BankAccountInput) {
  const session = await getSession()
  const tenantId = session.user.id
  const bankName = data.bankName.trim()
  const accountNumber = data.accountNumber.trim()
  if (!bankName || !accountNumber) throw new Error('กรุณากรอกข้อมูลธนาคารและเลขบัญชี')

  const now = Math.floor(Date.now() / 1000)
  if (data.isDefault) {
    await db.update(bankAccounts)
      .set({ isDefault: false, updatedAt: now })
      .where(and(
        eq(bankAccounts.tenantId, tenantId),
        isNull(bankAccounts.deletedAt),
        ne(bankAccounts.id, id),
      ))
  }

  await db.update(bankAccounts)
    .set({
      bankName,
      accountNumber,
      accountName: data.accountName?.trim() || null,
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      updatedAt: now,
    })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)))

  revalidatePath('/settings/company')
}

export async function deleteBankAccount(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  const [target] = await db.select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
    .limit(1)
  if (!target) throw new Error('ไม่พบบัญชีที่ต้องการลบ')

  await db.update(bankAccounts)
    .set({ deletedAt: now, isDefault: false, updatedAt: now })
    .where(eq(bankAccounts.id, id))

  if (target.isDefault) {
    const [next] = await db.select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
      .limit(1)
    if (next) {
      await db.update(bankAccounts)
        .set({ isDefault: true, updatedAt: now })
        .where(eq(bankAccounts.id, next.id))
    }
  }

  revalidatePath('/settings/company')
}

export async function setDefaultBankAccount(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(bankAccounts)
    .set({ isDefault: false, updatedAt: now })
    .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))

  await db.update(bankAccounts)
    .set({ isDefault: true, updatedAt: now })
    .where(and(eq(bankAccounts.id, id), eq(bankAccounts.tenantId, tenantId)))

  revalidatePath('/settings/company')
}
