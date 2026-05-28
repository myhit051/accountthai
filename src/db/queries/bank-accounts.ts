import { db } from '@/db'
import { bankAccounts } from '@/db/schema'
import { and, asc, eq, isNull } from 'drizzle-orm'

export async function getBankAccounts(tenantId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
    .orderBy(asc(bankAccounts.sortOrder), asc(bankAccounts.createdAt))
}

export async function getDefaultBankAccount(tenantId: string) {
  const accounts = await getBankAccounts(tenantId)
  return accounts.find(a => a.isDefault) ?? accounts[0] ?? null
}

export async function getBankAccountById(id: string, tenantId: string) {
  const rows = await db
    .select()
    .from(bankAccounts)
    .where(and(
      eq(bankAccounts.id, id),
      eq(bankAccounts.tenantId, tenantId),
      isNull(bankAccounts.deletedAt),
    ))
    .limit(1)
  return rows[0] ?? null
}
