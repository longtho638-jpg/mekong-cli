"""
📊 Data Engineer - Data Infrastructure
=========================================

Build and maintain data pipelines.
Data that drives decisions!

Roles:
- Data pipelines
- ETL processes
- Data warehousing
- Analytics infrastructure
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

class PipelineType(Enum):
    """Execution patterns for data pipelines."""
    ETL = "etl"
    STREAMING = "streaming"
    BATCH = "batch"
    REAL_TIME = "real_time"


class PipelineStatus(Enum):
    """Operational status of a pipeline."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SCHEDULED = "scheduled"
    PAUSED = "paused"


class DataSource(Enum):
    """Primary data origins for agency analytics."""
    GOOGLE_ANALYTICS = "google_analytics"
    FACEBOOK_ADS = "facebook_ads"
    CRM = "crm"
    DATABASE = "database"
    API = "api"
    SPREADSHEET = "spreadsheet"


@dataclass
class DataPipeline:
    """A data pipeline entity definition."""
    id: str
    name: str
    pipeline_type: PipelineType
    source: DataSource
    destination: str
    schedule: str
    status: PipelineStatus = PipelineStatus.SCHEDULED
    last_run: Optional[datetime] = None
    records_processed: int = 0
    engineer: str = ""

    def __post_init__(self):
        if self.records_processed < 0:
            raise ValueError("Records count cannot be negative")


@dataclass
class DataJob:
    """An instance of a data pipeline execution."""
    id: str
    pipeline_id: str
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    records: int = 0
    success: bool = True
    error: str = ""


class DataEngineer:
    """
    Data Engineer System.
    
    Orchestrates the agency data infrastructure, ETL processes, and reporting pipelines.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pipelines: Dict[str, DataPipeline] = {}
        self.jobs: List[DataJob] = []
        logger.info(f"Data Engineering system initialized for {agency_name}")
    
    def create_pipeline(
        self,
        name: str,
        pipeline_type: PipelineType,
        source: DataSource,
        destination: str,
        schedule: str = "daily",
        engineer: str = "Agency AI"
    ) -> DataPipeline:
        """Register a new persistent data pipeline."""
        if not name:
            raise ValueError("Pipeline name is required")

        pipeline = DataPipeline(
            id=f"PIP-{uuid.uuid4().hex[:6].upper()}",
            name=name,
            pipeline_type=pipeline_type,
            source=source,
            destination=destination,
            schedule=schedule,
            engineer=engineer
        )
        self.pipelines[pipeline.id] = pipeline
        logger.info(f"Pipeline registered: {name} (Type: {pipeline_type.value})")
        return pipeline
    
    def execute_job(self, pipeline_id: str, records: int) -> Optional[DataJob]:
        """Start a new job execution for a specific pipeline."""
        if pipeline_id not in self.pipelines:
            logger.error(f"Pipeline {pipeline_id} not found")
            return None
            
        p = self.pipelines[pipeline_id]
        job = DataJob(
            id=f"JOB-{uuid.uuid4().hex[:6].upper()}",
            pipeline_id=pipeline_id,
            records=records
        )
        self.jobs.append(job)
        
        p.status = PipelineStatus.RUNNING
        p.last_run = job.started_at
        p.records_processed += max(0, records)
        
        logger.info(f"Pipeline job started: {p.name} (#{job.id})")
        return job
    
    def finalize_job(self, job_id: str, success: bool, error_msg: str = "") -> bool:
        """Complete a job execution and update pipeline health."""
        target_job = None
        for j in self.jobs:
            if j.id == job_id:
                target_job = j
                break
        
        if not target_job: return False
        
        target_job.completed_at = datetime.now()
        target_job.success = success
        target_job.error = error_msg
        
        if target_job.pipeline_id in self.pipelines:
            p = self.pipelines[target_job.pipeline_id]
            p.status = PipelineStatus.COMPLETED if success else PipelineStatus.FAILED
            
        if success:
            logger.info(f"Job {job_id} finished successfully")
        else:
            logger.error(f"Job {job_id} failed: {error_msg}")
        return True
    
    def get_aggregate_stats(self) -> Dict[str, Any]:
        """Calculate high-level infrastructure metrics."""
        total_p = len(self.pipelines)
        total_r = sum(p.records_processed for p in self.pipelines.values())
        success_rate = (sum(1 for j in self.jobs if j.success) / len(self.jobs) * 100) if self.jobs else 0.0
        
        return {
            "pipeline_count": total_p,
            "total_records": total_r,
            "success_rate": success_rate,
            "job_count": len(self.jobs)
        }
    
    def format_dashboard(self) -> str:
        """Render the Data Engineer Dashboard."""
        total_p = len(self.pipelines)
        total_r = sum(p.records_processed for p in self.pipelines.values())
        success_rate = (sum(1 for j in self.jobs if j.success) / len(self.jobs) * 100) if self.jobs else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 DATA ENGINEER DASHBOARD{' ' * 32}║",
            f"║  {total_p} pipelines │ {total_r:,} total records │ {success_rate:.0f}% job success {' ' * 10}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 ACTIVE PIPELINES                                      ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        type_icons = {"etl": "🔄", "streaming": "🌊", "batch": "📦", "real_time": "⚡"}
        status_icons = {"running": "🟢", "completed": "✅", "failed": "❌", "scheduled": "⏰"}
        
        for p in list(self.pipelines.values())[:5]:
            t_icon = type_icons.get(p.pipeline_type.value, "📊")
            s_icon = status_icons.get(p.status.value, "⚪")
            name_disp = (p.name[:18] + '..') if len(p.name) > 20 else p.name
            lines.append(f"║  {s_icon} {t_icon} {name_disp:<20} │ {p.schedule:<8} │ {p.records_processed:>8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT EXECUTIONS                                     ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        for job in self.jobs[-3:]:
            icon = "✅" if job.success else "❌"
            lines.append(f"║    {icon} {job.pipeline_id:<12} │ {job.records:>10} records processed   ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔄 Run Job]  [📊 ETL Config]  [🔔 Alerts]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Big Data!          ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📊 Initializing Data Engineer...")
    print("=" * 60)
    
    try:
        engineer = DataEngineer("Saigon Digital Hub")
        
        # Setup and run
        p1 = engineer.create_pipeline("GA Sync", PipelineType.ETL, DataSource.GOOGLE_ANALYTICS, "DW", "daily")
        job = engineer.execute_job(p1.id, 50000)
        if job:
            engineer.finalize_job(job.id, True)
            
        print("\n" + engineer.format_dashboard())
        
    except Exception as e:
        logger.error(f"Engineer Error: {e}")
