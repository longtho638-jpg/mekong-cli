/**
 * @agencyos/vibe-logistics — Supply Chain & Logistics Facade SDK
 *
 * Shipment tracking, inventory management, route optimization,
 * warehouse operations, carrier API integration.
 *
 * Usage:
 *   import { createShipmentTracker, createInventoryManager, createRouteOptimizer } from '@agencyos/vibe-logistics';
 */

// ─── Types ──────────────────────────────────────────────────────

export type ShipmentStatus = 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'exception';
export type CarrierName = 'ghn' | 'ghtk' | 'viettel_post' | 'jt_express' | 'dhl' | 'fedex' | 'custom';

export interface ShipmentEvent {
  status: ShipmentStatus;
  location: string;
  timestamp: string;
  description: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: CarrierName;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  events: ShipmentEvent[];
  weight: number;
  dimensions?: { length: number; width: number; height: number };
}

export interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  reorderPoint: number;
  warehouseId: string;
  lastUpdated: string;
}

// ─── Shipment Tracker ───────────────────────────────────────────

export function createShipmentTracker() {
  return {
    /**
     * Tinh estimated delivery accuracy
     */
    deliveryAccuracy(estimated: string, actual: string): { onTime: boolean; diffHours: number } {
      const est = new Date(estimated).getTime();
      const act = new Date(actual).getTime();
      const diffHours = Math.round((act - est) / (1000 * 60 * 60));
      return { onTime: diffHours <= 0, diffHours };
    },

    /**
     * Tinh thoi gian transit trung binh
     */
    averageTransitTime(shipments: Shipment[]): number {
      const delivered = shipments.filter(s => s.status === 'delivered' && s.events.length > 1);
      if (delivered.length === 0) return 0;

      const totalHours = delivered.reduce((sum, s) => {
        const first = new Date(s.events[0].timestamp).getTime();
        const last = new Date(s.events[s.events.length - 1].timestamp).getTime();
        return sum + (last - first) / (1000 * 60 * 60);
      }, 0);

      return Math.round(totalHours / delivered.length);
    },

    /**
     * Phan loai shipments theo status
     */
    groupByStatus(shipments: Shipment[]): Record<ShipmentStatus, number> {
      const groups: Record<string, number> = {};
      for (const s of shipments) {
        groups[s.status] = (groups[s.status] || 0) + 1;
      }
      return groups as Record<ShipmentStatus, number>;
    },

    /**
     * Tim shipments bi delay (exception hoac qua estimated)
     */
    findDelayed(shipments: Shipment[]): Shipment[] {
      const now = new Date();
      return shipments.filter(s =>
        s.status === 'exception' ||
        (s.status !== 'delivered' && s.status !== 'returned' && new Date(s.estimatedDelivery) < now)
      );
    },
  };
}

// ─── Inventory Manager ──────────────────────────────────────────

export function createInventoryManager() {
  return {
    /**
     * Tim items can reorder (duoi reorder point)
     */
    findReorderNeeded(items: InventoryItem[]): InventoryItem[] {
      return items.filter(i => i.quantity <= i.reorderPoint);
    },

    /**
     * Tinh inventory turnover rate
     */
    turnoverRate(totalSold: number, averageInventory: number): number {
      return averageInventory > 0 ? Math.round((totalSold / averageInventory) * 100) / 100 : 0;
    },

    /**
     * Tinh days of supply con lai
     */
    daysOfSupply(currentStock: number, dailyDemand: number): number {
      return dailyDemand > 0 ? Math.round(currentStock / dailyDemand) : Infinity;
    },

    /**
     * Phan loai inventory theo ABC analysis
     */
    abcClassification(items: { sku: string; annualValue: number }[]): Record<'A' | 'B' | 'C', string[]> {
      const sorted = [...items].sort((a, b) => b.annualValue - a.annualValue);
      const total = sorted.reduce((sum, i) => sum + i.annualValue, 0);

      let cumulative = 0;
      const result: Record<'A' | 'B' | 'C', string[]> = { A: [], B: [], C: [] };

      for (const item of sorted) {
        cumulative += item.annualValue;
        const percent = cumulative / total;
        if (percent <= 0.8) result.A.push(item.sku);
        else if (percent <= 0.95) result.B.push(item.sku);
        else result.C.push(item.sku);
      }
      return result;
    },
  };
}

// ─── Route Optimizer ────────────────────────────────────────────

export function createRouteOptimizer() {
  return {
    /**
     * Tinh khoang cach giua 2 diem (Haversine formula)
     */
    haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    /**
     * Uoc tinh thoi gian giao hang dua tren khoang cach
     */
    estimateDeliveryTime(distanceKm: number, avgSpeedKmh: number = 30): { hours: number; displayText: string } {
      const hours = Math.round((distanceKm / avgSpeedKmh) * 10) / 10;
      const displayText = hours < 1 ? `${Math.round(hours * 60)} phút` : `${hours} giờ`;
      return { hours, displayText };
    },

    /**
     * Tinh shipping cost dua tren weight + distance
     */
    calculateShippingCost(weightKg: number, distanceKm: number, ratePerKgKm: number = 5): number {
      const volumetricWeight = weightKg;
      const baseRate = Math.max(volumetricWeight, 0.5) * distanceKm * ratePerKgKm;
      return Math.round(baseRate / 100) * 100;
    },
  };
}
