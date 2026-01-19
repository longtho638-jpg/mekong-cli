/**
 * Inventory API Routes
 * RESTful endpoints for Assets, Movements, Licenses
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/inventory'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'

function getService() {
  return new InventoryService()
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/inventory
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const action = searchParams.get('action') || 'list'
    const assetId = searchParams.get('assetId')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const service = getService()

    switch (action) {
      case 'list':
        const filters = {
          type: searchParams.get('type') as any,
          status: searchParams.get('status') as any,
          assignedTo: searchParams.get('assignedTo') || undefined,
          expiringWithinDays: searchParams.get('expiring')
            ? parseInt(searchParams.get('expiring')!)
            : undefined,
        }
        const assets = await service.listAssets(tenantId, filters)
        return NextResponse.json({
          success: true,
          data: assets,
          count: assets.length,
        })

      case 'get':
        if (!assetId) {
          return NextResponse.json({ error: 'assetId required' }, { status: 400 })
        }
        const asset = await service.getAsset(tenantId, assetId)
        return NextResponse.json({
          success: true,
          data: asset,
        })

      case 'history':
        if (!assetId) {
          return NextResponse.json({ error: 'assetId required' }, { status: 400 })
        }
        const history = await service.getAssetHistory(tenantId, assetId)
        return NextResponse.json({
          success: true,
          data: history,
        })

      case 'summary':
        const summary = await service.getAssetSummary(tenantId)
        return NextResponse.json({
          success: true,
          data: summary,
        })

      case 'licenses':
        const licenses = await service.listLicenses(tenantId)
        return NextResponse.json({
          success: true,
          data: licenses,
          count: licenses.length,
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Inventory API error', error)
    return NextResponse.json({ error: 'Failed to fetch inventory data' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/inventory
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, action, ...data } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const service = getService()

    switch (action) {
      case 'create':
        const asset = await service.createAsset(tenantId, data.asset)
        return NextResponse.json({
          success: true,
          data: asset,
        })

      case 'update':
        const updated = await service.updateAsset(tenantId, data.assetId, data.updates)
        return NextResponse.json({
          success: true,
          data: updated,
        })

      case 'delete':
        await service.deleteAsset(tenantId, data.assetId)
        return NextResponse.json({
          success: true,
          message: 'Asset deleted',
        })

      case 'move':
        const movement = await service.recordMovement(
          tenantId,
          data.assetId,
          {
            movementType: data.movementType,
            toLocation: data.toLocation,
            toAssignee: data.toAssignee,
            notes: data.notes,
          },
          data.userId
        )
        return NextResponse.json({
          success: true,
          data: movement,
        })

      case 'create-license':
        const license = await service.createLicense(tenantId, {
          ...data.license,
          purchaseDate: new Date(data.license.purchaseDate),
          expiryDate: data.license.expiryDate ? new Date(data.license.expiryDate) : undefined,
        })
        return NextResponse.json({
          success: true,
          data: license,
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Inventory API error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}
