/* eslint-disable @typescript-eslint/no-unused-vars, no-unused-vars */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAnalytics } from './useAnalytics';

/**
 * 📈 Sales Forecasting Hook
 * 
 * Inspired by ERPNext CRM Sales Analytics
 * Predicts revenue based on historical data and pipeline
 */

export interface ForecastData {
    month: string;
    actual: number;
    predicted: number;
    confidence: number;
}

export interface PipelineStage {
    name: string;
    value: number;
    probability: number;
    weightedValue: number;
    count: number;
}

export interface SalesForecast {
    totalPipeline: number;
    weightedPipeline: number;
    expectedRevenue: number;
    monthlyForecast: ForecastData[];
    pipelineByStage: PipelineStage[];
    winRate: number;
    avgDealSize: number;
    avgSalesCycle: number; // days
}

export function useSalesForecast() {
    const { analytics, loading: analyticsLoading } = useAnalytics();
    const [forecastMonths, setForecastMonths] = useState(6);

    // Calculate forecast based on historical data
    const forecast = useMemo((): SalesForecast => {
        const { monthlyTrends, conversionFunnel, totalRevenue, totalClients } = analytics;

        // Pipeline stages with probabilities
        const pipelineByStage: PipelineStage[] = [
            { name: 'Leads', value: 156000, probability: 0.10, weightedValue: 15600, count: 45 },
            { name: 'Qualified', value: 89000, probability: 0.25, weightedValue: 22250, count: 28 },
            { name: 'Proposal', value: 67000, probability: 0.50, weightedValue: 33500, count: 15 },
            { name: 'Negotiation', value: 42000, probability: 0.75, weightedValue: 31500, count: 8 },
            { name: 'Closing', value: 28000, probability: 0.90, weightedValue: 25200, count: 5 },
        ];

        const totalPipeline = pipelineByStage.reduce((sum, s) => sum + s.value, 0);
        const weightedPipeline = pipelineByStage.reduce((sum, s) => sum + s.weightedValue, 0);

        // Calculate growth rate from trends
        const growthRates = monthlyTrends.slice(1).map((t, i) =>
            (t.revenue - monthlyTrends[i].revenue) / monthlyTrends[i].revenue
        );
        const avgGrowthRate = growthRates.length > 0
            ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
            : 0.05;

        // Generate forecast
        const lastActual = monthlyTrends[monthlyTrends.length - 1]?.revenue || 50000;
        const monthlyForecast: ForecastData[] = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();

        for (let i = 0; i < forecastMonths; i++) {
            const monthIndex = (currentMonth + i + 1) % 12;
            const predicted = lastActual * Math.pow(1 + avgGrowthRate, i + 1);
            const confidence = Math.max(0.5, 0.95 - (i * 0.08)); // Confidence decreases over time

            monthlyForecast.push({
                month: monthNames[monthIndex],
                actual: i === 0 ? lastActual * 0.95 : 0, // Only current month has partial actual
                predicted: Math.round(predicted),
                confidence,
            });
        }

        // Win rate and metrics
        const winRate = totalClients > 0 ? (analytics.activeClients / totalClients) * 100 : 65;
        const avgDealSize = totalClients > 0 ? totalRevenue / totalClients : 12500;
        const avgSalesCycle = 28; // days average

        const expectedRevenue = monthlyForecast.reduce((sum, f) =>
            sum + (f.predicted * f.confidence), 0
        );

        return {
            totalPipeline,
            weightedPipeline,
            expectedRevenue: Math.round(expectedRevenue),
            monthlyForecast,
            pipelineByStage,
            winRate: Math.round(winRate * 10) / 10,
            avgDealSize: Math.round(avgDealSize),
            avgSalesCycle,
        };
    }, [analytics, forecastMonths]);

    // Scenario analysis
    const runScenario = useCallback((growthModifier: number) => {
        return forecast.monthlyForecast.map(f => ({
            ...f,
            predicted: Math.round(f.predicted * (1 + growthModifier)),
        }));
    }, [forecast]);

    return {
        forecast,
        loading: analyticsLoading,
        forecastMonths,
        setForecastMonths,
        runScenario,
        // Quick metrics
        metrics: {
            pipeline: forecast.totalPipeline,
            weighted: forecast.weightedPipeline,
            expected: forecast.expectedRevenue,
            winRate: forecast.winRate,
        },
    };
}

export default useSalesForecast;
