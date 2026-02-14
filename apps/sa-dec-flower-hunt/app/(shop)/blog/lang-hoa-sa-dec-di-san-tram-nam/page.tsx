import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock, MapPin } from 'lucide-react';

export const metadata = {
    title: 'Làng hoa Sa Đéc - Di sản trăm năm bên dòng Sa Giang | Blog Hoa Sa Đéc',
    description: 'Khám phá lịch sử hơn 100 năm hình thành và phát triển của Làng hoa Sa Đéc, thủ phủ hoa kiểng của miền Tây Nam Bộ.',
};

export default function BlogPost() {
    return (
        <article className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
            <Link href="/blog" className="inline-flex items-center text-stone-500 hover:text-green-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại Blog
            </Link>

            <div className="space-y-4 mb-8">
                <Badge className="bg-orange-600 text-white hover:bg-orange-700">Câu Chuyện</Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-stone-900 leading-tight">
                    Làng hoa Sa Đéc - Di sản trăm năm bên dòng Sa Giang
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-stone-500 text-sm border-b border-stone-200 pb-8">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-stone-900">Tám Sài Gòn</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>05/12/2025</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>8 phút đọc</span>
                    </div>
                </div>
            </div>

            <div className="relative w-full aspect-[16/9] mb-12 rounded-2xl overflow-hidden shadow-lg">
                <Image
                    src="https://images.unsplash.com/photo-1582794543139-8ac92a900275?q=80&w=1200&auto=format&fit=crop"
                    alt="Làng hoa Sa Đéc mùa xuân"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            <div className="prose prose-stone prose-lg max-w-none">
                <p className="lead text-xl text-stone-600 mb-8 italic">
                    "Về Sa Đéc thấy đời vui như Tết,
                    Khắp nẻo đường hoa nở ngát hương thơm."
                </p>

                <p>
                    Bên dòng sông Tiền hiền hòa bồi đắp phù sa quanh năm, có một vùng đất được mệnh danh là thủ phủ hoa của miền Tây. Đó chính là **Làng hoa Sa Đéc** (thành phố Sa Đéc, tỉnh Đồng Tháp). Với lịch sử hơn 100 năm hình thành và phát triển, nơi đây không chỉ là vựa hoa lớn nhất Đồng bằng sông Cửu Long mà còn là điểm du lịch hấp dẫn mỗi độ xuân về.
                </p>

                <h3>Khởi nguồn từ những năm đầu thế kỷ 20</h3>
                <p>
                    Ít ai biết rằng, nghề trồng hoa ở Sa Đéc bắt nguồn từ một thú vui tao nhã. Vào những năm đầu thế kỷ 20, một số hộ gia đình ở làng Tân Quy Đông mang giống hoa từ nơi khác về trồng để trang trí ngày Tết. Nhờ thổ nhưỡng phù sa màu mỡ và khí hậu ôn hòa, hoa kiểng phát triển tươi tốt lạ thường.
                </p>
                <p>
                    Tiếng lành đồn xa, người dân bắt đầu nhân rộng mô hình. Từ vài hộ trồng hoa chơi Tết, dần dần hình thành nên một làng nghề sầm uất.
                </p>

                <h3>Nét độc đáo: "Trồng hoa trên giàn"</h3>
                <div className="relative w-full aspect-video my-8 rounded-xl overflow-hidden">
                    <Image
                        src="https://images.unsplash.com/photo-1558280417-ea782f829e93?q=80&w=1200&auto=format&fit=crop"
                        alt="Nông dân chèo xuồng chăm hoa"
                        fill
                        className="object-cover"
                    />
                </div>
                <p>
                    Khác với Đà Lạt trồng hoa trên đồi hay Hà Nội trồng hoa ngoài bãi, người Sa Đéc có một kỹ thuật canh tác độc nhất vô nhị: **Trồng hoa trên giàn cao**.
                </p>
                <p>
                    Do đặc thù vùng sông nước hay ngập lũ, người nông dân buộc phải đưa các chậu hoa lên giàn tre cao quá đầu người. Khi chăm sóc hoặc thu hoạch, họ phải chèo xuồng len lỏi giữa các luống hoa. Hình ảnh những chiếc xuồng ba lá trôi nhẹ giữa dòng hoa rực rỡ đã trở thành biểu tượng du lịch đặc trưng của Sa Đéc.
                </p>

                <h3>Sa Đéc ngày nay: Hội nhập và Phát triển</h3>
                <p>
                    Ngày nay, làng hoa Sa Đéc không chỉ dừng lại ở các giống hoa truyền thống như cúc mâm xôi, vạn thọ, hồng... mà còn du nhập và lai tạo thành công hàng trăm giống hoa mới từ nước ngoài.
                </p>
                <p>
                    Năm 2025-2026 đánh dấu bước chuyển mình mạnh mẽ của làng hoa với sự kết hợp của công nghệ. **Sa Đéc Flower Hunt** tự hào là dự án tiên phong đưa hoa Sa Đéc lên nền tảng số, giúp người yêu hoa khắp cả nước có thể đặt hàng trực tiếp từ nhà vườn chỉ với vài cú click chuột.
                </p>

                <div className="my-8 p-6 bg-orange-50 rounded-xl border border-orange-100 flex items-center gap-4">
                    <MapPin className="w-8 h-8 text-orange-600 flex-shrink-0" />
                    <div>
                        <h4 className="text-orange-800 font-bold mb-1">Bạn muốn ghé thăm Làng hoa?</h4>
                        <p className="mb-0 text-stone-600 text-sm">
                            Làng hoa đẹp nhất vào tháng Chạp (tháng 12 Âm lịch). Đừng quên check-in và quét mã AR để nhận quà từ chúng mình nhé!
                        </p>
                    </div>
                </div>

                <h3>Lời kết</h3>
                <p>
                    Trăm năm trôi qua, người Sa Đéc vẫn giữ trọn tình yêu với đất, với hoa. Mỗi chậu hoa gửi đi không chỉ là hàng hóa, mà là cả tấm lòng hào sảng, chất phác của người miền Tây.
                </p>
            </div>

            <div className="mt-12 text-center">
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 py-6 text-lg shadow-xl">
                    <Link href="/">Đặt Mua Hoa Sa Đéc Chính Gốc</Link>
                </Button>
            </div>
        </article>
    );
}
