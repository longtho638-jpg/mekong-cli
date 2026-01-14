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

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProcessStatus(Enum):
    """Lifecycle status of a business process."""
    ACTIVE = "active"
    OPTIMIZING = "optimizing"
    DEPRECATED = "deprecated"
    DRAFT = "draft"


class ResourceType(Enum):
    """Types of agency resources."""
    TEAM = "team"
    BUDGET = "budget"
    TOOLS = "tools"
    TIME = "time"


class OperationalArea(Enum):
    """Business domains within the agency."""
    DELIVERY = "delivery"
    SALES = "sales"
    MARKETING = "marketing"
    FINANCE = "finance"
    HR = "hr"
    TECH = "tech"


@dataclass
class BusinessProcess:
    """A business process entity."""
    id: str
    name: str
    area: OperationalArea
    status: ProcessStatus = ProcessStatus.ACTIVE
    owner: str = ""
    efficiency_score: int = 0  # 1-100
    last_reviewed: Optional[datetime] = None

    def __post_init__(self):
        if not 0 <= self.efficiency_score <= 100:
            raise ValueError("Efficiency score must be 0-100")


@dataclass
class OperationalMetric:
    """A performance indicator record."""
    id: str
    name: str
    area: OperationalArea
    target: float
    current: float = 0.0
    unit: str = ""
    trend: str = "stable"


@dataclass
class ResourceAllocation:
    """Resource assignment record."""
    id: str
    resource_type: ResourceType
    area: OperationalArea
    allocated: float
    utilized: float = 0.0
    unit: str = ""

    def __post_init__(self):
        if self.allocated < 0:
            raise ValueError("Allocation cannot be negative")


class OperationsManager:
    """
    Operations Management System (COO Dashboard).
    
    Orchestrates process optimization, resource allocation, and organizational efficiency.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.processes: Dict[str, BusinessProcess] = {}
        self.metrics: Dict[str, OperationalMetric] = {}
        self.allocations: Dict[str, ResourceAllocation] = {}
        logger.info(f"Operations Manager initialized for {agency_name}")
    
    def add_process(
        self,
        name: str,
        area: OperationalArea,
        owner: str = "Manager",
        efficiency: int = 70
    ) -> BusinessProcess:
        """Define a new operational process."""
        p = BusinessProcess(
            id=f"PRC-{uuid.uuid4().hex[:6].upper()}",
            name=name, area=area, owner=owner,
            efficiency_score=efficiency, last_reviewed=datetime.now()
        )
        self.processes[p.id] = p
        logger.info(f"Process registered: {name} ({area.value})")
        return p
    
    def update_resource_use(self, alloc_id: str, used: float) -> bool:
        """Log resource utilization for an assignment."""
        if alloc_id not in self.allocations: return False
        
        a = self.allocations[alloc_id]
        a.utilized = float(used)
        logger.debug(f"Resource {alloc_id} usage updated: {used}")
        return True
    
    def get_stats(self) -> Dict[str, Any]:
        """Aggregate operational performance metrics."""
        count = len(self.processes)
        avg_eff = sum(p.efficiency_score for p in self.processes.values()) / count if count else 0.0
        
        total_alloc = sum(a.allocated for a in self.allocations.values())
        total_util = sum(a.utilized for a in self.allocations.values())
        util_rate = (total_util / total_alloc * 100.0) if total_alloc else 0.0
        
        return {
            "processes": count,
            "avg_efficiency": avg_eff,
            "utilization": util_rate
        }
    
    def format_dashboard(self) -> str:
        """Render the Operations Dashboard."""
        s = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⚙️ OPERATIONS MANAGER DASHBOARD{' ' * 29}║",
            f"║  {s['processes']} processes │ {s['avg_efficiency']:.0f}% avg efficiency │ {s['utilization']:.0f}% util{' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 CORE BUSINESS PROCESSES                               ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        for p in list(self.processes.values())[:4]:
            stat_icon = "🟢" if p.status == ProcessStatus.ACTIVE else "🔧"
            bar = "█" * (p.efficiency_score // 10) + "░" * (10 - p.efficiency_score // 10)
            lines.append(f"║  {stat_icon} {p.name[:18]:<18} │ {bar} │ {p.efficiency_score:>3}% eff  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  📦 RESOURCE ALLOCATION                                   ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for a in list(self.allocations.values())[:3]:
            rate = (a.utilized / a.allocated * 100.0) if a.allocated else 0.0
            lines.append(f"║    👥 {a.area.value.upper():<10} │ {a.resource_type.value:<10} │ {rate:>5.1f}% util  ║")
            
        lines.extend([
            "║                                                           ║",
            "║  [🔄 Processes]  [📊 Metrics]  [📦 Resources]  [⚙️ Setup] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Excellence!       ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("⚙️ Initializing Operations System...")
    print("=" * 60)
    
    try:
        ops = OperationsManager("Saigon Digital Hub")
        # Seed
        ops.add_process("Onboarding", OperationalArea.DELIVERY, efficiency=85)
        ops.allocations["R1"] = ResourceAllocation("R1", ResourceType.TEAM, OperationalArea.TECH, 10.0, 8.0)
        
        print("\n" + ops.format_dashboard())
        
    except Exception as e:
        logger.error(f"Ops Error: {e}")
