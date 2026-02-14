import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

export const metadata = {
    title: 'Blog Hoa Sa Đéc | Kiến Thức & Kinh Nghiệm',
    description: 'Chia sẻ kiến thức chăm sóc hoa, câu chuyện làng hoa Sa Đéc và xu hướng hoa tươi mới nhất.',
};

const BLOG_POSTS = [
    {
        slug: 'cach-giu-hoa-tuoi-lau-7-ngay',
        title: 'Bí quyết giữ hoa tươi lâu đến 7 ngày của người Sa Đéc',
        excerpt: 'Học hỏi kinh nghiệm từ các nghệ nhân làng hoa Sa Đéc để giữ bình hoa của bạn luôn rực rỡ suốt cả tuần.',
        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=800&auto=format&fit=crop',
        category: 'Mẹo Chăm Sóc',
        date: '06/12/2025',
        readTime: '5 phút',
        author: 'Út Men'
    },
    {
        slug: 'lang-hoa-sa-dec-di-san-tram-nam',
        title: 'Làng hoa Sa Đéc - Di sản trăm năm bên dòng Sa Giang',
        excerpt: 'Hành trình từ một làng nghề trồng hoa kiểng truyền thống trở thành thủ phủ hoa của miền Tây.',
        image: 'https://images.unsplash.com/photo-1582794543139-8ac92a900275?q=80&w=800&auto=format&fit=crop',
        category: 'Câu Chuyện',
        date: '05/12/2025',
        readTime: '8 phút',
        author: 'Tám Sài Gòn'
    },
    {
        slug: 'top-5-hoa-tet-2026',
        title: 'Top 5 loại hoa chưng Tết Ất Tỵ 2026 mang lại tài lộc',
        excerpt: 'Xu hướng hoa Tết năm nay là gì? Cùng Sa Đéc Flower Hunt điểm qua 5 loại hoa "hot" nhất.',
        image: 'https://images.unsplash.com/photo-1610336248679-b7c1969a538d?q=80&w=800&auto=format&fit=crop',
        category: 'Xu Hướng',
        date: '04/12/2025',
        readTime: '4 phút',
        author: 'Tư Lan'
    }
];

export default function BlogPage() {
    return (
        <div className="container mx-auto px-4 py-8 pb-32">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-green-800 mb-4">Blog Hoa Sa Đéc</h1>
                <p className="text-stone-600 max-w-2xl mx-auto">
                    Nơi chia sẻ niềm đam mê hoa kiểng, kinh nghiệm chăm sóc và những câu chuyện thú vị từ làng hoa trăm tuổi.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {BLOG_POSTS.map((post) => (
                    <Link href={`/blog/${post.slug}`} key={post.slug} className="group">
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 border-stone-200">
                            <div className="relative h-48 w-full overflow-hidden">
                                <Image
                                    src={post.image}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <Badge className="absolute top-3 right-3 bg-green-600 hover:bg-green-700">
                                    {post.category}
                                </Badge>
                            </div>
                            <CardHeader className="pb-3">
                                <div className="flex items-center text-xs text-stone-500 mb-2 gap-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {post.date}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {post.readTime}
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold text-stone-800 group-hover:text-green-700 transition-colors line-clamp-2">
                                    {post.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-stone-600 text-sm line-clamp-3 mb-4">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                    <User className="w-4 h-4" />
                                    {post.author}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
