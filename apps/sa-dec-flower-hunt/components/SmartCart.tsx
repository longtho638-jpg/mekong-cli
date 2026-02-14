"use client";

import { useCartStore } from "@/lib/cartStore";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, X, Minus, Plus, Zap } from "lucide-react";
import { formatPrice } from "@/data/flowers";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { processCheckout } from "@/lib/api/checkout";

export const SmartCart = () => {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);



  const handleOneClickCheckout = async () => {
    setIsCheckingOut(true);

    try {
      const orderId = await processCheckout(items, getTotal());

      toast.success("Đặt hàng thành công! 🌸", {
        description: `Mã đơn: ${orderId}. Chúng tôi sẽ liên hệ trong 30 phút.`,
        duration: 5000,
      });

      // Clear cart on success
      useCartStore.getState().clearCart();
      setIsOpen(false);

    } catch (error: any) {
      toast.error("Lỗi đặt hàng", {
        description: error.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };


  if (items.length === 0) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            size="lg"
            className="rounded-full h-16 w-16 bg-gradient-to-r from-red-600 to-rose-600 shadow-xl hover:shadow-2xl border-4 border-white flex flex-col items-center justify-center p-0 gap-0"
          >
            <ShoppingBag className="w-6 h-6 text-white" />
            <span className="text-[10px] font-bold text-white leading-none mt-1">
              {items.length} món
            </span>
          </Button>
        </motion.div>
      </SheetTrigger>

      <SheetContent className="flex flex-col h-full sm:max-w-md w-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex justify-between items-center text-xl font-bold">
            Giỏ Hàng ({items.length})
            <span className="text-red-600">{formatPrice(getTotal())}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-4 px-4 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-4 p-3 bg-stone-50 rounded-xl"
              >
                <div className="h-20 w-20 rounded-lg overflow-hidden bg-white shrink-0 relative">
                  <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-stone-900 line-clamp-2 text-sm">{item.name}</h4>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-400 hover:text-red-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <span className="font-bold text-stone-900">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-3 bg-white rounded-full border px-2 py-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-sm text-amber-800">
            <Zap className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Đặt trong <span className="font-bold">15 phút</span> tới để được giao hàng nhanh miễn phí!</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-stone-500">
              <span>Tạm tính</span>
              <span>{formatPrice(getTotal())}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Phí ship</span>
              <span className="text-green-600 font-medium">Miễn phí</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Tổng cộng</span>
              <span className="text-red-600">{formatPrice(getTotal())}</span>
            </div>
          </div>

          <Button
            onClick={handleOneClickCheckout}
            disabled={isCheckingOut}
            className="w-full h-14 rounded-xl text-lg font-bold bg-stone-900 hover:bg-stone-800 shadow-xl active:scale-95 transition-all"
          >
            {isCheckingOut ? (
              <motion.div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </motion.div>
            ) : (
              "MUA NGAY (1-CLICK)"
            )}
          </Button>
          <p className="text-xs text-center text-stone-400">
            Thanh toán khi nhận hàng • Hoàn trả miễn phí
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
