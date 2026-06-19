'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { CURRENT_VERSION } from '@/lib/version'
import GlobalSearch from './GlobalSearch'

// เมนูย่อยของ "เอกสาร" — กดเข้าหน้ารายการของแต่ละประเภทได้ในคลิกเดียว
const docTypeChildren = [
  { type: '', label: 'ทั้งหมด' },
  { type: 'INV', label: 'ใบกำกับภาษี' },
  { type: 'EXP', label: 'ค่าใช้จ่าย' },
  { type: 'WT', label: 'หัก ณ ที่จ่าย' },
  { type: 'QT', label: 'ใบเสนอราคา' },
  { type: 'BL', label: 'ใบแจ้งหนี้' },
  { type: 'RE', label: 'ใบเสร็จ' },
]

const navItems = [
  {
    href: '/',
    label: 'แดชบอร์ด',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/documents',
    label: 'เอกสาร',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    ),
  },
  {
    href: '/contacts',
    label: 'ผู้ติดต่อ',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/products',
    label: 'สินค้า',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'รายงาน',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/meta-ads',
    label: 'ค่าโฆษณา Meta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l18-5v12L3 14v-3z"/>
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
      </svg>
    ),
  },
  {
    href: '/import',
    label: 'นำเข้าข้อมูล',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="8,17 12,21 16,17"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'ตั้งค่า',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  // เมนูเอกสารกางอยู่ตลอดเมื่ออยู่ในหน้าเอกสาร + ให้ผู้ใช้กดกาง/พับเองได้ด้วย
  const docsActive = pathname === '/documents'
  const currentType = docsActive ? (searchParams.get('type') || '') : null
  const [docsOpen, setDocsOpen] = useState(false)
  const docsExpanded = docsOpen || isActive('/documents')

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">AccountThai</div>
            <div className="text-xs text-gray-400">ระบบบัญชีออนไลน์</div>
          </div>
        </div>

        {/* Global Search */}
        <div className="px-3 pt-4 pb-2">
          <GlobalSearch />
        </div>

        {/* New Document Button */}
        <div className="px-3 py-3">
          <Link
            id="new-document-btn"
            href="/documents/new"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl py-2.5 transition-colors shadow-sm shadow-blue-600/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            สร้างเอกสาร
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              // เมนู "เอกสาร" — แสดงเป็นเมนูแม่ที่กางเมนูย่อยตามประเภทได้
              if (item.href === '/documents') {
                const sectionActive = isActive('/documents')
                return (
                  <div key={item.href}>
                    <div
                      className={cn(
                        'flex items-center rounded-xl text-sm font-medium transition-all',
                        sectionActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <Link href="/documents" className="flex items-center gap-3 px-3 py-2.5 flex-1 min-w-0">
                        <span className={sectionActive ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDocsOpen((o) => !o)}
                        aria-label={docsExpanded ? 'พับเมนูเอกสาร' : 'กางเมนูเอกสาร'}
                        aria-expanded={docsExpanded}
                        className="px-3 py-2.5 text-gray-400 hover:text-gray-700"
                      >
                        <svg
                          className={cn('transition-transform', docsExpanded && 'rotate-90')}
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <polyline points="9,18 15,12 9,6" />
                        </svg>
                      </button>
                    </div>
                    {docsExpanded && (
                      <div className="mt-0.5 ml-5 pl-3 border-l border-gray-200 space-y-0.5">
                        {docTypeChildren.map((child) => {
                          const active = currentType !== null && currentType === child.type
                          return (
                            <Link
                              key={child.type || 'all'}
                              href={child.type ? `/documents?type=${child.type}` : '/documents'}
                              className={cn(
                                'block px-3 py-2 rounded-lg text-sm transition-all',
                                active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                              )}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <span className={isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Version / Changelog */}
        <div className="px-3 pb-1">
          <Link
            href="/changelog"
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all',
              isActive('/changelog') ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            เวอร์ชัน {CURRENT_VERSION} · มีอะไรใหม่
          </Link>
        </div>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all',
              isActive(item.href) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
