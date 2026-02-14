/**
 * ============================================================================
 * YIELD PREDICTOR API ENDPOINT
 * ============================================================================
 * Exposes the YieldPredictor Core IP functionality via REST API
 * 
 * @author Minh Long
 * @copyright 2024 AGRIOS Tech
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import { YieldPredictor } from '@/lib/agents/yield-predictor';

// Create singleton instance
const predictor = new YieldPredictor();

/**
 * GET /api/admin/yield-predictor
 * 
 * Runs full yield prediction analysis including:
 * - Demand forecasting (senseDemand)
 * - Supply analysis (analyzeSupply)
 * - Pricing recommendations (generatePricingRecommendations)
 * - Flash sale detection (generateFlashSales)
 * 
 * @returns {Object} Comprehensive yield analysis report
 */
export async function GET() {
    try {
        console.log('🔮 [YieldPredictor API] Starting analysis...');

        const startTime = Date.now();

        // Run full analysis using Core IP
        const analysis = await predictor.runAnalysis();

        const executionTime = Date.now() - startTime;

        console.log(`✅ [YieldPredictor API] Analysis complete in ${executionTime}ms`);

        return NextResponse.json({
            success: true,
            executionTimeMs: executionTime,
            timestamp: new Date().toISOString(),
            coreIpVersion: '1.0.0',
            data: analysis
        });

    } catch (error) {
        console.error('❌ [YieldPredictor API] Error:', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * POST /api/admin/yield-predictor
 * 
 * Runs specific analysis type based on request body
 * 
 * @param {string} analysisType - One of: 'demand', 'supply', 'pricing', 'flashsale'
 * @returns {Object} Specific analysis result
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { analysisType } = body;

        console.log(`🔮 [YieldPredictor API] Running ${analysisType} analysis...`);

        let result;

        switch (analysisType) {
            case 'demand':
                result = await predictor.senseDemand();
                break;
            case 'supply':
                result = await predictor.analyzeSupply();
                break;
            case 'forecast':
                result = await predictor.forecastDemand();
                break;
            case 'pricing':
                result = await predictor.generatePricingRecommendations();
                break;
            case 'flashsale':
                result = await predictor.generateFlashSales();
                break;
            default:
                return NextResponse.json({
                    success: false,
                    error: `Invalid analysisType: ${analysisType}. Use: demand, supply, forecast, pricing, flashsale`
                }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            analysisType,
            timestamp: new Date().toISOString(),
            data: result
        });

    } catch (error) {
        console.error('❌ [YieldPredictor API] Error:', error);

        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
