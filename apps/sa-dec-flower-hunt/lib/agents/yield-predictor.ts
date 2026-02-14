// ============================================================================
// YIELD PREDICTOR AGENT
// ============================================================================
// AI-powered demand forecasting and dynamic pricing for Sa Đéc flowers
// Based on: IPO Architect Blueprint - Section 3.3
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Types
interface DemandSignal {
    flowerType: string;
    checkInCount: number;
    viewCount: number;
    orderCount: number;
    searchCount: number;
}

interface SupplyData {
    flowerType: string;
    totalQuantity: number;
    gardenCount: number;
    avgPrice: number;
    lastUpdated: string;
}

interface PricingRecommendation {
    flowerType: string;
    currentPrice: number;
    recommendedPrice: number;
    priceChange: number; // percentage
    reason: string;
    confidence: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface FlashSaleCandidate {
    flowerType: string;
    gardenId: string;
    gardenName: string;
    quantity: number;
    originalPrice: number;
    salePrice: number;
    discount: number;
    expiresAt: Date;
    reason: string;
}

interface DemandForecast {
    flowerType: string;
    currentDemand: number;
    forecastedDemand: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
    trendStrength: number; // 0-100
    daysToTet: number;
    peakDate: string;
}

// Lazy Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
    if (!supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && key) {
            supabase = createClient(url, key);
        }
    }
    return supabase;
}

// ============================================================================
// YIELD PREDICTOR CLASS
// ============================================================================

export class YieldPredictor {

    // ----------------------------------------------------------------------------
    // DEMAND SENSING
    // ----------------------------------------------------------------------------

    /**
     * Analyze demand signals from user behavior
     * Sources: Check-ins, page views, orders, searches
     */
    async senseDemand(): Promise<DemandSignal[]> {
        const client = getSupabase();
        if (!client) return [];

        try {
            // Get order counts by flower type (last 7 days)
            const { data: orders } = await (client
                .from('order_items')
                .select('product_name, quantity')
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) as any);

            // Get inventory page views (if tracking exists)
            const { data: inventory } = await (client
                .from('inventory')
                .select('flower_type, flower_name, quantity') as any);

            // Aggregate demand signals
            const demandMap = new Map<string, DemandSignal>();

            // Count orders
            (orders as any)?.forEach((order: any) => {
                const key = (order as any).product_name;
                const existing = demandMap.get(key) || {
                    flowerType: key,
                    checkInCount: 0,
                    viewCount: 0,
                    orderCount: 0,
                    searchCount: 0
                };
                existing.orderCount += order.quantity || 1;
                demandMap.set(key, existing);
            });

            // Add inventory items even if no orders
            (inventory as any)?.forEach((item: any) => {
                const key = (item as any).flower_type;
                if (!demandMap.has(key)) {
                    demandMap.set(key, {
                        flowerType: item.flower_name || key,
                        checkInCount: Math.floor(Math.random() * 100), // Simulated from /hunt visits
                        viewCount: Math.floor(Math.random() * 500),
                        orderCount: 0,
                        searchCount: Math.floor(Math.random() * 50)
                    });
                }
            });

            return Array.from(demandMap.values());
        } catch (error) {
            console.error('Error sensing demand:', error);
            return [];
        }
    }

    // ----------------------------------------------------------------------------
    // SUPPLY ANALYSIS
    // ----------------------------------------------------------------------------

    /**
     * Aggregate supply data from all gardens
     */
    async analyzeSupply(): Promise<SupplyData[]> {
        const client = getSupabase();
        if (!client) return [];

        try {
            const { data: inventory } = await client
                .from('inventory')
                .select(`
          flower_type,
          flower_name,
          quantity,
          unit_price,
          garden_id
        `)
                .eq('is_available', true);

            if (!inventory) return [];

            // Aggregate by flower type
            const supplyMap = new Map<string, SupplyData>();

            (inventory as any).forEach((item: any) => {
                const key = (item as any).flower_type;
                const existing = supplyMap.get(key) || {
                    flowerType: item.flower_name || key,
                    totalQuantity: 0,
                    gardenCount: 0,
                    avgPrice: 0,
                    lastUpdated: new Date().toISOString()
                };

                existing.totalQuantity += item.quantity || 0;
                existing.gardenCount += 1;
                existing.avgPrice = (existing.avgPrice * (existing.gardenCount - 1) + (item.unit_price || 0)) / existing.gardenCount;

                supplyMap.set(key, existing);
            });

            return Array.from(supplyMap.values());
        } catch (error) {
            console.error('Error analyzing supply:', error);
            return [];
        }
    }

    // ----------------------------------------------------------------------------
    // DEMAND FORECASTING
    // ----------------------------------------------------------------------------

    /**
     * Forecast demand for upcoming period (especially Tet)
     */
    async forecastDemand(): Promise<DemandForecast[]> {
        const demandSignals = await this.senseDemand();
        const supplyData = await this.analyzeSupply();

        // Calculate days to Tet (Lunar New Year 2025: Jan 29)
        const tetDate = new Date('2025-01-29');
        const now = new Date();
        const daysToTet = Math.ceil((tetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Generate forecasts
        const forecasts: DemandForecast[] = [];

        // Tet flower demand multipliers
        const tetMultipliers: Record<string, number> = {
            'Cuc_Mam_Xoi': 3.5,  // Cúc mâm xôi - Top Tet flower
            'Mai_Vang': 4.0,     // Mai vàng - Premium Tet
            'Hong_Sa_Dec': 2.5,  // Hồng Sa Đéc
            'Van_Tho': 3.0,      // Vạn thọ
            'Cuc_Dai_Doa': 2.0,  // Cúc đại đóa
            'Lan_Ho_Diep': 2.5,  // Lan hồ điệp
        };

        for (const demand of demandSignals) {
            const supply = supplyData.find(s => s.flowerType === demand.flowerType);
            const multiplier = tetMultipliers[demand.flowerType] || 1.5;

            // Simple forecasting model
            const currentDemand = demand.orderCount + (demand.viewCount * 0.1) + (demand.searchCount * 0.2);

            // Scale up as Tet approaches
            const tetScaling = daysToTet <= 30 ? (30 - daysToTet) / 30 : 0;
            const forecastedDemand = currentDemand * multiplier * (1 + tetScaling);

            // Determine trend
            const supplyDemandRatio = supply ? supply.totalQuantity / Math.max(forecastedDemand, 1) : 1;
            let trend: 'UP' | 'DOWN' | 'STABLE';
            let trendStrength: number;

            if (supplyDemandRatio < 0.5) {
                trend = 'UP';
                trendStrength = 80;
            } else if (supplyDemandRatio > 2) {
                trend = 'DOWN';
                trendStrength = 60;
            } else {
                trend = 'STABLE';
                trendStrength = 40;
            }

            forecasts.push({
                flowerType: demand.flowerType,
                currentDemand: Math.round(currentDemand),
                forecastedDemand: Math.round(forecastedDemand),
                trend,
                trendStrength,
                daysToTet,
                peakDate: daysToTet <= 7 ? 'NOW' : tetDate.toISOString().split('T')[0]
            });
        }

        return forecasts;
    }

    // ----------------------------------------------------------------------------
    // DYNAMIC PRICING
    // ----------------------------------------------------------------------------

    /**
     * Generate pricing recommendations based on supply/demand
     */
    async generatePricingRecommendations(): Promise<PricingRecommendation[]> {
        const demandSignals = await this.senseDemand();
        const supplyData = await this.analyzeSupply();
        const forecasts = await this.forecastDemand();

        const recommendations: PricingRecommendation[] = [];

        for (const supply of supplyData) {
            const demand = demandSignals.find(d => d.flowerType === supply.flowerType);
            const forecast = forecasts.find(f => f.flowerType === supply.flowerType);

            if (!demand || !forecast) continue;

            const currentPrice = supply.avgPrice;
            let recommendedPrice = currentPrice;
            let priceChange = 0;
            let reason = '';
            let urgency: PricingRecommendation['urgency'] = 'LOW';

            // Calculate supply-demand ratio
            const ratio = supply.totalQuantity / Math.max(forecast.forecastedDemand, 1);

            if (ratio < 0.3) {
                // SCARCITY - Increase price
                priceChange = 15;
                reason = `🚀 Khan hiếm! Nhu cầu cao gấp ${(1 / ratio).toFixed(1)}x so với tồn kho. Đề xuất tăng giá.`;
                urgency = 'HIGH';
            } else if (ratio < 0.7) {
                // HEALTHY DEMAND
                priceChange = 5;
                reason = `📈 Nhu cầu tốt. Có thể tăng giá nhẹ để tối ưu lợi nhuận.`;
                urgency = 'MEDIUM';
            } else if (ratio > 2) {
                // OVERSUPPLY - Decrease price
                priceChange = -15;
                reason = `⚠️ Tồn kho cao! Đề xuất chạy Flash Sale để đẩy hàng trước ${forecast.daysToTet} ngày đến Tết.`;
                urgency = 'CRITICAL';
            } else if (ratio > 1.5) {
                // MILD OVERSUPPLY
                priceChange = -10;
                reason = `📦 Tồn kho hơi cao. Cân nhắc khuyến mãi nhẹ.`;
                urgency = 'MEDIUM';
            } else {
                // BALANCED
                priceChange = 0;
                reason = `✅ Cung cầu cân bằng. Giữ nguyên giá.`;
                urgency = 'LOW';
            }

            recommendedPrice = Math.round(currentPrice * (1 + priceChange / 100));

            recommendations.push({
                flowerType: supply.flowerType,
                currentPrice,
                recommendedPrice,
                priceChange,
                reason,
                confidence: 0.75 + (forecast.trendStrength / 400), // 75-100%
                urgency
            });
        }

        // Sort by urgency
        const urgencyOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    }

    // ----------------------------------------------------------------------------
    // FLASH SALE GENERATOR
    // ----------------------------------------------------------------------------

    /**
     * Identify candidates for "Giải cứu hoa" flash sales
     */
    async generateFlashSales(): Promise<FlashSaleCandidate[]> {
        const client = getSupabase();
        if (!client) return [];

        try {
            // Find gardens with high inventory
            const { data: inventory } = await client
                .from('inventory')
                .select(`
          id,
          flower_type,
          flower_name,
          quantity,
          unit_price,
          garden_id,
          gardens (
            id,
            name
          )
        `)
                .eq('is_available', true)
                .gte('quantity', 50); // High inventory threshold

            if (!inventory) return [];

            const forecasts = await this.forecastDemand();
            const flashSales: FlashSaleCandidate[] = [];

            for (const item of inventory as any[]) {
                const forecast = forecasts.find(f =>
                    f.flowerType === (item as any).flower_type || f.flowerType === (item as any).flower_name
                );

                // Determine discount based on inventory level and days to Tet
                let discount = 0;
                let reason = '';

                if (item.quantity >= 100) {
                    discount = 25;
                    reason = `🔥 Giải cứu ${item.flower_name}! Tồn kho ${item.quantity} chậu`;
                } else if (item.quantity >= 75) {
                    discount = 20;
                    reason = `💐 Flash Sale ${item.flower_name}!`;
                } else {
                    discount = 15;
                    reason = `✨ Ưu đãi đặc biệt ${item.flower_name}`;
                }

                // Adjust for days to Tet
                if (forecast && forecast.daysToTet < 14) {
                    discount += 5; // Extra urgency discount
                    reason += ` - Còn ${forecast.daysToTet} ngày đến Tết!`;
                }

                const originalPrice = item.unit_price || 100000;
                const salePrice = Math.round(originalPrice * (1 - discount / 100));

                flashSales.push({
                    flowerType: item.flower_name || item.flower_type,
                    gardenId: item.garden_id,
                    gardenName: (item.gardens as any)?.name || 'Vườn Sa Đéc',
                    quantity: item.quantity,
                    originalPrice,
                    salePrice,
                    discount,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                    reason
                });
            }

            // Sort by discount (highest first)
            return flashSales.sort((a, b) => b.discount - a.discount);
        } catch (error) {
            console.error('Error generating flash sales:', error);
            return [];
        }
    }

    // ----------------------------------------------------------------------------
    // MAIN RUNNER
    // ----------------------------------------------------------------------------

    /**
     * Run full yield prediction analysis
     */
    async runAnalysis() {
        console.log('🔮 Running Yield Predictor Analysis...');

        const [forecasts, recommendations, flashSales] = await Promise.all([
            this.forecastDemand(),
            this.generatePricingRecommendations(),
            this.generateFlashSales()
        ]);

        const summary = {
            timestamp: new Date().toISOString(),
            forecasts: {
                count: forecasts.length,
                uptrend: forecasts.filter(f => f.trend === 'UP').length,
                downtrend: forecasts.filter(f => f.trend === 'DOWN').length,
                items: forecasts
            },
            pricing: {
                count: recommendations.length,
                critical: recommendations.filter(r => r.urgency === 'CRITICAL').length,
                high: recommendations.filter(r => r.urgency === 'HIGH').length,
                items: recommendations
            },
            flashSales: {
                count: flashSales.length,
                totalDiscount: flashSales.reduce((sum, s) => sum + s.discount, 0) / flashSales.length,
                items: flashSales
            }
        };

        console.log('📊 Analysis complete:', JSON.stringify(summary, null, 2));
        return summary;
    }
}

// Export singleton
export const yieldPredictor = new YieldPredictor();

// Export runner function for API
export async function runYieldPredictor() {
    return await yieldPredictor.runAnalysis();
}
