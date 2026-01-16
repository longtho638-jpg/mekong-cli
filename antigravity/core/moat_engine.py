'''
🏰 Moat Engine - 5 Immortal Moats for Agency Retention
======================================================

Creates compounding defensibility for AgencyEr by tracking accumulated value
that would be permanently lost if switching platforms.

The 5 Immortal Moats:
1. 📊 Data Moat: All operational records and client history.
2. 🧠 Learning Moat: AI personalized to the agency's specific style.
3. 🌐 Network Moat: Community reputation and partner connections.
4. ⚡ Workflow Moat: Proprietary automations and custom agent crews.
5. 🏯 Identity Moat: Agency DNA and localized brand voice.

Binh Pháp: 🏰 Hình Thế (Strategic Configuration) - Defensive positioning.
'''

import logging
import json
from dataclasses import dataclass, field
from typing import Dict, Any, Union
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class Moat:
    '''Defines a specific area of defensibility. '''
    id: str
    name: str
    emoji: str
    description: str
    strength: int = 0  # 0-100%
    switching_cost_label: str = ""
    metrics: Dict[str, Any] = field(default_factory=dict)


class MoatEngine:
    '''
    🏰 Moat Strategy Engine
    
    The value-accumulation engine of Agency OS. 
    Calculates how "sticky" the platform has become for the user.
    '''

    def __init__(self, storage_path: Union[str, Path] = ".antigravity/moats"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.data_file = self.storage_path / "moats_v2.json"

        self.moats: Dict[str, Moat] = {}
        self._initialize_moat_definitions()
        self._load_data()

    def _initialize_moat_definitions(self):
        '''Sets up the 5 core areas of platform defensibility.'''
        self.moats = {
            "data": Moat(
                id="data",
                name="Data Moat",
                emoji="📊",
                description="Hồ sơ khách hàng, báo giá, hóa đơn và lịch sử dự án.",
                switching_cost_label="Mất hàng năm dữ liệu vận hành",
                metrics={"projects": 0, "clients": 0, "quotes": 0, "invoices": 0}
            ),
            "learning": Moat(
                id="learning",
                name="Learning Moat",
                emoji="🧠",
                description="AI đã học phong cách, sở thích và quy trình riêng của Anh.",
                switching_cost_label="Mất sạch các mẫu AI cá nhân hóa",
                metrics={"patterns": 0, "success_rate": 0.75, "custom_skills": 0}
            ),
            "network": Moat(
                id="network",
                name="Network Moat",
                emoji="🌐",
                description="Kết nối cộng đồng, đối tác và uy tín hệ thống.",
                switching_cost_label="Mất toàn bộ mạng lưới đối tác",
                metrics={"partners": 0, "referrals": 0, "reputation_points": 0}
            ),
            "workflow": Moat(
                id="workflow",
                name="Workflow Moat",
                emoji="⚡",
                description="Các quy trình tự động và Agent Crews tùy chỉnh.",
                switching_cost_label="Phải xây dựng lại mọi tự động hóa",
                metrics={"custom_workflows": 0, "active_crews": 0, "hours_saved": 0}
            ),
            "identity": Moat(
                id="identity",
                name="Identity Moat",
                emoji="🏯",
                description="Agency DNA, giọng thương hiệu và bản sắc địa phương.",
                switching_cost_label="Mất bản sắc và định vị thương hiệu",
                metrics={"dna_sync": False, "locales": 1, "brand_assets": 0}
            )
        }

    def add_data_point(self, category: str, count: int = 1):
        '''Updates metrics in the Data Moat.'''
        if category in self.moats["data"].metrics:
            self.moats["data"].metrics[category] += count
            self._update_strength("data")
            self._save_data()

    def record_learning(self, success: bool = True):
        '''Updates the Learning Moat based on execution outcomes.'''
        metrics = self.moats["learning"].metrics
        metrics["patterns"] += 1

        # Exponential moving average for success rate
        alpha = 0.1
        metrics["success_rate"] = (metrics["success_rate"] * (1-alpha)) + (1.0 if success else 0.0) * alpha

        self._update_strength("learning")
        self._save_data()

    def add_workflow(self, count: int = 1):
        '''Updates the Workflow Moat.'''
        self.moats["workflow"].metrics["custom_workflows"] += count
        self._update_strength("workflow")
        self._save_data()

    def _update_strength(self, moat_id: str):
        '''Recalculates 0-100% strength for a specific moat based on its metrics.'''
        moat = self.moats[moat_id]

        if moat_id == "data":
            total = sum(v for v in moat.metrics.values() if isinstance(v, (int, float)))
            moat.strength = min(100, int(total / 5)) # 500 points = 100%

        elif moat_id == "learning":
            patterns = moat.metrics["patterns"]
            rate = moat.metrics["success_rate"]
            moat.strength = min(100, int((patterns / 2) * rate)) # 200 patterns @ 100% success = 100%

        elif moat_id == "workflow":
            wf = moat.metrics["custom_workflows"]
            moat.strength = min(100, wf * 5) # 20 workflows = 100%

        elif moat_id == "identity":
            moat.strength = 100 if moat.metrics["dna_sync"] else 20

        elif moat_id == "network":
            total = moat.metrics["partners"] + (moat.metrics["referrals"] * 2)
            moat.strength = min(100, total * 10)

    def get_aggregate_strength(self) -> int:
        '''Calculates the weighted average strength of all 5 moats.'''
        return sum(m.strength for m in self.moats.values()) // 5

    def calculate_switching_cost(self) -> Dict[str, Any]:
        '''Estimates the time and financial impact of leaving the Agency OS.'''
        m = self.moats

        # Heuristic Time Impact (Hours)
        h_data = m["data"].metrics.get("projects", 0) * 3
        h_learn = m["learning"].metrics.get("patterns", 0) * 0.5
        h_work = m["workflow"].metrics.get("custom_workflows", 0) * 10
        total_hours = h_data + h_learn + h_work

        # Opportunity Cost ($100/hr)
        financial_loss = int(total_hours * 100)

        return {
            "hours": int(total_hours),
            "days": round(total_hours / 8, 1),
            "financial_usd": financial_loss,
            "verdict": self._get_verdict(total_hours)
        }

    def _get_verdict(self, hours: float) -> str:
        '''Returns a strategic verdict based on estimated switching pain.'''
        if hours > 400: return "🚫 RỜI ĐI LÀ KHÔNG THỂ (Moat tối cao)"
        if hours > 100: return "⚠️ RỜI ĐI RẤT ĐAU ĐỚN (Moat mạnh)"
        if hours > 20:  return "😟 RỜI ĐI KHÁ KHÓ KHĂN (Moat trung bình)"
        return "⚡ RỜI ĐI DỄ DÀNG (Cần xây thêm Moat!)"

    def _save_data(self):
        '''Persists moat metrics to disk.'''
        try:
            data = {k: {"s": v.strength, "m": v.metrics} for k, v in self.moats.items()}
            self.data_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save moat engine data: {e}")

    def _load_data(self):
        '''Loads moat metrics from disk.'''
        if not self.data_file.exists(): return
        try:
            raw = json.loads(self.data_file.read_text(encoding="utf-8"))
            for k, v in raw.items():
                if k in self.moats:
                    self.moats[k].strength = v.get("s", 0)
                    self.moats[k].metrics.update(v.get("m", {}))
        except Exception as e:
            logger.warning(f"Failed to load moat data: {e}")

    def print_dashboard(self):
        '''Renders the Moat Strategy Dashboard.'''
        agg = self.get_aggregate_strength()
        costs = self.calculate_switching_cost()

        print("\n" + "═" * 65)
        print("║" + "🏰 AGENCY OS - ĐỘC QUYỀN HÓA CHIẾN LƯỢC (5 MOATS)".center(63) + "║")
        print("═" * 65)

        for m in self.moats.values():
            bar_w = 20
            filled = int(bar_w * m.strength / 100)
            bar = "█" * filled + "░" * (bar_w - filled)
            print(f"\n  {m.emoji} {m.name.upper():<15} | [{bar}] {m.strength}%")
            print(f"     └─ {m.description}")
            print(f"     └─ Chi phí rời bỏ: {m.switching_cost_label}")

        print("\n" + "─" * 65)
        print(f"  💰 CHI PHÍ RỜI BỎ ƯỚC TÍNH: ${costs['financial_usd']:,} USD")
        print(f"  ⏳ THỜI GIAN KHÔI PHỤC:     {costs['hours']} giờ làm việc")
        print("\n" + "═" * 65)
        print(f"  🏆 TỔNG THỂ SỨC MẠNH: {agg}% | {costs['verdict']}")
        print("═" * 65 + "\n")


# Global Instance
_moat_engine = None

def get_moat_engine() -> MoatEngine:
    '''Access the shared moat strategy engine.'''
    global _moat_engine
    if _moat_engine is None:
        _moat_engine = MoatEngine()
    return _moat_engine
