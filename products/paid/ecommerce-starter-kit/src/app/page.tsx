import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, ShieldCheck, Zap } from 'lucide-react'
import { ProductList } from '@/components/products/product-list'
import { getProducts } from '@/lib/products'

export const revalidate = 60

export default async function Home() {
  const products = await getProducts().catch(() => [])
  const featuredProducts = products.slice(0, 4)

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center space-y-4 text-center py-20 bg-muted/30 rounded-3xl">
        <div className="space-y-2 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Modern E-commerce Starter Kit
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            A production-ready, full-stack e-commerce solution built with Next.js 14,
            Supabase, Stripe, and Tailwind CSS.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/products">
            <Button size="lg" className="gap-2">
              Shop Now <ShoppingBag className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/your-repo" target="_blank">
            <Button size="lg" variant="outline">
              View on GitHub
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center space-y-2 p-6 border rounded-xl bg-card">
          <div className="p-3 bg-primary/10 rounded-full">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Fast Performance</h3>
          <p className="text-muted-foreground">
            Built on Next.js 14 App Router for lightning-fast page loads and SEO.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-2 p-6 border rounded-xl bg-card">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Secure Payments</h3>
          <p className="text-muted-foreground">
            Integrated with Stripe for secure and reliable payment processing.
          </p>
        </div>
        <div className="flex flex-col items-center text-center space-y-2 p-6 border rounded-xl bg-card">
          <div className="p-3 bg-primary/10 rounded-full">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold">Full Features</h3>
          <p className="text-muted-foreground">
            Includes cart, checkout, admin dashboard, order management, and more.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <Link href="/products">
            <Button variant="ghost" className="gap-2">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        {featuredProducts.length > 0 ? (
          <ProductList products={featuredProducts} />
        ) : (
          <div className="text-center py-10 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              No products found. Add some in your database to see them here.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
