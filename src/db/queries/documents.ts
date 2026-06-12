import { db, client } from '@/db'
import { documents, contacts } from '@/db/schema'
import { and, eq, like, gte, lte, desc, asc, count, or } from 'drizzle-orm'
import { DocStatus, DocType } from '@/db/schema'

export interface DocumentFilters {
  tenantId: string
  docType?: DocType
  status?: DocStatus
  search?: string
  dateFrom?: number
  dateTo?: number
  sortBy?: 'date' | 'amount' | 'docNumber'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function getDocuments(filters: DocumentFilters) {
  const {
    tenantId, docType, status, search,
    dateFrom, dateTo,
    sortBy = 'date', sortOrder = 'desc',
    page = 1, pageSize = 20,
  } = filters

  const conditions = [
    eq(documents.tenantId, tenantId),
    eq(documents.isDeleted, false),
  ]

  if (docType) conditions.push(eq(documents.docType, docType))
  if (status) conditions.push(eq(documents.status, status))
  if (dateFrom) conditions.push(gte(documents.date, dateFrom))
  if (dateTo) conditions.push(lte(documents.date, dateTo))

  // Note: full-text search via docNumber for simplicity (Turso doesn't have FTS in free tier)
  // In production, add SQLite FTS5 virtual table
  const whereClause = and(...conditions)

  const orderCol = sortBy === 'amount' ? documents.totalAmount
    : sortBy === 'docNumber' ? documents.docNumber
    : documents.date

  const offset = (page - 1) * pageSize

  const [rows, totalCount] = await Promise.all([
    db.select().from(documents)
      .where(whereClause)
      .orderBy(sortOrder === 'asc' ? asc(orderCol) : desc(orderCol))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(documents).where(whereClause),
  ])

  return {
    documents: rows,
    total: totalCount[0]?.count ?? 0,
    pages: Math.ceil((totalCount[0]?.count ?? 0) / pageSize),
    page,
    pageSize,
  }
}

export async function getDocumentById(id: string, tenantId: string) {
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
    .limit(1)
  return rows[0] ?? null
}

export async function getNextDocNumber(tenantId: string, docType: DocType, issueDate?: Date): Promise<string> {
  // ออกเลขตาม "เดือนที่ออกเอกสาร" (issueDate) ไม่ใช่วันที่สร้างในระบบ
  // เช่น หัก ณ ที่จ่ายที่ออกย้อนหลังให้เดือนที่จ่ายจริง ต้องได้เลขเดือนนั้น
  const ref = issueDate && !Number.isNaN(issueDate.getTime()) ? issueDate : new Date()
  const year = ref.getFullYear()
  const month = ref.getMonth() + 1
  const prefix = docType

  // Atomic increment + อ่านค่าในคำสั่งเดียว (RETURNING) ลด round-trip ไป Turso จาก 2 เหลือ 1
  const result = await client.execute({
    sql: `INSERT INTO document_sequences (tenant_id, doc_type, year, month, last_number)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT (tenant_id, doc_type, year, month)
     DO UPDATE SET last_number = last_number + 1
     RETURNING last_number`,
    args: [tenantId, docType, year, month],
  })

  const lastNumber = (result.rows[0]?.last_number as number) ?? 1
  const mm = String(month).padStart(2, '0')
  const nn = String(lastNumber).padStart(4, '0')
  return `${prefix}${year}${mm}${nn}`
}
