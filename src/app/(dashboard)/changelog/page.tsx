import type { Metadata } from 'next'
import { CHANGELOG, CURRENT_VERSION, ChangeType } from '@/lib/version'

export const metadata: Metadata = {
  title: 'มีอะไรใหม่ — AccountThai',
}

const TYPE_LABELS: Record<ChangeType, { label: string; className: string }> = {
  new: { label: 'ใหม่', className: 'bg-green-50 text-green-700' },
  improved: { label: 'ปรับปรุง', className: 'bg-blue-50 text-blue-700' },
  fixed: { label: 'แก้ไข', className: 'bg-amber-50 text-amber-700' },
}

function formatThaiDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">มีอะไรใหม่</h1>
        <p className="text-sm text-gray-500 mt-1">เวอร์ชันปัจจุบัน {CURRENT_VERSION}</p>
      </div>

      <div className="space-y-4">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">เวอร์ชัน {entry.version}</h2>
              <span className="text-xs text-gray-400">{formatThaiDate(entry.date)}</span>
            </div>
            <ul className="space-y-2.5">
              {entry.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium flex-shrink-0 ${TYPE_LABELS[change.type].className}`}>
                    {TYPE_LABELS[change.type].label}
                  </span>
                  <span className="text-gray-700">{change.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
