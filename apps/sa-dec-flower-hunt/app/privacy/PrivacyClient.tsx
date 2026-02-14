"use client";

import Link from 'next/link'
import { withI18n, WithI18nProps } from "@/lib/withI18n";

function PrivacyPage({ texts }: WithI18nProps) {
    return (
        <div className="min-h-screen bg-stone-950 py-20 px-6 relative font-sans">
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_landing_hyperreal_1765367547331.png" className="w-full h-full object-cover opacity-10" />
                <div className="absolute inset-0 bg-stone-950/90" />
            </div>
            <div className="max-w-3xl mx-auto relative z-10">
                <Link href="/" className="text-emerald-400 hover:text-emerald-300 mb-8 inline-block">
                    ← {texts["back"]}
                </Link>

                <h1 className="text-4xl font-bold text-white mb-8">{texts["title"]}</h1>
                <p className="text-stone-400 mb-8">{texts["updated"]}</p>

                <div className="prose prose-invert prose-emerald max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec1.title"]}</h2>
                        <p className="text-stone-300 mb-4">
                            {texts["sec1.desc"]}
                        </p>
                        <ul className="list-disc pl-6 text-stone-300 space-y-2">
                            <li><strong>Thông tin cơ bản:</strong> Họ tên, email, số điện thoại</li>
                            <li><strong>Địa chỉ giao hàng:</strong> Để phục vụ đơn hàng</li>
                            <li><strong>Thanh toán:</strong> Xử lý qua đối tác bảo mật (PayOS, VNPay)</li>
                            <li><strong>📍 GPS/Vị trí:</strong> Tìm vườn hoa gần bạn, điều hướng lễ hội (chỉ khi được phép)</li>
                            <li><strong>📷 Camera:</strong> Quét QR check-in, AI nhận diện hoa (Garden OS - chỉ khi được phép)</li>
                            <li><strong>📱 Số điện thoại:</strong> Xác thực OTP, thông báo đơn hàng</li>
                            <li>TikTok/Zalo: Thông tin cơ bản nếu bạn liên kết tài khoản</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec2.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec2.desc"]}
                        </p>
                        <ul className="list-disc pl-6 text-stone-300 space-y-2">
                            <li>Process and deliver your orders</li>
                            <li>Communicate about your orders</li>
                            <li>Improve our services</li>
                            <li>Post content to TikTok on your behalf (with your permission)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec3.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec3.desc"]}
                        </p>
                        <ul className="list-disc pl-6 text-stone-300 space-y-2">
                            <li>Access your basic profile information</li>
                            <li>Post videos or photos to your TikTok account (only with explicit consent)</li>
                            <li>View your TikTok privacy settings</li>
                        </ul>
                        <p className="text-stone-300 mt-4">
                            You can revoke TikTok access at any time through your TikTok account settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec4.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec4.desc"]}
                        </p>
                        <ul className="list-disc pl-6 text-stone-300 space-y-2">
                            <li>Delivery partners (to fulfill orders)</li>
                            <li>Payment processors (to process transactions)</li>
                            <li>TikTok (for social media integration)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec5.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec5.desc"]}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec6.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec6.desc"]}
                        </p>
                        <ul className="list-disc pl-6 text-stone-300 space-y-2">
                            <li>Access your personal data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of marketing communications</li>
                            <li>Disconnect social media accounts</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">{texts["sec7.title"]}</h2>
                        <p className="text-stone-300">
                            {texts["sec7.desc"]}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default withI18n(PrivacyPage, "privacy");
