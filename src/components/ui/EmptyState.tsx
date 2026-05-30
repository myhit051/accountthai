import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
}

export default function EmptyState({ icon = '📄', title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-gray-400">
      <div className="text-4xl">{icon}</div>
      <div className="text-gray-500">{title}</div>
      {description && <div className="text-sm text-gray-400 max-w-xs">{description}</div>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="text-sm text-blue-600 hover:underline">
          {actionLabel} →
        </Link>
      )}
    </div>
  )
}
