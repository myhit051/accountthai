import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getProducts } from '@/db/queries/products'
import Link from 'next/link'
import DeleteProductButton from '@/components/products/DeleteProductButton'
import EmptyState from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  product: 'สินค้า', service: 'บริการ',
}

export default async function ProductsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const products = await getProducts(session.user.id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Link href="/products/new" id="new-product-btn" className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            เพิ่มสินค้า
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อสินค้า</th>
              <th className="hidden sm:table-cell">รหัส</th>
              <th className="hidden sm:table-cell">ประเภท</th>
              <th className="hidden md:table-cell">หน่วย</th>
              <th className="text-right">ราคา/หน่วย</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon="📦"
                    title="ยังไม่มีสินค้า"
                    description="เพิ่มสินค้าหรือบริการเพื่อเลือกใช้ตอนออกเอกสารได้เลย"
                    actionLabel="เพิ่มสินค้าแรก"
                    actionHref="/products/new"
                  />
                </td>
              </tr>
            ) : products.map(product => (
              <tr key={product.id}>
                <td>
                  <Link href={`/products/${product.id}/edit`} className="font-medium text-gray-900 hover:text-blue-600">
                    {product.name}
                  </Link>
                  {product.description && <div className="text-xs text-gray-400 truncate max-w-[220px]">{product.description}</div>}
                </td>
                <td className="hidden sm:table-cell"><span className="font-mono text-sm">{product.code || '—'}</span></td>
                <td className="hidden sm:table-cell"><span className="badge badge-draft">{TYPE_LABELS[product.type] || product.type}</span></td>
                <td className="hidden md:table-cell text-sm text-gray-500">{product.unit || '—'}</td>
                <td className="text-right font-mono text-sm">{formatCurrency(product.unitPrice)}</td>
                <td>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}/edit`} className="text-xs text-gray-400 hover:text-blue-600">แก้ไข</Link>
                    <DeleteProductButton id={product.id} name={product.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
