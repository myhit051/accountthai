'use client'

import { useState } from 'react'

export default function PdfPreviewModal({ docId, docNumber }: { docId: string, docNumber: string }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-secondary btn-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        PDF
      </button>
    )
  }

  const handleDownload = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
      if (!iframe?.contentDocument) return
      
      const opt = {
        margin: 10,
        filename: `${docNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      html2pdf().from(iframe.contentDocument.body).set(opt).save()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrint = () => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
    if (iframe?.contentWindow) {
      iframe.contentWindow.print()
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-secondary btn-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
        PDF
      </button>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-900">ตัวอย่างเอกสาร {docNumber}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="btn-secondary btn-sm text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                🖨️ พิมพ์
              </button>
              <button
                onClick={handleDownload}
                className="btn-secondary btn-sm text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                📥 ดาวน์โหลด PDF
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="ปิดหน้าต่าง"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-100 relative">
            <iframe
              id="preview-iframe"
              src={`/api/documents/${docId}/pdf`}
              className="absolute inset-0 w-full h-full border-0 bg-white"
              title="PDF Preview"
            />
          </div>
        </div>
      </div>
    </>
  )
}
