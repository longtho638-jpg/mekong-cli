import { Metadata } from "next";
import FlowerDetailClient from "@/components/flower/FlowerDetailClient";
import { getProductById } from "@/lib/api/products";
import { notFound } from "next/navigation";
import { safeJsonLd } from "@/lib/utils-seo";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// 1. Generate Metadata dynamically
export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const product = await getProductById(params.id);

    if (!product) {
        return {
            title: "Không tìm thấy sản phẩm | Sa Đéc Flower Hunt",
        };
    }

    return {
        title: `${product.name} - Đặt mua ngay | Sa Đéc Flower Hunt`,
        description: product.description || "Mua hoa Sa Đéc chính hiệu trực tiếp từ nhà vườn.",
        openGraph: {
            images: product.images || [],
        },
    };
}

// 2. Main Server Component
export default async function FlowerPage(props: PageProps) {
    const params = await props.params;
    const product = await getProductById(params.id);

    if (!product) {
        notFound();
    }

    // JSON-LD for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image,
        description: product.description,
        brand: {
            '@type': 'Brand',
            name: 'Sa Đéc Flower Hunt',
        },
        offers: {
            '@type': 'Offer',
            url: `https://sadec-flower-hunt.vercel.app/flower/${product.id}`,
            priceCurrency: 'VND',
            price: product.price,
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />
            {/* Pass the full product object to the Client Component */}
            <FlowerDetailClient product={product} />
        </>
    );
}
