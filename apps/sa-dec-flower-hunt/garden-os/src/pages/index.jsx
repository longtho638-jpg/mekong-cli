// ============================================================================
// GARDEN OS - HOME PAGE (Dashboard)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Button, Avatar, Spinner } from 'zmp-ui';
import { api } from 'zmp-sdk';
import { getOrCreateGarden, getGardenStats, subscribeToOrders } from '../lib/supabase';

const HomePage = () => {
    const [garden, setGarden] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        initializeGarden();
    }, []);

    const initializeGarden = async () => {
        try {
            // Get Zalo user info
            const { userInfo: zaloUser } = await api.getUserInfo({});
            setUserInfo(zaloUser);

            // Get or create garden
            const gardenData = await getOrCreateGarden(zaloUser.id, {
                name: zaloUser.name,
                phone: zaloUser.phone
            });
            setGarden(gardenData);

            // Get stats
            const statsData = await getGardenStats(gardenData.id);
            setStats(statsData);

            // Subscribe to new orders
            subscribeToOrders(gardenData.id, (payload) => {
                api.showToast({ message: '🎉 Có đơn hàng mới!' });
                // Refresh stats
                getGardenStats(gardenData.id).then(setStats);
            });

        } catch (error) {
            console.error('Init error:', error);
            api.showToast({ message: 'Lỗi kết nối' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Page className="flex items-center justify-center h-screen bg-green-50">
                <Spinner />
                <Text className="mt-4">Đang tải...</Text>
            </Page>
        );
    }

    return (
        <Page className="bg-gradient-to-b from-green-50 to-white min-h-screen">
            {/* Header */}
            <Box className="bg-gradient-to-r from-green-600 to-green-700 p-6 pb-12 rounded-b-3xl shadow-lg">
                <Box className="flex items-center gap-4">
                    <Avatar
                        src={userInfo?.avatar}
                        size={60}
                        className="border-4 border-white shadow-lg"
                    />
                    <Box>
                        <Text className="text-white/70 text-sm">Xin chào,</Text>
                        <Text className="text-white font-bold text-xl">{userInfo?.name || 'Nông Dân'}</Text>
                    </Box>
                </Box>
                <Box className="mt-4 bg-white/10 rounded-2xl p-4">
                    <Text className="text-white/80 text-sm">Vườn của bạn</Text>
                    <Text className="text-white font-bold text-lg">{garden?.name}</Text>
                    <Box className="flex items-center gap-2 mt-1">
                        <Box className={`w-2 h-2 rounded-full ${garden?.status === 'OPEN' ? 'bg-green-300' : 'bg-red-300'}`} />
                        <Text className="text-white/80 text-sm">
                            {garden?.status === 'OPEN' ? 'Đang hoạt động' : 'Tạm nghỉ'}
                        </Text>
                    </Box>
                </Box>
            </Box>

            {/* Stats Cards */}
            <Box className="px-4 -mt-6">
                <Box className="bg-white rounded-2xl shadow-xl p-4">
                    <Text className="text-stone-500 text-sm mb-4">Tổng quan hôm nay</Text>

                    <Box className="grid grid-cols-2 gap-4">
                        {/* Total Flowers */}
                        <Box className="bg-amber-50 rounded-xl p-4">
                            <Text className="text-3xl">🌸</Text>
                            <Text className="text-2xl font-bold text-amber-700 mt-2">
                                {stats?.totalFlowers?.toLocaleString() || 0}
                            </Text>
                            <Text className="text-amber-600 text-sm">Chậu hoa</Text>
                        </Box>

                        {/* Total Value */}
                        <Box className="bg-green-50 rounded-xl p-4">
                            <Text className="text-3xl">💰</Text>
                            <Text className="text-2xl font-bold text-green-700 mt-2">
                                {(stats?.totalValue / 1000000)?.toFixed(1) || 0}M
                            </Text>
                            <Text className="text-green-600 text-sm">Giá trị kho</Text>
                        </Box>

                        {/* Pending Orders */}
                        <Box className="bg-orange-50 rounded-xl p-4">
                            <Text className="text-3xl">📦</Text>
                            <Text className="text-2xl font-bold text-orange-700 mt-2">
                                {stats?.pendingOrders || 0}
                            </Text>
                            <Text className="text-orange-600 text-sm">Đơn chờ xử lý</Text>
                        </Box>

                        {/* Revenue */}
                        <Box className="bg-purple-50 rounded-xl p-4">
                            <Text className="text-3xl">📈</Text>
                            <Text className="text-2xl font-bold text-purple-700 mt-2">
                                {(stats?.totalRevenue / 1000000)?.toFixed(1) || 0}M
                            </Text>
                            <Text className="text-purple-600 text-sm">Doanh thu</Text>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Quick Actions */}
            <Box className="px-4 mt-6">
                <Text className="text-stone-700 font-bold mb-4">Thao tác nhanh</Text>

                <Box className="space-y-3">
                    <Button
                        fullWidth
                        size="large"
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-4"
                        onClick={() => window.location.href = '/inventory'}
                    >
                        📸 Quét AI - Cập nhật kho
                    </Button>

                    <Button
                        fullWidth
                        size="large"
                        variant="secondary"
                        className="border-2 border-green-500 text-green-700 rounded-xl py-4"
                        onClick={() => window.location.href = '/orders'}
                    >
                        📋 Xem đơn hàng ({stats?.pendingOrders || 0} chờ)
                    </Button>
                </Box>
            </Box>

            {/* AGRIOS Branding */}
            <Box className="text-center py-8">
                <Text className="text-stone-400 text-sm">Powered by</Text>
                <Text className="text-green-600 font-bold">AGRIOS 🌸</Text>
            </Box>
        </Page>
    );
};

export default HomePage;
