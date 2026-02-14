// ============================================================================
// GARDEN OS - INVENTORY PAGE (AI Vision Scanner)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Page, Box, Text, Button, Input, Select, useSnackbar, Spinner } from 'zmp-ui';
import { api } from 'zmp-sdk';
import { getOrCreateGarden, getInventory, updateInventory } from '../lib/supabase';

// Flower types
const FLOWER_TYPES = [
    { value: 'Cuc_Mam_Xoi', label: '🌼 Cúc Mâm Xôi', price: 150000 },
    { value: 'Hong_Sa_Dec', label: '🌹 Hồng Sa Đéc', price: 80000 },
    { value: 'Mai_Vang', label: '🌸 Mai Vàng', price: 500000 },
    { value: 'Van_Tho', label: '🌻 Vạn Thọ', price: 50000 },
    { value: 'Cuc_Dai_Doa', label: '💐 Cúc Đại Đóa', price: 120000 },
    { value: 'Lan_Ho_Diep', label: '🪻 Lan Hồ Điệp', price: 350000 },
];

const InventoryPage = () => {
    const [garden, setGarden] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [selectedFlower, setSelectedFlower] = useState('Cuc_Mam_Xoi');
    const [manualQuantity, setManualQuantity] = useState('');
    const { openSnackbar } = useSnackbar();

    useEffect(() => {
        initializeInventory();
    }, []);

    const initializeInventory = async () => {
        try {
            const { userInfo } = await api.getUserInfo({});
            const gardenData = await getOrCreateGarden(userInfo.id, userInfo);
            setGarden(gardenData);

            const inventoryData = await getInventory(gardenData.id);
            setInventory(inventoryData);
        } catch (error) {
            console.error('Init error:', error);
            openSnackbar({ text: 'Lỗi tải dữ liệu', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // AI Vision Scanner (MVP - Mock)
    const handleAIScan = async () => {
        try {
            // 1. Open camera
            const { filePaths } = await api.chooseImage({
                count: 1,
                sourceType: ['camera']
            });

            setScanning(true);
            openSnackbar({ text: '🤖 AI đang phân tích ảnh...', type: 'default' });

            // 2. MOCK AI VISION (MVP)
            // TODO: Replace with real AI Vision API endpoint
            await new Promise(resolve => setTimeout(resolve, 2000));

            const aiResult = {
                flowerType: selectedFlower,
                quantity: Math.floor(Math.random() * (100 - 30) + 30),
                confidence: 0.85 + Math.random() * 0.14, // 85-99%
                imageUrl: filePaths?.[0] || null
            };

            setScanResult(aiResult);
            setManualQuantity(aiResult.quantity.toString());

            openSnackbar({
                text: `✅ AI phát hiện ${aiResult.quantity} chậu (${(aiResult.confidence * 100).toFixed(0)}% tin cậy)`,
                type: 'success'
            });

        } catch (error) {
            console.error('Scan error:', error);
            openSnackbar({ text: 'Lỗi mở camera', type: 'error' });
        } finally {
            setScanning(false);
        }
    };

    // Sync to Supabase (Hunter Guide will see this!)
    const handleSync = async () => {
        if (!garden || !manualQuantity) {
            openSnackbar({ text: 'Vui lòng nhập số lượng', type: 'warning' });
            return;
        }

        try {
            setLoading(true);

            const flower = FLOWER_TYPES.find(f => f.value === selectedFlower);

            await updateInventory(garden.id, selectedFlower, parseInt(manualQuantity), {
                flowerName: flower?.label?.replace(/^[\s\S]+ /, ''), // Remove emoji
                unitPrice: flower?.price,
                aiConfidence: scanResult?.confidence || 1.0,
                scanImage: scanResult?.imageUrl
            });

            openSnackbar({
                text: '✅ Đã cập nhật lên Sàn AGRIOS!',
                type: 'success'
            });

            // Refresh inventory
            const updated = await getInventory(garden.id);
            setInventory(updated);

            // Reset form
            setScanResult(null);
            setManualQuantity('');

        } catch (error) {
            console.error('Sync error:', error);
            openSnackbar({ text: 'Lỗi đồng bộ', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !inventory.length) {
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
                <Text className="text-white font-bold text-xl">📸 Quét Kho Hoa AI</Text>
                <Text className="text-white/80 text-sm mt-1">
                    Chụp ảnh để AI tự động đếm số chậu
                </Text>
            </Box>

            {/* AI Scanner */}
            <Box className="px-4 -mt-4">
                <Box className="bg-white rounded-2xl shadow-xl p-5">
                    {/* Flower Type Selector */}
                    <Box className="mb-4">
                        <Text className="text-stone-600 text-sm mb-2">Loại hoa đang quét:</Text>
                        <Select
                            value={selectedFlower}
                            onChange={(value) => setSelectedFlower(value)}
                            placeholder="Chọn loại hoa"
                        >
                            {FLOWER_TYPES.map(flower => (
                                <Select.Option
                                    key={flower.value}
                                    value={flower.value}
                                    title={flower.label}
                                />
                            ))}
                        </Select>
                    </Box>

                    {/* Camera Preview */}
                    <Box className="border-2 border-dashed border-green-300 rounded-xl h-48 flex items-center justify-center bg-green-50 mb-4 overflow-hidden">
                        {scanning ? (
                            <Box className="text-center">
                                <Spinner />
                                <Text className="text-green-600 mt-2">AI đang phân tích...</Text>
                            </Box>
                        ) : scanResult ? (
                            <Box className="text-center">
                                <Text className="text-4xl mb-2">✅</Text>
                                <Text className="text-green-700 font-bold">
                                    Phát hiện: {scanResult.quantity} chậu
                                </Text>
                                <Text className="text-green-600 text-sm">
                                    Tin cậy: {(scanResult.confidence * 100).toFixed(0)}%
                                </Text>
                            </Box>
                        ) : (
                            <Box className="text-center">
                                <Text className="text-4xl mb-2">📷</Text>
                                <Text className="text-stone-400">Nhấn nút bên dưới để quét</Text>
                            </Box>
                        )}
                    </Box>

                    {/* Scan Button */}
                    <Button
                        fullWidth
                        size="large"
                        loading={scanning}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl"
                        onClick={handleAIScan}
                    >
                        📸 {scanning ? 'Đang quét...' : 'Mở Camera AI'}
                    </Button>

                    {/* Manual Adjustment */}
                    {(scanResult || true) && (
                        <Box className="mt-6 pt-4 border-t border-stone-100">
                            <Text className="text-stone-600 text-sm mb-2">
                                Điều chỉnh số lượng (nếu AI sai):
                            </Text>
                            <Box className="flex gap-3">
                                <Input
                                    type="number"
                                    placeholder="Số chậu"
                                    value={manualQuantity}
                                    onChange={(e) => setManualQuantity(e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    className="bg-green-600 text-white px-6"
                                    onClick={handleSync}
                                    loading={loading}
                                >
                                    Đồng bộ
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Current Inventory */}
            <Box className="px-4 mt-6">
                <Text className="text-stone-700 font-bold mb-4">Kho hoa hiện tại</Text>

                {inventory.length === 0 ? (
                    <Box className="bg-stone-50 rounded-xl p-6 text-center">
                        <Text className="text-4xl mb-2">📦</Text>
                        <Text className="text-stone-500">Chưa có dữ liệu kho</Text>
                        <Text className="text-stone-400 text-sm">Quét ảnh để bắt đầu</Text>
                    </Box>
                ) : (
                    <Box className="space-y-3">
                        {inventory.map(item => {
                            const flower = FLOWER_TYPES.find(f => f.value === item.flower_type);
                            return (
                                <Box
                                    key={item.id}
                                    className="bg-white rounded-xl p-4 shadow flex items-center justify-between"
                                >
                                    <Box className="flex items-center gap-3">
                                        <Text className="text-2xl">{flower?.label?.split(' ')[0] || '🌸'}</Text>
                                        <Box>
                                            <Text className="font-bold text-stone-800">
                                                {item.flower_name || item.flower_type}
                                            </Text>
                                            <Text className="text-stone-500 text-sm">
                                                {item.unit_price?.toLocaleString()}đ/chậu
                                            </Text>
                                        </Box>
                                    </Box>
                                    <Box className="text-right">
                                        <Text className="text-xl font-bold text-green-600">
                                            {item.quantity}
                                        </Text>
                                        <Text className="text-stone-400 text-xs">chậu</Text>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Page>
    );
};

export default InventoryPage;
