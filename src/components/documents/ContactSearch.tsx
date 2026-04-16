'use client'

import { useState, useEffect, useCallback } from 'react'
import { Contact } from '@/db/schema'

interface Props {
  contacts: Contact[]
  value?: string
  onSelect: (contact: Contact | null) => void
  placeholder?: string
}

export default function ContactSearch({ contacts, value, onSelect, placeholder = 'ค้นหาผู้ติดต่อ...' }: Props) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState<Contact[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(contacts.slice(0, 8))
      return
    }
    const q = query.toLowerCase()
    setFiltered(
      contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.taxId && c.taxId.includes(q))
      ).slice(0, 8)
    )
  }, [query, contacts])

  function handleSelect(contact: Contact) {
    setQuery(contact.name)
    setIsOpen(false)
    onSelect(contact)
  }

  return (
    <div className="relative">
      <input
        id="contact-search-input"
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">ไม่พบผู้ติดต่อ</div>
          ) : (
            filtered.map(contact => (
              <button
                key={contact.id}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                onMouseDown={() => handleSelect(contact)}
              >
                <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                <div className="text-xs text-gray-400 flex gap-2 mt-0.5">
                  {contact.taxId && <span>เลขภาษี: {contact.taxId}</span>}
                  {contact.phone && <span>โทร: {contact.phone}</span>}
                </div>
              </button>
            ))
          )}
          <div className="border-t border-gray-100">
            <a href="/contacts/new" className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              เพิ่มผู้ติดต่อใหม่
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
