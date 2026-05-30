import { db } from '@/db'
import { products } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

export async function getProducts(tenantId: string, search?: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .orderBy(products.name)

  if (search) {
    const q = search.toLowerCase()
    return rows.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.code && p.code.toLowerCase().includes(q))
    )
  }
  return rows
}

export async function getProductById(id: string, tenantId: string) {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .limit(1)
  return rows[0] ?? null
}
