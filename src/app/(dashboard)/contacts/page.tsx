import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getContacts } from '@/db/queries/contacts'
import { createContact, deleteContact } from '@/actions/contacts'
import Link from 'next/link'
import DeleteContactButton from '@/components/contacts/DeleteContactButton'

const TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้า', vendor: 'ผู้ขาย', both: 'ลูกค้า/ผู้ขาย',
}

export default async function ContactsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const contacts = await getContacts(session.user.id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ติดต่อ</h1>
          <p className="text-gray-500 text-sm mt-0.5">{contacts.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/import?target=contacts" className="btn-secondary btn-sm">
            นำเข้า CSV
          </Link>
          <Link href="/contacts/new" id="new-contact-btn" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            เพิ่มผู้ติดต่อ
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ / บริษัท</th>
              <th>เลขประจำตัวผู้เสียภาษี</th>
              <th>ประเภท</th>
              <th>โทรศัพท์</th>
              <th>อีเมล</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12">
                  <div className="space-y-3">
                    <div className="text-4xl">👥</div>
                    <div>ยังไม่มีผู้ติดต่อ</div>
                    <Link href="/contacts/new" className="text-blue-600 hover:underline text-sm">เพิ่มผู้ติดต่อแรก →</Link>
                  </div>
                </td>
              </tr>
            ) : contacts.map(contact => (
              <tr key={contact.id}>
                <td>
                  <Link href={`/contacts/${contact.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {contact.name}
                  </Link>
                  {contact.address && <div className="text-xs text-gray-400 truncate max-w-[200px]">{contact.address}</div>}
                </td>
                <td><span className="font-mono text-sm">{contact.taxId || '—'}</span></td>
                <td><span className="badge badge-draft">{TYPE_LABELS[contact.type] || contact.type}</span></td>
                <td className="text-sm text-gray-500">{contact.phone || '—'}</td>
                <td className="text-sm text-gray-500">{contact.email || '—'}</td>
                <td>
                    <div className="flex gap-2">
                      <Link href={`/contacts/${contact.id}/edit`} className="text-xs text-gray-400 hover:text-blue-600">แก้ไข</Link>
                      <DeleteContactButton id={contact.id} name={contact.name} />
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
