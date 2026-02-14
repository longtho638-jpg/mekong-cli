import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, Share2 } from 'lucide-react';

export const metadata = {
    title: 'Bí quyết giữ hoa tươi lâu đến 7 ngày | Blog Hoa Sa Đéc',
    description: 'Học hỏi kinh nghiệm từ các nghệ nhân làng hoa Sa Đéc để giữ bình hoa của bạn luôn rực rỡ suốt cả tuần. Mẹo cắt tỉa, thay nước và dưỡng hoa đúng cách.',
};

export default function BlogPost() {
    return (
        <article className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
            <Link href="/blog" className="inline-flex items-center text-stone-500 hover:text-green-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại Blog
            </Link>

            <div className="space-y-4 mb-8">
                <Badge className="bg-green-600 text-white hover:bg-green-700">Mẹo Chăm Sóc</Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight">
                    Bí quyết giữ hoa tươi lâu đến 7 ngày của người Sa Đéc
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-stone-500 text-sm border-b border-stone-200 pb-8">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-stone-900">Út Men</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>06/12/2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>5 phút đọc</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full aspect-[16/9] mb-12 rounded-2xl overflow-hidden shadow-lg">
                <Image
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop"
                    alt="Bình hoa tươi rực rỡ"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            <div className="prose prose-stone prose-lg max-w-none">
                <p className="lead text-xl text-stone-600 mb-8 italic">
                    "Hoa cũng như người, cần nước sạch, không khí thoáng và sự chăm chút tỉ mỉ. Người Sa Đéc chúng tôi thương hoa nên hoa mới thắm sắc lâu." - Chú Ba, nghệ nhân trồng hoa 40 năm.
                </p>

                <p>
                    Bạn đã bao giờ thắc mắc tại sao hoa mua về chỉ đẹp được 2-3 ngày là héo rũ, trong khi hoa ở tiệm hay nhà vườn lại tươi cả tuần? Bí quyết không nằm ở loại thuốc thần kỳ nào cả, mà ở <strong>quy trình chăm sóc đúng cách</strong>. Hôm nay, Sa Đéc Flower Hunt sẽ chia sẻ 5 bí kíp "gia truyền" từ các nhà vườn Sa Đéc nhé!
                </p>

                <h3>1. "Cắt gốc trong nước" - Bí mật ít người biết</h3>
                <p>
                    Khi cắt gốc hoa ngoài không khí, bọt khí sẽ lập tức xâm nhập vào mạch dẫn, chặn đường hút nước của hoa.
                    <br /><strong>Cách làm đúng:</strong> Nhúng cành hoa vào chậu nước, dùng kéo sắc cắt xéo góc 45 độ TRONG NƯỚC. Điều này giúp hoa hút nước ngay lập tức và tăng diện tích tiếp xúc.
                </p>

                <h3>2. Nước cắm hoa phải "sạch như nước uống"</h3>
                <p>
                    Vi khuẩn là kẻ thù số 1 làm thối gốc hoa. Người Sa Đéc thường thay nước mỗi ngày vào buổi sáng.
                    <br /><strong>Mẹo nhỏ:</strong> Thêm 1-2 giọt nước rửa chén hoặc cốt chanh vào bình nước để diệt khuẩn. Nếu có gói dưỡng hoa (thường được tặng kèm khi mua tại Sa Đéc Flower Hunt), hãy dùng nó!
                </p>

                <div className="my-8 p-6 bg-green-50 rounded-xl border border-green-100">
                    <h4 className="text-green-800 font-bold mb-2">🎁 Ưu đãi dành cho bạn đọc</h4>
                    <p className="mb-4 text-green-700">
                        Muốn thử nghiệm ngay? Đặt hoa Sa Đéc chính gốc hôm nay để nhận miễn phí <strong>Gói dưỡng hoa Vitamin</strong> và <strong>Freeship</strong> cho đơn đầu tiên!
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Link href="/">Đặt Hoa Ngay</Link>
                    </Button>
                </div>

                <h3>3. Tỉa lá - "Đừng tham lá xanh"</h3>
                <p>
                    Tuyệt đối không để lá ngập trong nước. Lá ngâm nước sẽ thối rất nhanh, sinh vi khuẩn làm hỏng cả bình hoa. Hãy tuốt sạch lá ở phần thân ngập nước, chỉ giữ lại lá ở phần trên để quang hợp và làm đẹp.
                </p>

                <h3>4. Vị trí đặt bình - "Tránh nóng, tránh gió"</h3>
                <p>
                    Hoa tươi rất nhạy cảm. Đừng đặt bình hoa:
                    <ul>
                        <li>Trực tiếp dưới ánh nắng gắt</li>
                        <li>Ngay luồng gió máy lạnh hoặc quạt (hoa sẽ mất nước nhanh)</li>
                        <li>Gần đĩa trái cây chín (khí Ethylene từ trái cây làm hoa tàn nhanh)</li>
                    </ul>
                </p>

                <h3>5. Cấp cứu khi hoa héo</h3>
                <p>
                    Nếu thấy hoa hơi rũ xuống, hãy thử ngâm toàn bộ cành hoa vào nước ấm (khoảng 35-40 độ C) trong 5-10 phút, sau đó cắt bớt gốc và cắm lại vào nước mát. Hoa sẽ "tỉnh" lại bất ngờ đấy!
                </p>

                <hr className="my-8 border-stone-200" />

                <p className="text-stone-600">
                    Chăm hoa là một nghệ thuật, và cũng là cách để thiền và thư giãn. Hy vọng với những mẹo nhỏ từ làng hoa Sa Đéc, ngôi nhà của bạn sẽ luôn tràn ngập sắc hương.
                </p>

                <p className="font-bold">
                    Bạn có mẹo nào hay? Hãy chia sẻ với Sa Đéc Flower Hunt nhé!
                </p>
            </div>

            <div className="mt-12 pt-8 border-t border-stone-200">
                <h3 className="text-xl font-bold mb-6">Bài viết liên quan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="#" className="group">
                        <div className="bg-stone-50 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all">
                            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image src="https://images.unsplash.com/photo-1582794543139-8ac92a900275?q=80&w=200&fit=crop" alt="Làng hoa Sa Đéc" fill className="object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-800 group-hover:text-green-700 transition-colors mb-2">Làng hoa Sa Đéc - Di sản trăm năm</h4>
                                <p className="text-xs text-stone-500">2 ngày trước • 8 phút đọc</p>
                            </div>
                        </div>
                    </Link>
                    <Link href="#" className="group">
                        <div className="bg-stone-50 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all">
                            <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                                <Image src="https://images.unsplash.com/photo-1610336248679-b7c1969a538d?q=80&w=200&fit=crop" alt="Hoa Tết 2026" fill className="object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-stone-800 group-hover:text-green-700 transition-colors mb-2">Top 5 hoa Tết 2026 mang tài lộc</h4>
                                <p className="text-xs text-stone-500">1 ngày trước • 4 phút đọc</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </article>
    );
}
