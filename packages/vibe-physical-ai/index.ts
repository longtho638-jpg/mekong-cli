/**
 * @agencyos/vibe-physical-ai — Physical AI & Robotics Facade SDK
 *
 * Fleet telemetry, mission dispatch, RaaS billing, safety compliance.
 *
 * Usage:
 *   import { createFleetManager, createMissionDispatcher, createSafetyMonitor } from '@agencyos/vibe-physical-ai';
 */

// ─── Types ──────────────────────────────────────────────────────

export type RobotStatus = 'idle' | 'active' | 'charging' | 'maintenance' | 'error' | 'offline';
export type MissionPriority = 'critical' | 'high' | 'normal' | 'low';
export type MissionStatus = 'queued' | 'dispatched' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Robot {
  id: string;
  name: string;
  model: string;
  status: RobotStatus;
  batteryLevel: number;
  location: { x: number; y: number; z: number; zone: string };
  firmwareVersion: string;
  uptimeHours: number;
  lastMaintenance: string;
}

export interface Mission {
  id: string;
  robotId: string;
  priority: MissionPriority;
  status: MissionStatus;
  taskType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface SafetyIncident {
  id: string;
  robotId: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'collision' | 'proximity' | 'malfunction' | 'emergency_stop' | 'boundary_violation';
  description: string;
  timestamp: string;
  resolved: boolean;
}

// ─── Fleet Manager ──────────────────────────────────────────────

export function createFleetManager() {
  return {
    /** Lọc robots sẵn sàng nhận mission */
    getAvailableRobots(robots: Robot[]): Robot[] {
      return robots.filter(r => r.status === 'idle' && r.batteryLevel > 20);
    },

    /** Tìm robot gần nhất với vị trí target */
    findNearestRobot(robots: Robot[], target: { x: number; y: number }): Robot | null {
      const available = robots.filter(r => r.status === 'idle' && r.batteryLevel > 20);
      if (available.length === 0) return null;
      return available.reduce((nearest, r) => {
        const distR = Math.sqrt((r.location.x - target.x) ** 2 + (r.location.y - target.y) ** 2);
        const distN = Math.sqrt((nearest.location.x - target.x) ** 2 + (nearest.location.y - target.y) ** 2);
        return distR < distN ? r : nearest;
      });
    },

    /** Tính fleet utilization rate */
    getUtilization(robots: Robot[]): { rate: number; active: number; total: number } {
      const active = robots.filter(r => r.status === 'active').length;
      return { rate: robots.length === 0 ? 0 : Math.round((active / robots.length) * 100), active, total: robots.length };
    },

    /** Danh sách robots cần bảo trì */
    getMaintenanceDue(robots: Robot[], maxUptimeHours: number = 720): Robot[] {
      return robots.filter(r => r.uptimeHours >= maxUptimeHours);
    },
  };
}

// ─── Mission Dispatcher ─────────────────────────────────────────

export function createMissionDispatcher() {
  const priorityWeight: Record<MissionPriority, number> = { critical: 4, high: 3, normal: 2, low: 1 };

  return {
    /** Sắp xếp mission queue theo priority */
    sortByPriority(missions: Mission[]): Mission[] {
      return [...missions].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    },

    /** Check robot có thể nhận mission không */
    canAssign(robot: Robot, _mission: Mission): { ok: boolean; reason?: string } {
      if (robot.status !== 'idle') return { ok: false, reason: `Robot ${robot.status}, cần idle` };
      if (robot.batteryLevel < 20) return { ok: false, reason: `Battery ${robot.batteryLevel}% < 20%` };
      return { ok: true };
    },

    /** Tính mission completion rate */
    getCompletionRate(missions: Mission[]): number {
      const finished = missions.filter(m => m.status === 'completed' || m.status === 'failed');
      if (finished.length === 0) return 0;
      const completed = finished.filter(m => m.status === 'completed').length;
      return Math.round((completed / finished.length) * 100);
    },
  };
}

// ─── Safety Monitor ─────────────────────────────────────────────

export function createSafetyMonitor() {
  return {
    /** Check proximity violation */
    isProximityViolation(robotPos: { x: number; y: number }, humanPos: { x: number; y: number }, safeDistance: number = 1.5): boolean {
      const dist = Math.sqrt((robotPos.x - humanPos.x) ** 2 + (robotPos.y - humanPos.y) ** 2);
      return dist < safeDistance;
    },

    /** Tổng hợp safety score từ incidents */
    getSafetyScore(incidents: SafetyIncident[], periodDays: number = 30): { score: number; criticalCount: number } {
      const cutoff = new Date(Date.now() - periodDays * 86400000).toISOString();
      const recent = incidents.filter(i => i.timestamp >= cutoff);
      const criticalCount = recent.filter(i => i.severity === 'critical').length;
      const warningCount = recent.filter(i => i.severity === 'warning').length;
      const deductions = criticalCount * 15 + warningCount * 5;
      return { score: Math.max(0, 100 - deductions), criticalCount };
    },

    /** Check boundary violation */
    isBoundaryViolation(position: { x: number; y: number }, boundary: { minX: number; maxX: number; minY: number; maxY: number }): boolean {
      return position.x < boundary.minX || position.x > boundary.maxX || position.y < boundary.minY || position.y > boundary.maxY;
    },
  };
}
