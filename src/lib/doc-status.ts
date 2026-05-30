import type { DocStatus } from '@/db/schema'

// แหล่งความจริงเดียวของ "สถานะเอกสาร" — คำ/สี/ตัวเลือก ใช้ร่วมกันทั้งแอป
// (หน้ารายการ, หน้ารายละเอียด, แดชบอร์ด, dropdown เปลี่ยนสถานะ)

export const DOC_STATUS_OPTIONS: DocStatus[] = ['draft', 'issued', 'paid', 'void']

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'ร่าง',
  issued: 'รอดำเนินการ',
  paid: 'เก็บเงินแล้ว',
  void: 'ยกเลิก',
}

// คลาส badge (นิยามใน globals.css)
export const DOC_STATUS_BADGE_CLASS: Record<DocStatus, string> = {
  draft: 'badge-draft',
  issued: 'badge-issued',
  paid: 'badge-paid',
  void: 'badge-void',
}

// คลาสสำหรับ pill ของ <select> เปลี่ยนสถานะ
export const DOC_STATUS_SELECT_CLASS: Record<DocStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  issued: 'bg-blue-50 text-blue-700 border-blue-100',
  paid: 'bg-green-50 text-green-700 border-green-100',
  void: 'bg-red-50 text-red-700 border-red-100',
}

// จุดสีนำหน้าในตาราง
export const DOC_STATUS_DOT_CLASS: Record<DocStatus, string> = {
  draft: 'bg-gray-300',
  issued: 'bg-blue-500',
  paid: 'bg-green-500',
  void: 'bg-red-500',
}

export function normalizeStatus(status: string): DocStatus {
  return DOC_STATUS_OPTIONS.includes(status as DocStatus) ? (status as DocStatus) : 'draft'
}
