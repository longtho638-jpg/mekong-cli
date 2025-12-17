"""
⚙️ Operations Manager - Business Operations
==============================================

Manage day-to-day business operations.
Run like clockwork!

Roles:
- Process management
- Team operations
- Resource allocation
- Performance metrics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class ProcessStatus(Enum):
    """Process status."""
    ACTIVE = "active"
    OPTIMIZING = "optimizing"
    DEPRECATED = "deprecated"
    DRAFT = "draft"


class ResourceType(Enum):
    """Resource types."""
    TEAM = "team"
    BUDGET = "budget"
    TOOLS = "tools"
    TIME = "time"


class OperationalArea(Enum):
    """Operational areas."""
    DELIVERY = "delivery"
    SALES = "sales"
    MARKETING = "marketing"
    FINANCE = "finance"
    HR = "hr"
    TECH = "tech"


@dataclass
class BusinessProcess:
    """A business process."""
    id: str
    name: str
    area: OperationalArea
    status: ProcessStatus = ProcessStatus.ACTIVE
    owner: str = ""
    efficiency_score: int = 0  # 1-100
    last_reviewed: Optional[datetime] = None


@dataclass
class OperationalMetric:
    """An operational metric."""
    id: str
    name: str
    area: OperationalArea
    target: float
    current: float = 0
    unit: str = ""
    trend: str = ""  # up, down, stable


@dataclass
class ResourceAllocation:
    """Resource allocation."""
    id: str
    resource_type: ResourceType
    area: OperationalArea
    allocated: float
    utilized: float = 0
    unit: str = ""


class OperationsManager:
    """
    Chief Operating Officer.
    
    Run operations smoothly.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.processes: Dict[str, BusinessProcess] = {}
        self.metrics: Dict[str, OperationalMetric] = {}
        self.allocations: Dict[str, ResourceAllocation] = {}
    
    def add_process(
        self,
        name: str,
        area: OperationalArea,
        owner: str = "",
        efficiency: int = 70
    ) -> BusinessProcess:
        """Add a business process."""
        process = BusinessProcess(
            id=f"PRC-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            area=area,
            owner=owner,
            efficiency_score=efficiency,
            last_reviewed=datetime.now()
        )
        self.processes[process.id] = process
        return process
    
    def optimize_process(self, process: BusinessProcess, new_efficiency: int):
        """Optimize a process."""
        process.status = ProcessStatus.OPTIMIZING
        process.efficiency_score = new_efficiency
        process.last_reviewed = datetime.now()
    
    def add_metric(
        self,
        name: str,
        area: OperationalArea,
        target: float,
        unit: str = ""
    ) -> OperationalMetric:
        """Add an operational metric."""
        metric = OperationalMetric(
            id=f"MET-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            area=area,
            target=target,
            unit=unit
        )
        self.metrics[metric.id] = metric
        return metric
    
    def update_metric(self, metric: OperationalMetric, current: float, trend: str = "stable"):
        """Update metric value."""
        metric.current = current
        metric.trend = trend
    
    def allocate_resource(
        self,
        resource_type: ResourceType,
        area: OperationalArea,
        amount: float,
        unit: str = ""
    ) -> ResourceAllocation:
        """Allocate resources."""
        alloc = ResourceAllocation(
            id=f"RES-{uuid.uuid4().hex[:6].upper()}",
            resource_type=resource_type,
            area=area,
            allocated=amount,
            unit=unit
        )
        self.allocations[alloc.id] = alloc
        return alloc
    
    def utilize_resource(self, alloc: ResourceAllocation, utilized: float):
        """Track resource utilization."""
        alloc.utilized = utilized
    
    def get_stats(self) -> Dict[str, Any]:
        """Get operations statistics."""
        avg_efficiency = sum(p.efficiency_score for p in self.processes.values()) / len(self.processes) if self.processes else 0
        
        metrics_on_track = sum(1 for m in self.metrics.values() if m.current >= m.target * 0.9)
        
        total_allocated = sum(a.allocated for a in self.allocations.values())
        total_utilized = sum(a.utilized for a in self.allocations.values())
        utilization = (total_utilized / total_allocated * 100) if total_allocated else 0
        
        return {
            "processes": len(self.processes),
            "avg_efficiency": avg_efficiency,
            "metrics": len(self.metrics),
            "metrics_on_track": metrics_on_track,
            "utilization": utilization,
            "allocations": len(self.allocations)
        }
    
    def format_dashboard(self) -> str:
        """Format operations manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ OPERATIONS MANAGER                                    ║",
            f"║  {stats['processes']} processes │ {stats['avg_efficiency']:.0f}% efficiency │ {stats['utilization']:.0f}% util  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 BUSINESS PROCESSES                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        status_icons = {"active": "🟢", "optimizing": "🔧", "deprecated": "⏸️", "draft": "📝"}
        area_icons = {"delivery": "📦", "sales": "💰", "marketing": "📢",
                     "finance": "💵", "hr": "👥", "tech": "💻"}
        
        for process in sorted(list(self.processes.values()), key=lambda x: x.efficiency_score, reverse=True)[:4]:
            s_icon = status_icons.get(process.status.value, "⚪")
            a_icon = area_icons.get(process.area.value, "⚙️")
            eff_bar = "█" * int(process.efficiency_score / 20) + "░" * (5 - int(process.efficiency_score / 20))
            
            lines.append(f"║  {s_icon} {a_icon} {process.name[:18]:<18} │ {eff_bar} │ {process.efficiency_score:>3}%  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 OPERATIONAL METRICS                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        trend_icons = {"up": "📈", "down": "📉", "stable": "➡️"}
        
        for metric in list(self.metrics.values())[:4]:
            t_icon = trend_icons.get(metric.trend, "➡️")
            a_icon = area_icons.get(metric.area.value, "📊")
            pct = (metric.current / metric.target * 100) if metric.target else 0
            status = "🟢" if pct >= 90 else "🟡" if pct >= 70 else "🔴"
            
            lines.append(f"║  {status} {a_icon} {metric.name[:18]:<18} │ {metric.current:.0f}/{metric.target:.0f} {metric.unit[:4]:<4} {t_icon}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📦 RESOURCE ALLOCATION                                   ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        res_icons = {"team": "👥", "budget": "💰", "tools": "🔧", "time": "⏰"}
        
        for alloc in list(self.allocations.values())[:4]:
            r_icon = res_icons.get(alloc.resource_type.value, "📦")
            a_icon = area_icons.get(alloc.area.value, "⚙️")
            util = (alloc.utilized / alloc.allocated * 100) if alloc.allocated else 0
            
            lines.append(f"║  {r_icon} {a_icon} {alloc.resource_type.value.title():<10} │ {alloc.utilized:.0f}/{alloc.allocated:.0f} │ {util:>5.0f}%     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔄 Processes]  [📊 Metrics]  [📦 Resources]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Run like clockwork!              ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    coo = OperationsManager("Saigon Digital Hub")
    
    print("⚙️ Operations Manager")
    print("=" * 60)
    print()
    
    p1 = coo.add_process("Client Onboarding", OperationalArea.DELIVERY, "Sarah", 85)
    p2 = coo.add_process("Sales Pipeline", OperationalArea.SALES, "Alex", 78)
    p3 = coo.add_process("Payroll Processing", OperationalArea.FINANCE, "Mike", 92)
    
    m1 = coo.add_metric("Project Delivery Rate", OperationalArea.DELIVERY, 95, "%")
    m2 = coo.add_metric("Sales Conversion", OperationalArea.SALES, 25, "%")
    m3 = coo.add_metric("Team Utilization", OperationalArea.HR, 80, "%")
    
    coo.update_metric(m1, 92, "up")
    coo.update_metric(m2, 22, "stable")
    coo.update_metric(m3, 75, "down")
    
    r1 = coo.allocate_resource(ResourceType.TEAM, OperationalArea.DELIVERY, 10, "people")
    r2 = coo.allocate_resource(ResourceType.BUDGET, OperationalArea.MARKETING, 50000, "$")
    
    coo.utilize_resource(r1, 8)
    coo.utilize_resource(r2, 35000)
    
    print(coo.format_dashboard())
