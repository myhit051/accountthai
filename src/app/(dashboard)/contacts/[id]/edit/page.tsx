import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getContactById } from '@/db/queries/contacts'
import ContactForm from '@/components/contacts/ContactForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditContactPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { id } = await params
  const contact = await getContactById(id, session.user.id)
  if (!contact || contact.deletedAt) notFound()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ติดต่อ</h1>
        <p className="text-gray-500 text-sm mt-0.5">{contact.name}</p>
      </div>
      <ContactForm contact={contact} />
    </div>
  )
}
