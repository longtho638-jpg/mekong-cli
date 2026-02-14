// ============================================================================
// GARDEN OS - ORDERS PAGE
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Button, Tabs, useSnackbar, Spinner } from 'zmp-ui';
import { api } from 'zmp-sdk';
import { getOrCreateGarden, getGardenOrders, supabase } from '../lib/supabase';

const OrdersPage = () => {
    const [garden, setGarden] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const { openSnackbar } = useSnackbar();

    useEffect(() => {
        initializeOrders();
    }, []);

    const initializeOrders = async () => {
        try {
            const { userInfo } = await api.getUserInfo({});
            const gardenData = await getOrCreateGarden(userInfo.id, userInfo);
            setGarden(gardenData);

            const ordersData = await getGardenOrders(gardenData.id);
            setOrders(ordersData);
        } catch (error) {
            console.error('Init error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            openSnackbar({
                text: newStatus === 'confirmed' ? '✅ Đã xác nhận đơn hàng!' : '📦 Đang giao hàng!',
                type: 'success'
            });

            // Refresh orders
            const updated = await getGardenOrders(garden.id);
            setOrders(updated);

        } catch (error) {
            console.error('Update error:', error);
            openSnackbar({ text: 'Lỗi cập nhật', type: 'error' });
        }
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'pending') return order.status === 'pending';
        if (activeTab === 'confirmed') return order.status === 'confirmed' || order.status === 'shipping';
        return order.status === 'completed';
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'shipping': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-stone-100 text-stone-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'shipping': return 'Đang giao';
            case 'completed': return 'Hoàn thành';
            default: return status;
        }
    };

    if (loading) {
        return (
            <Page className="flex items-center justify-center h-screen bg-green-50">
                <Spinner />
            </Page>
        );
    }

    return (
        <Page className="bg-gradient-to-b from-green-50 to-white min-h-screen pb-24">
            {/* Header */}
            <Box className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-b-3xl">
                <Text className="text-white font-bold text-xl">📋 Đơn Hàng</Text>
                <Text className="text-white/80 text-sm mt-1">
                    Quản lý đơn hàng từ khách
                </Text>
            </Box>

            {/* Tabs */}
            <Box className="px-4 mt-4">
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    <Tabs.Tab key="pending" label={`Chờ (${orders.filter(o => o.status === 'pending').length})`} />
                    <Tabs.Tab key="confirmed" label={`Đang xử lý (${orders.filter(o => ['confirmed', 'shipping'].includes(o.status)).length})`} />
                    <Tabs.Tab key="completed" label="Hoàn thành" />
                </Tabs>
            </Box>

            {/* Orders List */}
            <Box className="px-4 mt-4">
                {filteredOrders.length === 0 ? (
                    <Box className="bg-white rounded-xl p-8 text-center shadow">
                        <Text className="text-4xl mb-2">📭</Text>
                        <Text className="text-stone-500">Không có đơn hàng nào</Text>
                    </Box>
                ) : (
                    <Box className="space-y-4">
                        {filteredOrders.map(order => (
                            <Box
                                key={order.id}
                                className="bg-white rounded-xl p-4 shadow"
                            >
                                {/* Order Header */}
                                <Box className="flex justify-between items-start mb-3">
                                    <Box>
                                        <Text className="font-bold text-stone-800">
                                            Đơn #{order.id.slice(0, 8).toUpperCase()}
                                        </Text>
                                        <Text className="text-stone-500 text-sm">
                                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </Box>
                                    <Box className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </Box>
                                </Box>

                                {/* Customer Info */}
                                <Box className="bg-stone-50 rounded-lg p-3 mb-3">
                                    <Box className="flex items-center gap-2">
                                        <Text>👤</Text>
                                        <Text className="text-stone-700 font-medium">
                                            {order.profiles?.full_name || 'Khách hàng'}
                                        </Text>
                                    </Box>
                                    {order.profiles?.phone && (
                                        <Box className="flex items-center gap-2 mt-1">
                                            <Text>📞</Text>
                                            <Text className="text-stone-600 text-sm">{order.profiles.phone}</Text>
                                        </Box>
                                    )}
                                </Box>

                                {/* Order Items */}
                                {order.order_items?.length > 0 && (
                                    <Box className="mb-3">
                                        {order.order_items.map((item, idx) => (
                                            <Box key={idx} className="flex justify-between text-sm py-1">
                                                <Text className="text-stone-600">
                                                    {item.product_name || 'Sản phẩm'} x{item.quantity}
                                                </Text>
                                                <Text className="text-stone-800 font-medium">
                                                    {item.subtotal?.toLocaleString()}đ
                                                </Text>
                                            </Box>
                                        ))}
                                    </Box>
                                )}

                                {/* Total */}
                                <Box className="flex justify-between items-center pt-3 border-t border-stone-100">
                                    <Text className="text-stone-600">Tổng tiền:</Text>
                                    <Text className="text-xl font-bold text-green-600">
                                        {order.total_amount?.toLocaleString()}đ
                                    </Text>
                                </Box>

                                {/* Actions */}
                                {order.status === 'pending' && (
                                    <Box className="flex gap-3 mt-4">
                                        <Button
                                            fullWidth
                                            className="bg-green-600 text-white"
                                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                        >
                                            ✅ Xác nhận
                                        </Button>
                                    </Box>
                                )}

                                {order.status === 'confirmed' && (
                                    <Box className="flex gap-3 mt-4">
                                        <Button
                                            fullWidth
                                            className="bg-purple-600 text-white"
                                            onClick={() => updateOrderStatus(order.id, 'shipping')}
                                        >
                                            🚚 Bắt đầu giao
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Page>
    );
};

export default OrdersPage;
