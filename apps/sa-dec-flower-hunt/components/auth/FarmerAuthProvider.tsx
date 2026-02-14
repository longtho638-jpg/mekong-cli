"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FarmerProfile {
    id: string;
    farmerName: string;
    avatar: string;
    role: string;
    email: string;
    location?: string;
    phone?: string;
}

interface FarmerContextType {
    profile: FarmerProfile;
    isLoading: boolean;
    totalRevenue: number;
    pendingOrders: number;
    dailyRevenue: { day: string; val: number }[];
    balance: number;
    withdraw: (amount: number) => Promise<boolean>;
    signOut: () => Promise<void>;
}

const FarmerContext = createContext<FarmerContextType | undefined>(undefined);

export function FarmerAuthProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<FarmerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [dailyRevenue, setDailyRevenue] = useState<{ day: string; val: number }[]>([]);
    const [pendingOrders, setPendingOrders] = useState(0);
    const router = useRouter();

    useEffect(() => {
        let subscription: any;

        const checkAuth = async () => {
            try {
                // 1. Check Session
                if (!supabase) return;
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    setIsLoading(false);
                    return;
                }

                const userId = session.user.id;
                const email = session.user.email || "";

                // 2. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError || !profileData) {
                    console.error("Profile error:", profileError);
                    toast.error("Không tìm thấy hồ sơ nông dân");
                    return;
                }

                if (profileData.role !== 'farmer' && profileData.role !== 'admin') {
                    toast.error("Tài khoản này không phải là Nông Dân");
                    return;
                }

                setProfile({
                    id: profileData.id,
                    farmerName: profileData.full_name,
                    avatar: profileData.avatar_url || "https://github.com/shadcn.png",
                    role: profileData.role,
                    email: email,
                    location: profileData.location || "Sa Đéc, Đồng Tháp",
                    phone: profileData.phone || "09xxxxxxxxx"
                });

                // 3. Fetch Initial Metrics
                await fetchMetrics(userId);

                // 4. Setup Realtime Subscription
                const channel = supabase
                    .channel('farmer-dashboard')
                    .on(
                        'postgres_changes',
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'order_items',
                            filter: `seller_id=eq.${userId}`
                        },
                        (payload: any) => {
                            console.log('New Order Item!', payload);
                            // WOW Effect: Sound & Toast
                            const audio = new Audio('/sounds/coins.mp3');
                            audio.play().catch(() => { });
                            toast.success("🔔 Ting ting! Có đơn hàng mới!");

                            // Refresh metrics
                            fetchMetrics(userId);
                        }
                    )
                    .subscribe();

                subscription = channel;

            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchMetrics = async (userId: string) => {
            if (!supabase) return;
            // A. Pending Orders (items)
            const { count } = await supabase
                .from('order_items')
                .select('*', { count: 'exact', head: true })
                .eq('seller_id', userId);

            setPendingOrders(count || 0);

            // B. Revenue & Chart Data
            // We need created_at from orders table.
            const { data: sales } = await supabase
                .from('order_items')
                .select(`
                    price_at_purchase,
                    quantity,
                    orders ( created_at )
                `)
                .eq('seller_id', userId);

            if (sales) {
                // Calc Total
                const total = sales.reduce((acc: number, item: any) => acc + (item.price_at_purchase * item.quantity), 0);
                setTotalRevenue(total);

                // Calc Daily Stats (Last 7 Days)
                const daysMap: Record<string, number> = {};
                const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

                sales.forEach((item: any) => {
                    if (!item.orders?.created_at) return;
                    const date = new Date(item.orders.created_at);
                    const dayName = days[date.getDay()];
                    const amount = item.price_at_purchase * item.quantity;

                    daysMap[dayName] = (daysMap[dayName] || 0) + amount;
                });

                const chartData = days.map(day => ({
                    day,
                    val: daysMap[day] || 0
                }));
                // Simple shift to match current week if needed, but standard week view is fine
                setDailyRevenue(chartData);
            }
        };

        checkAuth();

        // Listen for auth changes
        if (!supabase) return;
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
            if (event === 'SIGNED_OUT') {
                setProfile(null);
                if (subscription) supabase?.removeChannel(subscription);
                router.push('/');
            } else if (event === 'SIGNED_IN') {
                checkAuth(); // Re-init
            }
        });

        return () => {
            authSub.unsubscribe();
            if (subscription) supabase?.removeChannel(subscription);
        };
    }, [router]);

    const signOut = async () => {
        if (supabase) await supabase.auth.signOut();
        router.push('/');
    };

    // Mock Balance (Available to withdraw) - in real app, this would be from DB
    const balance = totalRevenue * 0.8; // Assume 80% is available

    const withdraw = async (amount: number): Promise<boolean> => {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        return amount <= balance;
    };

    const value = {
        profile: profile || { id: "", farmerName: "Khách", avatar: "", role: "guest", email: "" },
        isLoading,
        totalRevenue,
        pendingOrders,
        dailyRevenue,
        balance,
        withdraw,
        signOut
    };

    return (
        <FarmerContext.Provider value={value}>
            {children}
        </FarmerContext.Provider>
    );
}

export const useFarmer = () => {
    const context = useContext(FarmerContext);
    if (context === undefined) {
        throw new Error("useFarmer must be used within a FarmerAuthProvider");
    }
    return context;
};
