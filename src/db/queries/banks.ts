import { db } from '@/db'
import { bankAccounts } from '@/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'

export async function getBankAccounts(tenantId: string) {
  return db
    .select()
    .from(bankAccounts)
    .where(and(eq(bankAccounts.tenantId, tenantId), isNull(bankAccounts.deletedAt)))
    .orderBy(desc(bankAccounts.isDefault), bankAccounts.bankName)
}
