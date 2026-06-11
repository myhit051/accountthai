'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatNumber } from '@/lib/utils'

interface Props {
  data: { date: string; spend: number }[]
}

export default function MetaSpendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        ยังไม่มีข้อมูลในช่วงเวลานี้
      </div>
    )
  }

  const chartData = data.map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Sarabun' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, fontFamily: 'Sarabun', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
          formatter={(value: number) => [formatNumber(value), 'ค่าใช้จ่าย']}
        />
        <Bar dataKey="spend" fill="#3b82f6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
