'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil } from 'lucide-react'
import DeleteContactButton from './DeleteContactButton'

export default function ContactRowActions({ contactId, contactName }: { contactId: string; contactName: string }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    function handlePointer(e: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('touchstart', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('touchstart', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`เมนูผู้ติดต่อ ${contactName}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg"
        >
          <Link
            href={`/contacts/${contactId}/edit`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
          >
            <Pencil size={15} aria-hidden="true" />
            แก้ไข
          </Link>
          <div role="menuitem" className="px-3 py-2 hover:bg-red-50">
            <DeleteContactButton id={contactId} name={contactName} />
          </div>
        </div>
      )}
    </div>
  )
}
