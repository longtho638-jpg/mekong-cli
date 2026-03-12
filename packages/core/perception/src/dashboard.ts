import { MonorepoIndexer } from './indexer';
import { HealthMonitor, ProjectHealth } from './health-monitor';
import { PackageInfo } from './types';
import * as path from 'path';

export interface DashboardReport {
  timestamp: number;
  summary: {
    totalProjects: number;
    builtProjects: number;
    healthyProjects: number;
    totalTechDebt: {
      tsIgnore: number;
      anyType: number;
      todos: number;
    };
  };
  projects: ProjectHealth[];
  serviceStatus: Record<string, unknown>;
}

export class PerceptionDashboard {
  private indexer: MonorepoIndexer;
  private monitor: HealthMonitor;
  private rootDir: string;

  constructor(rootDir: string, logDir: string, pidFile: string) {
    this.rootDir = rootDir;
    this.indexer = new MonorepoIndexer(rootDir);
    this.monitor = new HealthMonitor(logDir, pidFile);
  }

  async generateReport(): Promise<DashboardReport> {
    // 1. Scan repo structure
    const graph = await this.indexer.scan();
    const packages = Object.values(graph.nodes);

    // 2. Check service status
    const serviceStatus = await this.monitor.checkOpenClawStatus();

    // 3. Check health for each project
    const projectHealths: ProjectHealth[] = [];
    const summary = {
      totalProjects: packages.length,
      builtProjects: 0,
      healthyProjects: 0,
      totalTechDebt: {
        tsIgnore: 0,
        anyType: 0,
        todos: 0
      }
    };

    // Run in parallel with concurrency limit if needed, but for < 100 projects Promise.all is fine
    const healthPromises = packages.map(pkg => this.monitor.checkProjectHealth(pkg.path));
    const results = await Promise.all(healthPromises);

    for (const health of results) {
      projectHealths.push(health);

      if (health.isBuilt) {
        summary.builtProjects++;
      }

      summary.totalTechDebt.tsIgnore += health.techDebt.tsIgnoreCount;
      summary.totalTechDebt.anyType += health.techDebt.anyCount;
      summary.totalTechDebt.todos += health.techDebt.todoCount;

      // Definition of healthy: is built + no critical tech debt issues (ignoring TODOs for "health" usually, but let's be strict for now)
      // Actually, let's say healthy = built
      if (health.isBuilt) {
          summary.healthyProjects++; 
      }
    }

    // Sort by name
    projectHealths.sort((a, b) => a.name.localeCompare(b.name));

    return {
      timestamp: Date.now(),
      summary,
      projects: projectHealths,
      serviceStatus
    };
  }
}
