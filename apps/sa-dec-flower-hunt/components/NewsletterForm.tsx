"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Send, Mail } from 'lucide-react';

export default function NewsletterForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error('Subscription failed');

            toast.success('Đã đăng ký thành công! Hãy kiểm tra email để nhận mã giảm giá.');
            setEmail('');
        } catch (error) {
            toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-green-800 text-white rounded-2xl p-8 my-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-green-700 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-green-600 rounded-full opacity-50 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-700 rounded-lg">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold">Đăng ký thành viên</h3>
                    </div>
                    <p className="text-green-100">
                        Nhận ngay <strong>mã giảm giá 10%</strong> cho đơn hàng đầu tiên và cập nhật mẹo chăm sóc hoa hàng tuần.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 w-full max-w-sm flex gap-2">
                    <Input
                        type="email"
                        placeholder="Email của bạn..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-green-700/50 border-green-600 text-white placeholder:text-green-300 focus:ring-green-400"
                        required
                    />
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-white text-green-900 hover:bg-green-100 font-bold"
                    >
                        {loading ? '...' : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
