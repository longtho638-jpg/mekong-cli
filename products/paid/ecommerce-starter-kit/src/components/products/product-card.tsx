import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types/supabase'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/cart'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem(product)
    toast.success('Added to cart')
  }

  return (
    <Card className="overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative">
          <Image
            src={product.images[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          {product.sale_price ? (
            <>
              <span className="text-lg font-bold">
                {formatCurrency(product.sale_price)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  )
}
