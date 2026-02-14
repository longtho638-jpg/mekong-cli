import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'AGRIOS - Làng Hoa Sa Đéc',
        short_name: 'AGRIOS',
        description: 'Nền tảng nông nghiệp thông minh: Khám phá vẻ đẹp hoa xuân miền Tây, quét AR nhận voucher và đặt hoa giá gốc tại vườn.',
        start_url: '/',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#050505',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
            {
                src: '/icon?size=192',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon?size=512',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
