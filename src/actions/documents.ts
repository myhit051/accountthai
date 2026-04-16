'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { documents, documentSequences } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { generateId } from '@/lib/utils'
import { getNextDocNumber } from '@/db/queries/documents'
import { DocType } from '@/db/schema'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

export interface CreateDocumentData {
  docType: DocType
  date: number
  dueDate?: number
  contactId?: string
  contactSnapshot?: string
  lineItems: LineItem[]
  subtotal: number
  vatAmount: number
  totalAmount: number
  withholdingTax?: number
  notes?: string
  metadata?: Record<string, unknown>
  referenceNumber?: string
}

export async function createDocument(data: CreateDocumentData) {
  const session = await getSession()
  const tenantId = session.user.id

  const docNumber = await getNextDocNumber(tenantId, data.docType)
  const id = generateId()
  const now = Math.floor(Date.now() / 1000)

  await db.insert(documents).values({
    id,
    tenantId,
    docType: data.docType,
    docNumber,
    status: 'draft',
    date: data.date,
    dueDate: data.dueDate,
    contactId: data.contactId,
    contactSnapshot: data.contactSnapshot,
    lineItems: JSON.stringify(data.lineItems),
    subtotal: data.subtotal,
    vatAmount: data.vatAmount,
    totalAmount: data.totalAmount,
    withholdingTax: data.withholdingTax,
    notes: data.notes,
    metadata: JSON.stringify(data.metadata || {}),
    referenceNumber: data.referenceNumber,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/documents')
  revalidatePath('/')
  redirect(`/documents/${id}`)
}

export async function updateDocument(id: string, data: Partial<CreateDocumentData>) {
  const session = await getSession()
  const tenantId = session.user.id

  const now = Math.floor(Date.now() / 1000)
  await db.update(documents)
    .set({
      ...(data.date && { date: data.date }),
      ...(data.dueDate && { dueDate: data.dueDate }),
      ...(data.contactId && { contactId: data.contactId }),
      ...(data.contactSnapshot && { contactSnapshot: data.contactSnapshot }),
      ...(data.lineItems && { lineItems: JSON.stringify(data.lineItems) }),
      ...(data.subtotal !== undefined && { subtotal: data.subtotal }),
      ...(data.vatAmount !== undefined && { vatAmount: data.vatAmount }),
      ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
      ...(data.withholdingTax !== undefined && { withholdingTax: data.withholdingTax }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
      updatedAt: now,
    })
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId), eq(documents.status, 'draft')))

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')
}

export async function issueDocument(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(documents)
    .set({ status: 'issued', updatedAt: now })
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId), eq(documents.status, 'draft')))

  const [doc] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.tenantId, tenantId))).limit(1)
  
  if (doc) {
    // Non-blocking background PDF generation and Drive upload
    Promise.resolve().then(async () => {
      const { generatePdfBuffer } = await import('@/lib/pdf')
      const { uploadDocumentToDrive } = await import('@/lib/drive')
      
      const result = await generatePdfBuffer(id, tenantId)
      if (result && !result.isHtml) {
        await uploadDocumentToDrive(tenantId, id, doc.docNumber, doc.docType, result.pdf as Buffer, result.filename)
      }
    }).catch(console.error)
  }

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')
  revalidatePath('/')
}

export async function markDocumentPaid(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(documents)
    .set({ status: 'paid', updatedAt: now })
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId), eq(documents.status, 'issued')))

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')
  revalidatePath('/')
}

export async function voidDocument(id: string, reason: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(documents)
    .set({ status: 'void', voidReason: reason, updatedAt: now })
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))

  revalidatePath(`/documents/${id}`)
  revalidatePath('/documents')
  revalidatePath('/')
}

export async function deleteDocument(id: string) {
  const session = await getSession()
  const tenantId = session.user.id
  const now = Math.floor(Date.now() / 1000)

  await db.update(documents)
    .set({ isDeleted: true, updatedAt: now })
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))

  revalidatePath('/documents')
  revalidatePath('/')
  redirect('/documents')
}

export async function duplicateDocument(id: string) {
  const session = await getSession()
  const tenantId = session.user.id

  const [original] = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
    .limit(1)

  if (!original) throw new Error('Document not found')

  const docNumber = await getNextDocNumber(tenantId, original.docType as DocType)
  const newId = generateId()
  const now = Math.floor(Date.now() / 1000)
  const today = Math.floor(Date.now() / 1000)

  await db.insert(documents).values({
    ...original,
    id: newId,
    docNumber,
    date: today,
    status: 'draft',
    driveFileId: null,
    driveUrl: null,
    driveStatus: 'none',
    voidReason: null,
    pdfUrl: null,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/documents')
  redirect(`/documents/${newId}`)
}

export async function convertDocument(id: string, targetType: DocType) {
  const session = await getSession()
  const tenantId = session.user.id

  const [original] = await db.select().from(documents)
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
    .limit(1)

  if (!original) throw new Error('Document not found')

  const docNumber = await getNextDocNumber(tenantId, targetType)
  const newId = generateId()
  const now = Math.floor(Date.now() / 1000)

  await db.insert(documents).values({
    ...original,
    id: newId,
    docType: targetType,
    docNumber,
    status: 'draft',
    referenceNumber: original.docNumber,
    driveFileId: null,
    driveUrl: null,
    driveStatus: 'none',
    pdfUrl: null,
    voidReason: null,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/documents')
  redirect(`/documents/${newId}`)
}
