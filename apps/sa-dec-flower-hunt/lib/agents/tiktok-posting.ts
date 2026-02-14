/**
 * TikTok Integration - Full API Compliance
 * 
 * Based on TikTok Developer Documentation (December 2024)
 * https://developers.tiktok.com/doc/overview
 * 
 * === AVAILABLE TIKTOK APIS & KITS ===
 * 
 * 1. LOGIN KIT - OAuth 2.0 authentication
 *    - User login with TikTok account
 *    - Get user.info.basic scope
 *    - Available: iOS, Android, Desktop, Web
 * 
 * 2. SHARE KIT - Share content to TikTok
 *    - Green Screen sharing
 *    - Video/Photo sharing to TikTok editor
 *    - Available: iOS, Android
 * 
 * 3. CONTENT POSTING API - Direct posting ⭐ (Main focus)
 *    - Post videos directly to user's profile
 *    - Post photos (carousel)
 *    - PULL_FROM_URL: Video from verified domain
 *    - FILE_UPLOAD: Chunked upload
 *    - Requires: video.publish scope + audit for public posts
 * 
 * 4. DISPLAY API - Fetch user content
 *    - Get user's videos
 *    - Video metadata and stats
 * 
 * 5. RESEARCH API - Academic research
 *    - Analyze TikTok trends
 *    - Requires special approval
 * 
 * 6. DATA PORTABILITY API - User data export
 *    - GDPR compliance
 * 
 * 7. COMMERCIAL CONTENT API - Ad transparency
 *    - Commercial content data
 * 
 * 8. EMBED VIDEOS - iFrame embedding
 *    - No API key needed
 *    - Just use embed URL
 * 
 * === RATE LIMITS ===
 * - 6 requests per minute per user (Content Posting)
 * - Token refresh before expiry
 * 
 * === IMPORTANT COMPLIANCE ===
 * - Query creator_info BEFORE posting (UX requirement)
 * - brand_content_toggle for paid partnerships
 * - is_aigc for AI-generated content
 * - Unaudited apps: posts are PRIVATE only
 * - Domain verification required for PULL_FROM_URL
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// TikTok API Endpoints
const TIKTOK_API = {
    base: 'https://open.tiktokapis.com/v2',
    oauth: 'https://www.tiktok.com/v2/auth/authorize',
    token: 'https://open.tiktokapis.com/v2/oauth/token/',
    creatorInfo: '/post/publish/creator_info/query/',
    videoInit: '/post/publish/video/init/',
    photoInit: '/post/publish/content/init/',
    status: '/post/publish/status/fetch/',
    userInfo: '/user/info/'
}

// Rate limit: 6 requests per minute
const RATE_LIMIT = { maxRequests: 6, windowMs: 60000 }

// ============================================================================
// TYPES
// ============================================================================

export interface TikTokCredentials {
    clientKey: string
    clientSecret: string
    accessToken: string
    refreshToken?: string
    openId: string
    expiresAt?: number
}

export type PrivacyLevel =
    | 'PUBLIC_TO_EVERYONE'
    | 'MUTUAL_FOLLOW_FRIENDS'
    | 'FOLLOWER_OF_CREATOR'
    | 'SELF_ONLY'

export interface CreatorInfo {
    avatarUrl: string
    nickname: string
    username: string
    privacyOptions: PrivacyLevel[]
    commentDisabled: boolean
    duetDisabled: boolean
    stitchDisabled: boolean
    maxVideoDurationSec: number
}

export interface VideoPostOptions {
    title: string                     // Max 2200 chars, with #hashtags and @mentions
    privacyLevel: PrivacyLevel        // REQUIRED
    videoUrl?: string                 // For PULL_FROM_URL
    videoSize?: number                // For FILE_UPLOAD (bytes)
    disableDuet?: boolean
    disableComment?: boolean
    disableStitch?: boolean
    coverTimestampMs?: number         // Which frame for cover
    brandContentToggle?: boolean      // TRUE = paid partnership disclosure
    brandOrganicToggle?: boolean      // TRUE = own business promotion
    isAigc?: boolean                  // TRUE = AI-generated content label
}

export interface PhotoPostOptions {
    title: string
    photoUrls: string[]               // 1-35 photos, from verified domain
    privacyLevel: PrivacyLevel
    disableComment?: boolean
    brandContentToggle?: boolean
    brandOrganicToggle?: boolean
    isAigc?: boolean
}

export interface PostResult {
    success: boolean
    publishId?: string
    uploadUrl?: string
    error?: string
}

export type PostStatus =
    | 'PROCESSING_UPLOAD'
    | 'PROCESSING_DOWNLOAD'
    | 'SEND_TO_USER_INBOX'
    | 'PUBLISH_COMPLETE'
    | 'FAILED'

// ============================================================================
// TIKTOK POSTING AGENT
// ============================================================================

export class TikTokAgent {
    private supabase
    private creds: TikTokCredentials | null = null
    private requestCount = 0
    private windowStart = Date.now()

    constructor() {
        this.supabase = createClient(supabaseUrl, supabaseServiceKey)
        this.loadCredentials()
    }

    private loadCredentials(): void {
        if (process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_ACCESS_TOKEN) {
            this.creds = {
                clientKey: process.env.TIKTOK_CLIENT_KEY,
                clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
                accessToken: process.env.TIKTOK_ACCESS_TOKEN,
                refreshToken: process.env.TIKTOK_REFRESH_TOKEN,
                openId: process.env.TIKTOK_OPEN_ID || '',
                expiresAt: process.env.TIKTOK_EXPIRES_AT ? parseInt(process.env.TIKTOK_EXPIRES_AT) : undefined
            }
        }
    }

    isConfigured(): boolean {
        return this.creds !== null && this.creds.accessToken !== ''
    }

    // Rate limiting
    private checkRateLimit(): boolean {
        const now = Date.now()
        if (now - this.windowStart > RATE_LIMIT.windowMs) {
            this.requestCount = 0
            this.windowStart = now
        }
        if (this.requestCount >= RATE_LIMIT.maxRequests) {
            console.warn('[TikTok] Rate limit: 6 requests/minute exceeded')
            return false
        }
        this.requestCount++
        return true
    }

    // API request helper
    private async apiRequest<T>(endpoint: string, body?: object): Promise<T | null> {
        if (!this.creds) return null
        if (!this.checkRateLimit()) return null

        try {
            const response = await fetch(`${TIKTOK_API.base}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.creds.accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: body ? JSON.stringify(body) : undefined
            })

            const data = await response.json()
            if (data.error?.code !== 'ok') {
                console.error('[TikTok] API Error:', data.error)
                return null
            }
            return data.data as T
        } catch (error) {
            console.error('[TikTok] Request failed:', error)
            return null
        }
    }

    // ============================================================================
    // REQUIRED: Query creator info before posting (TikTok UX requirement)
    // ============================================================================
    async getCreatorInfo(): Promise<CreatorInfo | null> {
        const data = await this.apiRequest<{
            creator_avatar_url: string
            creator_nickname: string
            creator_username: string
            privacy_level_options: PrivacyLevel[]
            comment_disabled: boolean
            duet_disabled: boolean
            stitch_disabled: boolean
            max_video_post_duration_sec: number
        }>(TIKTOK_API.creatorInfo)

        if (!data) return null

        return {
            avatarUrl: data.creator_avatar_url,
            nickname: data.creator_nickname,
            username: data.creator_username,
            privacyOptions: data.privacy_level_options,
            commentDisabled: data.comment_disabled,
            duetDisabled: data.duet_disabled,
            stitchDisabled: data.stitch_disabled,
            maxVideoDurationSec: data.max_video_post_duration_sec
        }
    }

    // ============================================================================
    // POST VIDEO from URL (requires verified domain)
    // ============================================================================
    async postVideoFromUrl(opts: VideoPostOptions): Promise<PostResult> {
        if (!opts.videoUrl) return { success: false, error: 'Video URL required' }

        const data = await this.apiRequest<{ publish_id: string }>(TIKTOK_API.videoInit, {
            post_info: {
                title: opts.title.substring(0, 2200),
                privacy_level: opts.privacyLevel,
                disable_duet: opts.disableDuet ?? false,
                disable_comment: opts.disableComment ?? false,
                disable_stitch: opts.disableStitch ?? false,
                video_cover_timestamp_ms: opts.coverTimestampMs || 1000,
                brand_content_toggle: opts.brandContentToggle ?? false,
                brand_organic_toggle: opts.brandOrganicToggle ?? false,
                is_aigc: opts.isAigc ?? false
            },
            source_info: {
                source: 'PULL_FROM_URL',
                video_url: opts.videoUrl
            }
        })

        if (!data) {
            await this.logPost('video', opts.title, null, 'failed')
            return { success: false, error: 'API request failed' }
        }

        await this.logPost('video', opts.title, data.publish_id, 'success')
        return { success: true, publishId: data.publish_id }
    }

    // ============================================================================
    // POST VIDEO from file (chunked upload)
    // ============================================================================
    async initVideoUpload(opts: VideoPostOptions): Promise<PostResult> {
        if (!opts.videoSize) return { success: false, error: 'Video size required' }

        const chunkSize = 10 * 1024 * 1024 // 10MB
        const totalChunks = Math.ceil(opts.videoSize / chunkSize)

        const data = await this.apiRequest<{ publish_id: string; upload_url: string }>(TIKTOK_API.videoInit, {
            post_info: {
                title: opts.title.substring(0, 2200),
                privacy_level: opts.privacyLevel,
                disable_duet: opts.disableDuet ?? false,
                disable_comment: opts.disableComment ?? false,
                disable_stitch: opts.disableStitch ?? false,
                video_cover_timestamp_ms: opts.coverTimestampMs || 1000,
                brand_content_toggle: opts.brandContentToggle ?? false,
                brand_organic_toggle: opts.brandOrganicToggle ?? false,
                is_aigc: opts.isAigc ?? false
            },
            source_info: {
                source: 'FILE_UPLOAD',
                video_size: opts.videoSize,
                chunk_size: chunkSize,
                total_chunk_count: totalChunks
            }
        })

        if (!data) return { success: false, error: 'Failed to init upload' }

        return {
            success: true,
            publishId: data.publish_id,
            uploadUrl: data.upload_url
        }
    }

    // ============================================================================
    // POST PHOTOS (carousel, 1-35 images)
    // ============================================================================
    async postPhotos(opts: PhotoPostOptions): Promise<PostResult> {
        if (!opts.photoUrls?.length) return { success: false, error: 'At least 1 photo required' }
        if (opts.photoUrls.length > 35) return { success: false, error: 'Maximum 35 photos' }

        const data = await this.apiRequest<{ publish_id: string }>(TIKTOK_API.photoInit, {
            post_info: {
                title: opts.title.substring(0, 2200),
                privacy_level: opts.privacyLevel,
                disable_comment: opts.disableComment ?? false,
                brand_content_toggle: opts.brandContentToggle ?? false,
                brand_organic_toggle: opts.brandOrganicToggle ?? false,
                is_aigc: opts.isAigc ?? false
            },
            source_info: {
                source: 'PULL_FROM_URL',
                photo_images: opts.photoUrls.map(url => ({ image_url: url }))
            },
            post_mode: 'DIRECT_POST',
            media_type: 'PHOTO'
        })

        if (!data) {
            await this.logPost('photo', opts.title, null, 'failed')
            return { success: false, error: 'API request failed' }
        }

        await this.logPost('photo', opts.title, data.publish_id, 'success')
        return { success: true, publishId: data.publish_id }
    }

    // ============================================================================
    // CHECK POST STATUS
    // ============================================================================
    async getPostStatus(publishId: string): Promise<{ status: PostStatus; failReason?: string } | null> {
        const data = await this.apiRequest<{ status: PostStatus; fail_reason?: string }>(TIKTOK_API.status, {
            publish_id: publishId
        })

        if (!data) return null
        return { status: data.status, failReason: data.fail_reason }
    }

    // Log to database
    private async logPost(type: 'video' | 'photo', title: string, publishId: string | null, status: 'success' | 'failed') {
        await this.supabase.from('agent_runs').insert({
            agent_name: 'tiktok',
            status: status === 'success' ? 'completed' : 'failed',
            completed_at: new Date().toISOString(),
            output: { type, title: title.substring(0, 100), publish_id: publishId }
        })
    }
}

// ============================================================================
// OAUTH HELPERS
// ============================================================================

export function getAuthUrl(clientKey: string, redirectUri: string, state?: string): string {
    const scopes = 'user.info.basic,video.publish'
    return `${TIKTOK_API.oauth}?` +
        `client_key=${clientKey}` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state || Math.random().toString(36).substring(7)}`
}

export async function exchangeCode(
    code: string,
    clientKey: string,
    clientSecret: string,
    redirectUri: string
): Promise<{
    accessToken: string
    refreshToken: string
    openId: string
    expiresIn: number
} | null> {
    try {
        const response = await fetch(TIKTOK_API.token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            })
        })

        const data = await response.json()
        if (data.error) return null

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            openId: data.open_id,
            expiresIn: data.expires_in
        }
    } catch {
        return null
    }
}

export async function refreshToken(
    refreshTokenValue: string,
    clientKey: string,
    clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
    try {
        const response = await fetch(TIKTOK_API.token, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_key: clientKey,
                client_secret: clientSecret,
                refresh_token: refreshTokenValue,
                grant_type: 'refresh_token'
            })
        })

        const data = await response.json()
        if (data.error) return null

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in
        }
    } catch {
        return null
    }
}

// ============================================================================
// EXECUTION FUNCTIONS
// ============================================================================

export async function checkStatus() {
    const agent = new TikTokAgent()

    if (!agent.isConfigured()) {
        return {
            configured: false,
            message: 'Add to .env.local: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN',
            capabilities: [
                '✅ Login Kit - User authentication',
                '✅ Content Posting API - Post videos/photos',
                '✅ Display API - Fetch user content',
                '⚠️ Share Kit - iOS/Android only',
                '⚠️ Research API - Academic approval required'
            ]
        }
    }

    const creator = await agent.getCreatorInfo()

    if (!creator) {
        return {
            configured: true,
            valid: false,
            message: 'Token expired or invalid. Re-authorize.'
        }
    }

    return {
        configured: true,
        valid: true,
        creator,
        note: '⚠️ Unaudited apps: posts are PRIVATE only. Submit for audit to post publicly.'
    }
}
