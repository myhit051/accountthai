import ContactForm from '@/components/contacts/ContactForm'

export default function NewContactPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">สร้างรายชื่อผู้ติดต่อ</h1>
        <p className="text-gray-500 text-sm mt-0.5">บันทึกข้อมูลลูกค้าและผู้ขายเพื่อใช้ซ้ำในการออกเอกสาร</p>
      </div>
      <ContactForm />
    </div>
  )
}
