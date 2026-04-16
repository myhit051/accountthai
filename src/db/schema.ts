import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ─── Tenants (Organizations) ──────────────────────────────────────────────────
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  address: text('address'),
  branch: text('branch').default('สำนักงานใหญ่'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
})

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  tenantId: text('tenant_id').references(() => tenants.id),
  role: text('role').notNull().default('owner'), // owner | editor | viewer
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
})

// ─── Sessions (Better Auth) ───────────────────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at').notNull(),
  token: text('token').unique().notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id),
})

// ─── Accounts (Better Auth OAuth) ────────────────────────────────────────────
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at'),
  refreshTokenExpiresAt: integer('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

// ─── Verification Tokens (Better Auth) ───────────────────────────────────────
export const verifications = sqliteTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at'),
  updatedAt: integer('updated_at'),
})

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  address: text('address'),
  branch: text('branch'),
  phone: text('phone'),
  email: text('email'),
  type: text('type').notNull().default('customer'), // customer | vendor | both
  deletedAt: integer('deleted_at'),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
})

// ─── Document Running Number Sequences ────────────────────────────────────────
export const documentSequences = sqliteTable(
  'document_sequences',
  {
    tenantId: text('tenant_id').notNull().references(() => tenants.id),
    docType: text('doc_type').notNull(), // INV | EXP | WT | QT | BL | RE
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    lastNumber: integer('last_number').notNull().default(0),
  },
  (t) => ({
    pk: uniqueIndex('doc_seq_pk').on(t.tenantId, t.docType, t.year, t.month),
  })
)

// ─── Documents ────────────────────────────────────────────────────────────────
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  docType: text('doc_type').notNull(), // INV | EXP | WT | QT | BL | RE
  docNumber: text('doc_number').notNull(),
  status: text('status').notNull().default('draft'), // draft | issued | paid | void
  date: integer('date').notNull(),
  dueDate: integer('due_date'),
  contactId: text('contact_id').references(() => contacts.id),
  contactSnapshot: text('contact_snapshot'), // JSON — frozen at time of creation
  lineItems: text('line_items').notNull().default('[]'), // JSON array
  subtotal: real('subtotal').notNull().default(0),
  vatAmount: real('vat_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  withholdingTax: real('withholding_tax'),
  notes: text('notes'),
  metadata: text('metadata').default('{}'), // JSON for doc-type specific fields
  referenceNumber: text('reference_number'), // QT→BL→RE chain
  pdfUrl: text('pdf_url'),
  driveFileId: text('drive_file_id'),
  driveUrl: text('drive_url'),
  driveStatus: text('drive_status').default('none'), // none | pending | uploaded | failed
  voidReason: text('void_reason'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at').default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').default(sql`(unixepoch())`),
})

// ─── Google Drive Integration ────────────────────────────────────────────────
export const driveIntegrations = sqliteTable('drive_integrations', {
  tenantId: text('tenant_id').primaryKey().references(() => tenants.id),
  accessToken: text('access_token'), // encrypted
  refreshToken: text('refresh_token'), // encrypted
  tokenExpiry: integer('token_expiry'),
  rootFolderId: text('root_folder_id'),
  connectedAt: integer('connected_at').default(sql`(unixepoch())`),
})

// ─── Type exports ─────────────────────────────────────────────────────────────
export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
export type User = typeof users.$inferSelect
export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentSequence = typeof documentSequences.$inferSelect
export type DriveIntegration = typeof driveIntegrations.$inferSelect

export type DocType = 'INV' | 'EXP' | 'WT' | 'QT' | 'BL' | 'RE'
export type DocStatus = 'draft' | 'issued' | 'paid' | 'void'

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  INV: 'ใบกำกับภาษี',
  EXP: 'ใบบันทึกค่าใช้จ่าย',
  WT: 'ใบหัก ณ ที่จ่าย',
  QT: 'ใบเสนอราคา',
  BL: 'ใบแจ้งหนี้',
  RE: 'ใบเสร็จรับเงิน',
}

export const DOC_TYPE_PREFIXES: Record<DocType, string> = {
  INV: 'INV',
  EXP: 'EXP',
  WT: 'WT',
  QT: 'QT',
  BL: 'BL',
  RE: 'RE',
}
