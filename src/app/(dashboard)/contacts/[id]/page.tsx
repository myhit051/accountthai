import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getContactById } from '@/db/queries/contacts'
import DeleteContactButton from '@/components/contacts/DeleteContactButton'

const TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้า',
  vendor: 'ผู้ขาย',
  both: 'ลูกค้า/ผู้ขาย',
}

type Props = { params: Promise<{ id: string }> }

export default async function ContactDetailPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { id } = await params
  const contact = await getContactById(id, session.user.id)
  if (!contact || contact.deletedAt) notFound()

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/contacts" className="hover:text-gray-600">ผู้ติดต่อ</Link>
            <span>/</span>
            <span className="text-gray-600">{contact.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
          <span className="badge badge-draft mt-2">{TYPE_LABELS[contact.type] || contact.type}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/contacts/${contact.id}/edit`} className="btn-secondary btn-sm">แก้ไข</Link>
          <DeleteContactButton id={contact.id} name={contact.name} />
        </div>
      </div>

      <div className="card p-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div>
            <dt className="text-gray-400">เลขประจำตัวผู้เสียภาษี</dt>
            <dd className="font-mono text-gray-900 mt-1">{contact.taxId || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">สาขา</dt>
            <dd className="text-gray-900 mt-1">{contact.branch || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">โทรศัพท์</dt>
            <dd className="text-gray-900 mt-1">{contact.phone || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-400">อีเมล</dt>
            <dd className="text-gray-900 mt-1">{contact.email || '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-400">ที่อยู่</dt>
            <dd className="text-gray-900 mt-1 whitespace-pre-wrap">{contact.address || '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
