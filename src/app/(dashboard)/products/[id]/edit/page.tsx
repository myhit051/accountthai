import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getProductById } from '@/db/queries/products'
import ProductForm from '@/components/products/ProductForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { id } = await params
  const product = await getProductById(id, session.user.id)
  if (!product || product.deletedAt) notFound()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">แก้ไขสินค้า</h1>
      <ProductForm product={product} />
    </div>
  )
}
