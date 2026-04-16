'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DriveUploader({ docId }: { docId: string }) {
  const router = useRouter()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let mounted = true

    const doUpload = async () => {
      if (uploading) return
      setUploading(true)

      try {
        // Fetch raw HTML
        const res = await fetch(`/api/documents/${docId}/pdf`)
        const htmlStr = await res.text()

        // Wait for iframe to load the content
        if (!iframeRef.current) return
        const doc = iframeRef.current.contentDocument
        if (!doc) return

        doc.open()
        doc.write(htmlStr)
        doc.close()

        // Give it a tiny bit of time to render fonts and layout
        await new Promise(r => setTimeout(r, 1000))

        if (!mounted) return

        // Dynamically import html2pdf
        const html2pdf = (await import('html2pdf.js')).default

        const opt = {
          margin: 10,
          filename: 'doc.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }

        // Generate PDF Blob
        const blob = await html2pdf()
          .from(doc.body)
          .set(opt)
          .outputPdf('blob')

        if (!mounted) return

        // Upload to Drive via our new API
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
          console.error('Failed to upload blob')
        }
      } catch (err) {
        console.error('DriveUploader Error:', err)
      } finally {
        if (mounted) setUploading(false)
      }
    }

    doUpload()

    return () => {
      mounted = false
    }
  }, [docId, router])

  return (
    <iframe
      ref={iframeRef}
      style={{ width: '800px', height: '1000px', position: 'absolute', left: '-9999px', top: '-9999px' }}
      title="Background PDF renderer"
    />
  )
}
