import { db } from '@/db'
import { documents, contacts } from '@/db/schema'
import { and, eq, gte, lte, count, sum, desc } from 'drizzle-orm'

export async function getDashboardStats(tenantId: string, year: number, month: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)
  const startTs = Math.floor(startOfMonth.getTime() / 1000)
  const endTs = Math.floor(endOfMonth.getTime() / 1000)

  const docs = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        eq(documents.isDeleted, false),
        gte(documents.date, startTs),
        lte(documents.date, endTs)
      )
    )

  const income = docs
    .filter(d => ['INV', 'RE'].includes(d.docType) && d.status !== 'void')
    .reduce((sum, d) => sum + d.totalAmount, 0)

  const expense = docs
    .filter(d => d.docType === 'EXP' && d.status !== 'void')
    .reduce((sum, d) => sum + d.totalAmount, 0)

  const vat = docs
    .filter(d => ['INV'].includes(d.docType) && d.status !== 'void')
    .reduce((sum, d) => sum + d.vatAmount, 0)

  const docCount = docs.filter(d => d.status !== 'void').length

  // By type counts
  const byType: Record<string, number> = {}
  docs.filter(d => d.status !== 'void').forEach(d => {
    byType[d.docType] = (byType[d.docType] || 0) + 1
  })

  // Outstanding (BL unpaid = issued status)
  const outstanding = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.tenantId, tenantId),
        eq(documents.docType, 'BL'),
        eq(documents.status, 'issued'),
        eq(documents.isDeleted, false)
      )
    )

  return {
    income,
    expense,
    vat,
    docCount,
    byType,
    outstanding: outstanding.slice(0, 5),
  }
}

export async function getRecentDocuments(tenantId: string, limit = 5) {
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.tenantId, tenantId), eq(documents.isDeleted, false)))
    .orderBy(desc(documents.updatedAt))
    .limit(limit)
}

export async function getContactCount(tenantId: string) {
  const result = await db
    .select({ count: count() })
    .from(contacts)
    .where(and(eq(contacts.tenantId, tenantId)))
  return result[0]?.count ?? 0
}
