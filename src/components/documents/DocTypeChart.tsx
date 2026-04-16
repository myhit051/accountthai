'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DOC_TYPE_LABELS, DocType } from '@/db/schema'
import { formatNumber } from '@/lib/utils'

interface Props {
  byType: Record<string, number>
}

const COLORS: Record<string, string> = {
  INV: '#3b82f6',
  EXP: '#f97316',
  WT: '#8b5cf6',
  QT: '#06b6d4',
  BL: '#ec4899',
  RE: '#10b981',
}

export default function DocTypeChart({ byType }: Props) {
  const data = Object.entries(byType).map(([type, count]) => ({
    type,
    label: DOC_TYPE_LABELS[type as DocType] || type,
    count,
    fill: COLORS[type] || '#94a3b8',
  }))

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        ยังไม่มีข้อมูลเดือนนี้
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Sarabun' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, fontFamily: 'Sarabun', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          formatter={(value: number) => [formatNumber(value), 'จำนวน']}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <rect key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
