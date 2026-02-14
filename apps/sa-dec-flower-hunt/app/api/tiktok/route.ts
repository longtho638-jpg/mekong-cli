import { NextRequest, NextResponse } from 'next/server'
import {
    TikTokAgent,
    checkStatus,
    getAuthUrl,
    exchangeCode,
    refreshToken
} from '@/lib/agents/tiktok-posting'

// GET - Check status or get OAuth URL
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const code = searchParams.get('code')

    // OAuth callback - exchange code for token
    if (code) {
        const clientKey = process.env.TIKTOK_CLIENT_KEY
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok`

        if (!clientKey || !clientSecret) {
            return NextResponse.json({
                success: false,
                error: 'TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET required'
            }, { status: 400 })
        }

        const tokens = await exchangeCode(code, clientKey, clientSecret, redirectUri)

        if (!tokens) {
            return NextResponse.json({
                success: false,
                error: 'Failed to exchange code for token'
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Authorization successful! Add these to .env.local:',
            env: {
                TIKTOK_ACCESS_TOKEN: tokens.accessToken,
                TIKTOK_REFRESH_TOKEN: tokens.refreshToken,
                TIKTOK_OPEN_ID: tokens.openId,
                TIKTOK_EXPIRES_IN: tokens.expiresIn
            }
        })
    }

    // Refresh token
    if (action === 'refresh') {
        const refreshTokenValue = process.env.TIKTOK_REFRESH_TOKEN
        const clientKey = process.env.TIKTOK_CLIENT_KEY
        const clientSecret = process.env.TIKTOK_CLIENT_SECRET

        if (!refreshTokenValue || !clientKey || !clientSecret) {
            return NextResponse.json({
                success: false,
                error: 'TIKTOK_REFRESH_TOKEN, TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET required'
            }, { status: 400 })
        }

        const tokens = await refreshToken(refreshTokenValue, clientKey, clientSecret)

        if (!tokens) {
            return NextResponse.json({
                success: false,
                error: 'Failed to refresh token'
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Token refreshed! Update .env.local:',
            env: {
                TIKTOK_ACCESS_TOKEN: tokens.accessToken,
                TIKTOK_REFRESH_TOKEN: tokens.refreshToken
            }
        })
    }

    // Get OAuth URL
    if (action === 'auth') {
        const clientKey = process.env.TIKTOK_CLIENT_KEY
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tiktok`

        if (!clientKey) {
            return NextResponse.json({
                success: false,
                error: 'TIKTOK_CLIENT_KEY required',
                steps: [
                    '1. Go to https://developers.tiktok.com',
                    '2. Create app and add Content Posting API',
                    '3. Get Client Key and Client Secret',
                    '4. Add to .env.local'
                ]
            }, { status: 400 })
        }

        const authUrl = getAuthUrl(clientKey, redirectUri)

        return NextResponse.json({
            success: true,
            message: 'Open this URL to authorize:',
            authUrl,
            redirectUri
        })
    }

    // Default: check status
    const status = await checkStatus()
    return NextResponse.json(status)
}

// POST - Post content
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const agent = new TikTokAgent()

        if (!agent.isConfigured()) {
            return NextResponse.json({ success: false, error: 'TikTok not configured' }, { status: 400 })
        }

        // Get creator info first (REQUIRED by TikTok)
        const creator = await agent.getCreatorInfo()
        if (!creator) {
            return NextResponse.json({ success: false, error: 'Could not get creator info' }, { status: 400 })
        }

        // Video post
        if (body.videoUrl) {
            const result = await agent.postVideoFromUrl({
                title: body.title,
                videoUrl: body.videoUrl,
                privacyLevel: body.privacyLevel || creator.privacyOptions[0],
                brandContentToggle: body.brandContentToggle,
                brandOrganicToggle: body.brandOrganicToggle,
                isAigc: body.isAigc
            })
            return NextResponse.json(result)
        }

        // Photo post
        if (body.photoUrls) {
            const result = await agent.postPhotos({
                title: body.title,
                photoUrls: body.photoUrls,
                privacyLevel: body.privacyLevel || creator.privacyOptions[0],
                brandContentToggle: body.brandContentToggle,
                brandOrganicToggle: body.brandOrganicToggle,
                isAigc: body.isAigc
            })
            return NextResponse.json(result)
        }

        return NextResponse.json({ success: false, error: 'videoUrl or photoUrls required' }, { status: 400 })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
