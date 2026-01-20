"""
Demo Manager engine logic.
"""
import random
from datetime import datetime
from typing import Dict, List

from .models import Demo, DemoOutcome, DemoType


class DemoEngine:
    DEMO_SCRIPTS = {
        DemoType.DISCOVERY: ["1. Intro", "2. Pain points", "3. Overview", "4. Q&A"],
        DemoType.TECHNICAL: ["1. Architecture", "2. Live demo", "3. Integration", "4. Q&A"],
    }

    def __init__(self):
        self.demos: Dict[str, Demo] = {}

    def schedule_demo(self, prospect: str, company: str, demo_type: DemoType, scheduled_at: datetime, se_assigned: str, deal_size: float = 0.0) -> Demo:
        did = f"demo_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        demo = Demo(id=did, prospect=prospect, company=company, demo_type=demo_type, scheduled_at=scheduled_at, se_assigned=se_assigned, deal_size=deal_size)
        self.demos[did] = demo
        return demo

    def get_script(self, demo_type: DemoType) -> List[str]:
        return self.DEMO_SCRIPTS.get(demo_type, [])
