'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { products } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@/lib/utils'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export interface ProductData {
  code?: string
  name: string
  description?: string
  type: 'product' | 'service'
  unit?: string
  unitPrice: number
  cost?: number
  vatType: 'vat' | 'none'
  category?: string
}

export async function createProduct(data: ProductData) {
  const session = await getSession()
  const tenantId = session.user.id

  const id = generateId()
  const now = Math.floor(Date.now() / 1000)

  const values = {
    id,
    tenantId,
    code: data.code,
    name: data.name,
    description: data.description,
    type: data.type,
    unit: data.unit || 'ชิ้น',
    unitPrice: data.unitPrice,
    cost: data.cost,
    vatType: data.vatType,
    category: data.category,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(products).values(values)

  revalidatePath('/products')
  // คืน object สินค้าที่สร้าง เพื่อให้ฟอร์มเอกสารนำไปเลือกต่อได้ทันที
  return { success: true, id, product: { ...values, deletedAt: null } }
}

export async function updateProduct(id: string, data: Partial<ProductData>) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(products)
    .set({ ...data, updatedAt: now })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))

  revalidatePath('/products')
  revalidatePath(`/products/${id}/edit`)
  return { success: true }
}

export async function deleteProduct(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  // Soft delete
  await db.update(products)
    .set({ deletedAt: now })
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))

  revalidatePath('/products')
  return { success: true }
}
