import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, TrendingUp } from 'lucide-react';

export const metadata = {
    title: 'Top 5 loại hoa chưng Tết Ất Tỵ 2026 mang lại tài lộc | Blog Hoa Sa Đéc',
    description: 'Điểm danh 5 loại hoa Tết đang được săn đón nhất năm 2026. Hướng dẫn chọn hoa hợp phong thủy rước lộc vào nhà.',
};

const TOP_FLOWERS = [
    {
        name: "1. Cúc Mâm Xôi Hàn Quốc",
        desc: "Khác với cúc mâm xôi truyền thống màu vàng, giống mới từ Hàn Quốc có nhiều màu sắc rực rỡ như đỏ, tím, cam. Bông nhỏ li ti, nở kín tròn đầy tượng trưng cho sự sung túc, sum vầy.",
        imange: "https://images.unsplash.com/photo-1610336248679-b7c1969a538d?q=80&w=800&fit=crop"
    },
    {
        name: "2. Hồng Lửa Sa Đéc",
        desc: "Sắc đỏ nhung thẫm mang lại may mắn đầu năm. Hồng Lửa Sa Đéc nổi tiếng với độ bền cao (chưng được hơn 1 tuần) và hương thơm dịu nhẹ, sang trọng.",
        imange: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?q=80&w=800&fit=crop"
    },
    {
        name: "3. Mai Vàng Thủ Đức (Ghép)",
        desc: "Dù không phải gốc Sa Đéc, nhưng các nghệ nhân tại đây đã nhân giống thành công loại mai ghép nhiều tầng cánh, hoa to, lâu tàn. Sắc vàng rực rỡ là biểu tượng không thể thiếu của Tết phương Nam.",
        imange: "https://images.unsplash.com/photo-1549887552-93f8efb87275?q=80&w=800&fit=crop"
    },
    {
        name: "4. Lan Hồ Điệp Mini",
        desc: "Xu hướng nhà phố diện tích nhỏ lên ngôi, các chậu Lan Hồ Điệp mini để bàn trà đang rất 'hot'. Vừa sang trọng, vừa tinh tế, lại chưng được rất lâu (1-2 tháng).",
        imange: "https://images.unsplash.com/photo-1566633635953-61b65fa9bb39?q=80&w=800&fit=crop"
    },
    {
        name: "5. Hạnh Phúc (Đỗ Quyên)",
        desc: "Cây Hạnh Phúc với lá xanh bóng và hoa đỏ rực, mang ý nghĩa cầu chúc một năm mới gia đạo bình an, hạnh phúc viên mãn. Rất thích hợp làm quà biếu.",
        imange: "https://images.unsplash.com/photo-1512428559087-560fa5ce7d87?q=80&w=800&fit=crop"
    }
];

export default function BlogPost() {
    return (
        <article className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
            <Link href="/blog" className="inline-flex items-center text-stone-500 hover:text-green-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại Blog
            </Link>

            <div className="space-y-4 mb-8">
                <Badge className="bg-red-600 text-white hover:bg-red-700">Xu Hướng</Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight">
                    Top 5 loại hoa chưng Tết Ất Tỵ 2026 mang lại tài lộc
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-stone-500 text-sm border-b border-stone-200 pb-8">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-stone-900">Tư Lan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>04/12/2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>4 phút đọc</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full aspect-[16/9] mb-12 rounded-2xl overflow-hidden shadow-lg">
                <Image
                    src="https://images.unsplash.com/photo-1610336248679-b7c1969a538d?q=80&w=1200&auto=format&fit=crop"
                    alt="Hoa Tết rực rỡ"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            <div className="prose prose-stone prose-lg max-w-none">
                <p className="lead text-xl text-stone-600 mb-8 italic">
                    "Thấy hoa là thấy Tết. Năm mới Ất Tỵ 2026 gõ cửa, bạn đã chọn được chậu hoa nào để rước tài lộc vào nhà chưa?"
                </p>

                <p>
                    Thị trường hoa Tết năm nay chứng kiến sự lên ngôi của các dòng hoa lai tạo mới, ưu tiên màu sắc rực rỡ và độ bền cao. Người tiêu dùng ngày càng kỹ tính hơn, không chỉ chọn hoa đẹp mà còn phải hợp phong thủy và dễ chăm sóc.
                </p>
                <p>
                    Dưới đây là gợi ý <strong>Top 5 loại hoa "cháy hàng"</strong> tại Sa Đéc Flower Hunt:
                </p>

                <div className="space-y-12 my-12">
                    {TOP_FLOWERS.map((flower, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="relative w-full md:w-1/2 aspect-square rounded-xl overflow-hidden shadow-md flex-shrink-0">
                                <Image src={flower.imange} alt={flower.name} fill className="object-cover" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-800 mt-0">{flower.name}</h3>
                                <p className="text-stone-600">{flower.desc}</p>
                                <Button variant="outline" className="mt-4 border-green-600 text-green-700 hover:bg-green-50">
                                    <Link href="/">Xem giá bán</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <h3>Lưu ý khi chọn hoa Tết</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Thời điểm mua:</strong> Nên đặt hoa trước Rằm tháng Chạp (15/12 ÂL) để chọn được cây đẹp nhất và giá tốt. Càng cận Tết giá càng tăng cao.</li>
                    <li><strong>Quan sát nụ:</strong> Chọn cây có nụ to, mập mạp, lá xanh mướt, không bị sâu bệnh.</li>
                    <li><strong>Vận chuyển:</strong> Nếu mua online, hãy chọn đơn vị uy tín có cam kết đóng gói như Sa Đéc Flower Hunt để hoa không bị gãy dập.</li>
                </ul>

                <div className="my-8 p-6 bg-red-50 rounded-xl border border-red-100 text-center">
                    <h4 className="text-red-800 font-bold mb-2">🔥 Đặt hoa Tết sớm - Nhận ưu đãi lớn</h4>
                    <p className="mb-4 text-red-700">
                        Giảm ngay 20% cho đơn hàng đặt trước ngày 20/12. Số lượng có hạn!
                    </p>
                    <Button className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto">
                        <Link href="/">Săn Hoa Ngay</Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}
