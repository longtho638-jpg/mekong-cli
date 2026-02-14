import { toast } from "sonner";

type NotificationType = "cart_abandoned" | "price_drop" | "leaderboard_drop" | "order_update";

interface NotificationPayload {
    title: string;
    body: string;
    actionLabel?: string;
    actionUrl?: string;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, (data?: any) => NotificationPayload> = {
    cart_abandoned: (data) => ({
        title: "Giỏ hàng đang nhớ bạn! 🛒",
        body: `Bạn ơi, mấy chậu ${data?.flowerName || "hoa"} đang chờ được về nhà mới nè!`,
        actionLabel: "Xem giỏ hàng",
        actionUrl: "/cart"
    }),
    price_drop: (data) => ({
        title: "Giá giảm sốc! ⚡️",
        body: `Tin vui! ${data?.flowerName} vừa giảm giá 20% chỉ trong hôm nay.`,
        actionLabel: "Mua ngay",
        actionUrl: `/flower/${data?.flowerId}`
    }),
    leaderboard_drop: (data) => ({
        title: "Cảnh báo rớt hạng! 📉",
        body: "Ái chà! Có người vừa vượt qua bạn trên BXH. Quét thêm mã QR để giành lại top 1 nha!",
        actionLabel: "Xem BXH",
        actionUrl: "/leaderboard"
    }),
    order_update: (data) => ({
        title: "Đơn hàng cập nhật 🚛",
        body: `Đơn hàng #${data?.orderId} của bạn đang trên đường vận chuyển!`,
        actionLabel: "Theo dõi",
        actionUrl: "/orders"
    })
};

export const sendNotification = (type: NotificationType, data?: any) => {
    const template = NOTIFICATION_TEMPLATES[type](data);

    // In a real app, this would use the Web Push API or Firebase FCM
    // For now, we simulate it with a rich Toast notification

    // Play sound (optional)
    const audio = new Audio('/notification.mp3'); // Mock path, won't play if missing
    audio.play().catch(() => { });

    toast(template.title, {
        description: template.body,
        action: template.actionLabel ? {
            label: template.actionLabel,
            onClick: () => {
                if (template.actionUrl) window.location.href = template.actionUrl;
            }
        } : undefined,
        duration: 8000,
        position: "top-right",
    });

    console.log(`[Smart Push] Sent to user:`, template);
};

// Simulation helper to demonstrate WOW factor
export const simulateSmartNotifications = () => {
    setTimeout(() => {
        sendNotification("cart_abandoned", { flowerName: "Cúc Mâm Xôi" });
    }, 5000);

    setTimeout(() => {
        sendNotification("leaderboard_drop");
    }, 15000);
};
