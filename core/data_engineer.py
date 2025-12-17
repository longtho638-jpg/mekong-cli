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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


class PipelineType(Enum):
    """Pipeline types."""
    ETL = "etl"
    STREAMING = "streaming"
    BATCH = "batch"
    REAL_TIME = "real_time"


class PipelineStatus(Enum):
    """Pipeline status."""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SCHEDULED = "scheduled"
    PAUSED = "paused"


class DataSource(Enum):
    """Data sources."""
    GOOGLE_ANALYTICS = "google_analytics"
    FACEBOOK_ADS = "facebook_ads"
    CRM = "crm"
    DATABASE = "database"
    API = "api"
    SPREADSHEET = "spreadsheet"


@dataclass
class DataPipeline:
    """A data pipeline."""
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


@dataclass
class DataJob:
    """A data job execution."""
    id: str
    pipeline_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    records: int = 0
    success: bool = True
    error: str = ""


class DataEngineer:
    """
    Data Engineer System.
    
    Data infrastructure.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.pipelines: Dict[str, DataPipeline] = {}
        self.jobs: List[DataJob] = []
    
    def create_pipeline(
        self,
        name: str,
        pipeline_type: PipelineType,
        source: DataSource,
        destination: str,
        schedule: str = "daily",
        engineer: str = ""
    ) -> DataPipeline:
        """Create a data pipeline."""
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
        return pipeline
    
    def run_pipeline(
        self,
        pipeline: DataPipeline,
        records: int
    ) -> DataJob:
        """Run a pipeline job."""
        job = DataJob(
            id=f"JOB-{uuid.uuid4().hex[:6].upper()}",
            pipeline_id=pipeline.id,
            started_at=datetime.now(),
            records=records
        )
        self.jobs.append(job)
        
        pipeline.status = PipelineStatus.RUNNING
        pipeline.last_run = datetime.now()
        pipeline.records_processed += records
        
        return job
    
    def complete_job(self, job: DataJob, success: bool, error: str = ""):
        """Complete a job."""
        job.completed_at = datetime.now()
        job.success = success
        job.error = error
        
        # Update pipeline status
        for pipeline in self.pipelines.values():
            if pipeline.id == job.pipeline_id:
                pipeline.status = PipelineStatus.COMPLETED if success else PipelineStatus.FAILED
    
    def get_stats(self) -> Dict[str, Any]:
        """Get data engineering stats."""
        successful_jobs = sum(1 for j in self.jobs if j.success)
        total_records = sum(p.records_processed for p in self.pipelines.values())
        running = sum(1 for p in self.pipelines.values() if p.status == PipelineStatus.RUNNING)
        
        return {
            "pipelines": len(self.pipelines),
            "jobs": len(self.jobs),
            "success_rate": (successful_jobs / len(self.jobs) * 100) if self.jobs else 0,
            "total_records": total_records,
            "running": running
        }
    
    def format_dashboard(self) -> str:
        """Format data engineer dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📊 DATA ENGINEER                                         ║",
            f"║  {stats['pipelines']} pipelines │ {stats['total_records']:,} records │ {stats['success_rate']:.0f}% success  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  🔄 PIPELINES                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        type_icons = {"etl": "🔄", "streaming": "🌊", "batch": "📦", "real_time": "⚡"}
        status_icons = {"running": "🟢", "completed": "✅", "failed": "❌", 
                       "scheduled": "⏰", "paused": "⏸️"}
        
        for pipeline in list(self.pipelines.values())[:5]:
            t_icon = type_icons.get(pipeline.pipeline_type.value, "📊")
            s_icon = status_icons.get(pipeline.status.value, "⚪")
            
            lines.append(f"║  {s_icon} {t_icon} {pipeline.name[:18]:<18} │ {pipeline.schedule:<8} │ {pipeline.records_processed:>6}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📈 BY SOURCE                                             ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        source_icons = {"google_analytics": "📊", "facebook_ads": "📱", "crm": "👥",
                       "database": "🗄️", "api": "🔌", "spreadsheet": "📋"}
        
        for source in list(DataSource)[:4]:
            count = sum(1 for p in self.pipelines.values() if p.source == source)
            records = sum(p.records_processed for p in self.pipelines.values() if p.source == source)
            icon = source_icons.get(source.value, "📊")
            lines.append(f"║    {icon} {source.value.replace('_', ' ').title():<18} │ {count:>2} │ {records:>8}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📋 RECENT JOBS                                           ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        for job in self.jobs[-3:]:
            icon = "✅" if job.success else "❌"
            lines.append(f"║    {icon} {job.pipeline_id:<12} │ {job.records:>8} records           ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [🔄 Run Pipeline]  [📊 Metrics]  [🔔 Alerts]             ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Data-driven decisions!           ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    data_eng = DataEngineer("Saigon Digital Hub")
    
    print("📊 Data Engineer")
    print("=" * 60)
    print()
    
    # Create pipelines
    p1 = data_eng.create_pipeline("GA Daily Sync", PipelineType.ETL, DataSource.GOOGLE_ANALYTICS, "BigQuery", "daily", "Alex")
    p2 = data_eng.create_pipeline("FB Ads Metrics", PipelineType.BATCH, DataSource.FACEBOOK_ADS, "Dashboard", "hourly", "Sam")
    p3 = data_eng.create_pipeline("CRM Export", PipelineType.ETL, DataSource.CRM, "Warehouse", "daily", "Alex")
    
    # Run jobs
    j1 = data_eng.run_pipeline(p1, 50000)
    j2 = data_eng.run_pipeline(p2, 12000)
    j3 = data_eng.run_pipeline(p3, 5000)
    
    data_eng.complete_job(j1, True)
    data_eng.complete_job(j2, True)
    data_eng.complete_job(j3, False, "Connection timeout")
    
    print(data_eng.format_dashboard())
