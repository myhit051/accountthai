import { db } from '@/db'
import { contacts } from '@/db/schema'
import { and, eq, isNull, like, or } from 'drizzle-orm'

export async function getContacts(tenantId: string, search?: string) {
  const conditions = [
    eq(contacts.tenantId, tenantId),
    isNull(contacts.deletedAt),
  ]

  const rows = await db
    .select()
    .from(contacts)
    .where(and(...conditions))
    .orderBy(contacts.name)

  if (search) {
    const q = search.toLowerCase()
    return rows.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.taxId && c.taxId.includes(q))
    )
  }
  return rows
}

export async function getContactById(id: string, tenantId: string) {
  const rows = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
    .limit(1)
  return rows[0] ?? null
}
