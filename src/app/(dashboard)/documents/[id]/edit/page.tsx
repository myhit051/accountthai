import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDocumentById } from '@/db/queries/documents'
import { getContacts } from '@/db/queries/contacts'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import DocumentForm from '@/components/documents/DocumentForm'
import Link from 'next/link'

const DOC_TYPE_ICONS: Record<DocType, string> = {
  INV: '🧾', EXP: '💸', WT: '📋', QT: '📝', BL: '📑', RE: '✅',
}

export default async function EditDocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const tenantId = session.user.id
  const doc = await getDocumentById(params.id, tenantId)

  if (!doc) redirect('/documents')
  if (doc.status !== 'draft') {
    // Only allow editing drafts
    redirect(`/documents/${doc.id}`)
  }

  const contacts = await getContacts(tenantId)
  const docType = doc.docType as DocType

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/documents/${doc.id}`} className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {DOC_TYPE_ICONS[docType]} แก้ไข{DOC_TYPE_LABELS[docType]}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{doc.docNumber}</p>
        </div>
      </div>

      <DocumentForm contacts={contacts} docType={docType} initialData={doc} />
    </div>
  )
}
