import ProductForm from '@/components/products/ProductForm'

export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">เพิ่มสินค้า</h1>
      <ProductForm />
    </div>
  )
}
