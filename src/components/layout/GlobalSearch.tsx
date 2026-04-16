'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    router.push(`/documents?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          ค้นหาด่วน...
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="relative">
              <svg className="absolute left-4 top-3.5 text-blue-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="พิมพ์ค้นหาเลขที่เอกสาร, ชื่อลูกค้า หรือพิมพ์ประเภทเอกสาร..."
                className="w-full pl-12 pr-4 py-4 text-base bg-transparent border-0 focus:ring-0 text-gray-900 placeholder-gray-400 outline-none"
              />
            </form>
            <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 flex justify-between border-t border-gray-100">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono font-bold shadow-sm">↵</kbd>
                เพื่อค้นหาบนหน้าเอกสาร
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono font-bold shadow-sm">ESC</kbd>
                เพื่อปิด
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
