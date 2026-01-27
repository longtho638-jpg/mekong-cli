import { getProducts } from '@/lib/products'
import { ProductList } from '@/components/products/product-list'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Browse our collection of high-quality products.
        </p>
      </div>
      <ProductList products={products} />
    </div>
  )
}
