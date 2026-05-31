import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getContacts } from '@/db/queries/contacts'
import Link from 'next/link'
import ContactRowActions from '@/components/contacts/ContactRowActions'
import { Plus, Search, Upload, Users } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  customer: 'ลูกค้า', vendor: 'ผู้ขาย', both: 'ลูกค้า/ผู้ขาย',
}

const TYPE_DOT_CLASS: Record<string, string> = {
  customer: 'bg-sky-500',
  vendor: 'bg-amber-400',
  both: 'bg-lime-500',
}

const CONTACT_TABS = [
  { key: '', label: 'แสดงทั้งหมด' },
  { key: 'customer', label: 'ลูกค้า' },
  { key: 'vendor', label: 'ผู้ขาย' },
  { key: 'both', label: 'ลูกค้า/ผู้ขาย' },
]

type SearchParams = {
  q?: string
  type?: string
}

export default async function ContactsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const resolvedParams = await searchParams
  const search = resolvedParams.q?.trim()
  const activeType = CONTACT_TABS.some((tab) => tab.key === resolvedParams.type) ? resolvedParams.type || '' : ''
  const contacts = await getContacts(session.user.id)
  const searchedContacts = search
    ? contacts.filter((contact) => {
        const q = search.toLowerCase()
        return contact.name.toLowerCase().includes(q) || (contact.taxId && contact.taxId.includes(q))
      })
    : contacts
  const filteredContacts = activeType
    ? searchedContacts.filter((contact) => contact.type === activeType)
    : searchedContacts

  const createUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (activeType) params.set('type', activeType)

    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })

    const query = params.toString()
    return query ? `/contacts?${query}` : '/contacts'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สมุดรายชื่อ</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            แสดง {filteredContacts.length} จาก {contacts.length} รายการ
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/import?target=contacts" className="btn-secondary btn-sm">
            <Upload size={14} aria-hidden="true" />
            นำเข้า CSV
          </Link>
          <Link href="/contacts/new" id="new-contact-btn" className="btn-primary">
            <Plus size={16} aria-hidden="true" />
            เพิ่มผู้ติดต่อ
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1">
            {CONTACT_TABS.map((tab) => {
              const isActive = activeType === tab.key
              return (
                <Link
                  key={tab.key}
                  href={createUrl({ type: tab.key || undefined })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </Link>
              )
            })}
          </div>

          <form method="GET" action="/contacts" className="flex w-full gap-2 lg:w-auto">
            {activeType && <input type="hidden" name="type" value={activeType} />}
            <div className="relative flex-1 lg:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} aria-hidden="true" />
              <input
                name="q"
                type="text"
                placeholder="ค้นหาจากชื่อ หรือเลขผู้เสียภาษี"
                defaultValue={search}
                className="form-input pl-9"
              />
            </div>
            <button type="submit" className="btn-secondary btn-sm">ค้นหา</button>
            {search && <Link href={createUrl({ q: undefined })} className="btn-ghost btn-sm">ล้าง</Link>}
          </form>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-sky-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">รายชื่อ</th>
                <th className="px-4 py-3 text-left font-semibold">เลขประจำตัวผู้เสียภาษี</th>
                <th className="px-4 py-3 text-left font-semibold">ประเภท</th>
                <th className="px-4 py-3 text-left font-semibold">โทรศัพท์</th>
                <th className="px-4 py-3 text-left font-semibold">อีเมล</th>
                <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-100">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <Users size={40} className="text-gray-300" aria-hidden="true" />
                    <div>{search || activeType ? 'ไม่พบผู้ติดต่อที่ตรงกับเงื่อนไข' : 'ยังไม่มีผู้ติดต่อ'}</div>
                    <Link href="/contacts/new" className="text-blue-600 hover:underline text-sm">เพิ่มผู้ติดต่อแรก →</Link>
                  </div>
                </td>
                </tr>
              ) : filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-sky-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="flex items-start gap-3 font-medium text-gray-900 hover:text-blue-700">
                      <span className={`mt-2 h-2 w-2 rounded-full ${TYPE_DOT_CLASS[contact.type] || 'bg-gray-300'}`} />
                      <span>
                        {contact.name}
                        {contact.branch && <span className="ml-2 text-xs font-normal text-gray-400">{contact.branch}</span>}
                        {contact.address && <div className="text-xs font-normal text-gray-400 truncate max-w-[280px]">{contact.address}</div>}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><span className="font-mono text-sm text-gray-700">{contact.taxId || '—'}</span></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {TYPE_LABELS[contact.type] || contact.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.email || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <ContactRowActions contactId={contact.id} contactName={contact.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
