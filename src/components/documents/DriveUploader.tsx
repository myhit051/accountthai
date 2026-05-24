'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function DriveUploader({ docId }: { docId: string }) {
  const router = useRouter()
  const uploadKeyRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    const doUpload = async () => {
      if (uploadKeyRef.current === docId) return
      uploadKeyRef.current = docId

      try {
        const res = await fetch(`/api/documents/${docId}/pdf`)
        if (!res.ok) throw new Error('Failed to generate PDF')

        if (!mounted) return
        const blob = await res.blob()

        if (!mounted) return

        const formData = new FormData()
        formData.append('file', blob, 'doc.pdf')
        formData.append('docId', docId)

        const uploadRes = await fetch('/api/drive/upload-blob', {
          method: 'POST',
          body: formData,
        })

        if (uploadRes.ok) {
          router.refresh()
        } else {
          const payload = await uploadRes.json().catch(() => null)
          console.error(payload?.error || 'Failed to upload document to Drive')
        }
      } catch (err) {
        console.error('DriveUploader Error:', err)
      }
    }

    doUpload()

    return () => {
      mounted = false
    }
  }, [docId, router])

  return null
}
