'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { contacts } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { generateId } from '@/lib/utils'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export interface ContactData {
  name: string
  taxId?: string
  address?: string
  branch?: string
  phone?: string
  email?: string
  type: 'customer' | 'vendor' | 'both'
}

export async function createContact(data: ContactData) {
  const session = await getSession()
  const tenantId = session.user.id

  const id = generateId()
  const now = Math.floor(Date.now() / 1000)

  await db.insert(contacts).values({
    id,
    tenantId,
    name: data.name,
    taxId: data.taxId,
    address: data.address,
    branch: data.branch,
    phone: data.phone,
    email: data.email,
    type: data.type,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/contacts')
  return { success: true, id }
}

export async function updateContact(id: string, data: Partial<ContactData>) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(contacts)
    .set({ ...data, updatedAt: now })
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))

  revalidatePath('/contacts')
  return { success: true }
}

export async function deleteContact(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  // Soft delete
  await db.update(contacts)
    .set({ deletedAt: now })
    .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))

  revalidatePath('/contacts')
  return { success: true }
}
