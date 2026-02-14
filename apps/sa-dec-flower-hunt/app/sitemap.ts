import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://sadec-flower-hunt.vercel.app';

    // Static pages
    const staticPages = [
        '',
        '/partner',
        '/orders',
        '/blog', // Adding blog to sitemap
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic flower pages (top 10 for now - normally fetch from DB)
    const flowerIds = ['hong-sadec', 'cuc-mam-xoi', 'da-yen-thao', 'cat-tuong', 'lan-ho-diep', 'van-tho', 'tu-dang', 'hoa-giay', 'mai-vang', 'sen-hong'];
    const flowerPages = flowerIds.map((id) => ({
        url: `${baseUrl}/flower/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...staticPages, ...flowerPages];
}
