"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { Sparkles, Gift } from "lucide-react";
import { toast } from "sonner";

interface MoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MoneyModal({ isOpen, onClose, onSuccess }: MoneyModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    wholesale: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Track Lead
      // 1. Track Lead
      trackEvent("lead_capture", { action: "lead_form_submit", category: "acquisition", ...formData });

      // 2. Save to Supabase
      if (!supabase) return;
      const { error } = await supabase.from("leads").insert([
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          is_wholesale: formData.wholesale,
          source: "money_modal_v1",
        },
      ]);

      if (error) throw error;

      // 3. Success Effects
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#fbbf24', '#ffffff']
      });

      toast.success("🧧 Chúc mừng! Bạn đã nhận ưu đãi thành công!");

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error("Lead capture error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-red-100 shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-red-100 p-3 rounded-full mb-2 w-fit">
            <Gift className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-red-600">
            Nhận Lì Xì Đầu Năm!
          </DialogTitle>
          <DialogDescription className="text-center text-stone-600">
            Để lại thông tin để nhận ngay voucher <span className="font-bold text-red-600">giảm 50%</span> và báo giá sỉ mới nhất 2026.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên của bạn</Label>
            <Input
              id="name"
              required
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại (Zalo)</Label>
            <Input
              id="phone"
              required
              type="tel"
              placeholder="0912..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Tùy chọn)</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="wholesale"
              className="h-4 w-4 rounded border-stone-300 text-red-600 focus:ring-red-500"
              checked={formData.wholesale}
              onChange={(e) => setFormData({ ...formData, wholesale: e.target.checked })}
            />
            <Label htmlFor="wholesale" className="text-sm font-normal cursor-pointer">
              Gửi tôi báo giá sỉ & catalogue hoa 2026
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold h-12 text-lg shadow-lg"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "🧧 NHẬN ƯU ĐÃI NGAY"}
          </Button>

          <p className="text-xs text-center text-stone-400 mt-2">
            *Thông tin của bạn được bảo mật tuyệt đối.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
