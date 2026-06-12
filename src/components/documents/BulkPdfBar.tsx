'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

// แถบจัดการ "เลือกหลายรายการ → บันทึกเป็น PDF ไฟล์เดียว"
// อ่านสถานะจาก checkbox ที่ render มาในตาราง (.js-doc-select) + checkbox เลือกทั้งหมด (#js-doc-select-all)
export default function BulkPdfBar() {
  const [count, setCount] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const getBoxes = () => Array.from(document.querySelectorAll<HTMLInputElement>('.js-doc-select'))
    const all = document.getElementById('js-doc-select-all') as HTMLInputElement | null

    const update = () => {
      const list = getBoxes()
      const checked = list.filter((b) => b.checked)
      setCount(checked.length)
      if (all) all.checked = list.length > 0 && checked.length === list.length
    }
    const onToggleAll = () => {
      const checked = all?.checked ?? false
      getBoxes().forEach((b) => { b.checked = checked })
      update()
    }

    const boxes = getBoxes()
    boxes.forEach((b) => b.addEventListener('change', update))
    all?.addEventListener('change', onToggleAll)
    update()
    return () => {
      boxes.forEach((b) => b.removeEventListener('change', update))
      all?.removeEventListener('change', onToggleAll)
    }
  }, [])

  function handleSave() {
    const ids = Array.from(document.querySelectorAll<HTMLInputElement>('.js-doc-select:checked')).map((b) => b.value)
    if (ids.length === 0) return
    setBusy(true)
    const url = ids.length === 1
      ? `/api/documents/${ids[0]}/pdf?download=1`
      : `/api/documents/pdf?ids=${ids.join(',')}&download=1`
    const a = document.createElement('a')
    a.href = url
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => setBusy(false), 1500)
  }

  if (count === 0) return null

  return (
    <button type="button" onClick={handleSave} disabled={busy} className="btn-primary btn-sm">
      <Download size={15} aria-hidden="true" />
      {busy ? 'กำลังสร้างไฟล์...' : count > 1 ? `ดาวน์โหลด ZIP (${count})` : 'ดาวน์โหลด PDF (1)'}
    </button>
  )
}
