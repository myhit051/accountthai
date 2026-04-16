import { db } from '@/db'
import { driveIntegrations, documents, DocType, DOC_TYPE_LABELS } from '@/db/schema'
import { decryptToken, encryptToken } from '@/lib/utils'
import { eq } from 'drizzle-orm'

interface DriveFile {
  id: string
  webViewLink: string
}

async function getValidAccessToken(tenantId: string): Promise<string | null> {
  const [integration] = await db.select().from(driveIntegrations)
    .where(eq(driveIntegrations.tenantId, tenantId)).limit(1)

  if (!integration?.accessToken) return null

  const now = Math.floor(Date.now() / 1000)
  const isExpired = integration.tokenExpiry && integration.tokenExpiry < now + 60

  if (!isExpired) {
    return decryptToken(integration.accessToken)
  }

  // Refresh token
  if (!integration.refreshToken) return null

  const refreshed = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: decryptToken(integration.refreshToken),
      grant_type: 'refresh_token',
    }),
  }).then(r => r.json())

  if (!refreshed.access_token) return null

  await db.update(driveIntegrations).set({
    accessToken: encryptToken(refreshed.access_token),
    tokenExpiry: Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600),
  }).where(eq(driveIntegrations.tenantId, tenantId))

  return refreshed.access_token
}

async function getOrCreateFolder(accessToken: string, name: string, parentId?: string): Promise<string> {
  // Search for existing folder
  const query = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).then(r => r.json())

  if (searchRes.files?.[0]?.id) return searchRes.files[0].id

  // Create folder
  const createBody: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }
  if (parentId) createBody.parents = [parentId]

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBody),
  }).then(r => r.json())

  return createRes.id
}

export async function uploadDocumentToDrive(
  tenantId: string,
  documentId: string,
  docNumber: string,
  docType: string,
  pdfBuffer: Buffer,
  filename: string
): Promise<DriveFile | null> {
  try {
    const accessToken = await getValidAccessToken(tenantId)
    if (!accessToken) return null

    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
    const monthName = THAI_MONTHS[now.getMonth()]
    const docTypeLabel = DOC_TYPE_LABELS[docType as DocType] || docType

    // Build folder structure: AccountThai/YYYY/MM-MonthName/DocTypeLabel/
    const rootFolder = await getOrCreateFolder(accessToken, 'AccountThai')
    const yearFolder = await getOrCreateFolder(accessToken, year, rootFolder)
    const monthFolder = await getOrCreateFolder(accessToken, `${month}-${monthName}`, yearFolder)
    const typeFolder = await getOrCreateFolder(accessToken, docTypeLabel, monthFolder)

    // Upload file
    const metadata = JSON.stringify({ name: filename, parents: [typeFolder] })
    const form = new FormData()
    form.append('metadata', new Blob([metadata], { type: 'application/json' }))
    form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }))

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      }
    ).then(r => r.json())

    if (!uploadRes.id) return null

    // Update document with drive info
    await db.update(documents)
      .set({
        driveFileId: uploadRes.id,
        driveUrl: uploadRes.webViewLink,
        driveStatus: 'uploaded',
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(eq(documents.id, documentId))

    return { id: uploadRes.id, webViewLink: uploadRes.webViewLink }
  } catch (error) {
    // Non-blocking: update status to failed
    await db.update(documents)
      .set({ driveStatus: 'failed', updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(documents.id, documentId))
    console.error('Drive upload error:', error)
    return null
  }
}
