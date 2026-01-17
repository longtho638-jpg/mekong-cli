"""
📊 Analytics Repository - Data Access Layer
==========================================

Repository pattern cho analytics data với caching.
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pathlib import Path
import hashlib

try:
    from ..services.analytics_service import (
        RevenueEntry, ClientMetrics, MetricPeriod, RevenueType
    )
except ImportError:
    from services.analytics_service import (
        RevenueEntry, ClientMetrics, RevenueType
    )

logger = logging.getLogger(__name__)

class AnalyticsCache:
    """Simple in-memory cache cho analytics data."""
    
    def __init__(self, ttl_seconds: int = 300):  # 5 minutes default TTL
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl_seconds = ttl_seconds
        logger.info(f"Analytics cache initialized with {ttl_seconds}s TTL")
    
    def _generate_key(self, method: str, **kwargs) -> str:
        """Generate cache key từ method và parameters."""
        key_data = f"{method}:{json.dumps(kwargs, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, method: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Lấy data từ cache."""
        key = self._generate_key(method, **kwargs)
        
        if key in self.cache:
            cached_data = self.cache[key]
            if datetime.now().timestamp() - cached_data["timestamp"] < self.ttl_seconds:
                logger.debug(f"Cache hit for {method}")
                return cached_data["data"]
            else:
                del self.cache[key]
                logger.debug(f"Cache expired for {method}")
        
        return None
    
    def set(self, method: str, data: Dict[str, Any], **kwargs) -> None:
        """Lưu data vào cache."""
        key = self._generate_key(method, **kwargs)
        self.cache[key] = {
            "data": data,
            "timestamp": datetime.now().timestamp()
        }
        logger.debug(f"Cached data for {method}")
    
    def invalidate_all(self) -> None:
        """Xóa toàn bộ cache."""
        self.cache.clear()
        logger.info("Analytics cache invalidated")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Lấy cache statistics."""
        return {
            "cache_size": len(self.cache),
            "ttl_seconds": self.ttl_seconds,
            "keys": list(self.cache.keys())
        }

class AnalyticsRepository:
    """Repository cho analytics data operations."""
    
    def __init__(self, storage_path: str = "data/analytics", enable_cache: bool = True):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # File paths
        self.revenue_file = self.storage_path / "revenue.json"
        self.clients_file = self.storage_path / "clients.json"
        
        # Cache
        self.cache = AnalyticsCache() if enable_cache else None
        
        logger.info(f"Analytics repository initialized at {storage_path}")
    
    # ═══════════════════════════════════════════════════════════
    # Revenue Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_revenue_entries(self, revenue_entries: List[RevenueEntry]) -> bool:
        """Lưu revenue entries."""
        try:
            data = []
            for entry in revenue_entries:
                data.append({
                    "id": entry.id,
                    "amount": entry.amount,
                    "type": entry.type.value,
                    "client_id": entry.client_id,
                    "description": entry.description,
                    "date": entry.date.isoformat(),
                    "recurring": entry.recurring
                })
            
            with open(self.revenue_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Invalidate cache khi data thay đổi
            if self.cache:
                self.cache.invalidate_all()
            
            logger.info(f"Saved {len(revenue_entries)} revenue entries")
            return True
        except Exception as e:
            logger.error(f"Failed to save revenue entries: {e}")
            return False
    
    def load_revenue_entries(self) -> List[RevenueEntry]:
        """Tải revenue entries."""
        try:
            if not self.revenue_file.exists():
                return []
            
            with open(self.revenue_file, 'r') as f:
                data = json.load(f)
            
            revenue_entries = []
            for entry_data in data:
                entry = RevenueEntry(
                    id=entry_data["id"],
                    amount=entry_data["amount"],
                    type=RevenueType(entry_data["type"]),
                    client_id=entry_data.get("client_id"),
                    description=entry_data["description"],
                    date=datetime.fromisoformat(entry_data["date"]),
                    recurring=entry_data.get("recurring", False)
                )
                revenue_entries.append(entry)
            
            logger.info(f"Loaded {len(revenue_entries)} revenue entries")
            return revenue_entries
        except Exception as e:
            logger.error(f"Failed to load revenue entries: {e}")
            return []
    
    def add_revenue_entry(self, entry: RevenueEntry) -> bool:
        """Thêm revenue entry mới."""
        try:
            revenue_entries = self.load_revenue_entries()
            revenue_entries.append(entry)
            return self.save_revenue_entries(revenue_entries)
        except Exception as e:
            logger.error(f"Failed to add revenue entry: {e}")
            return False
    
    def get_revenue_entries_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[RevenueEntry]:
        """Lấy revenue entries theo khoảng thời gian."""
        revenue_entries = self.load_revenue_entries()
        return [
            entry for entry in revenue_entries
            if start_date <= entry.date <= end_date
        ]
    
    def get_revenue_entries_by_type(self, revenue_type: RevenueType) -> List[RevenueEntry]:
        """Lấy revenue entries theo loại."""
        revenue_entries = self.load_revenue_entries()
        return [entry for entry in revenue_entries if entry.type == revenue_type]
    
    def get_revenue_entries_by_client(self, client_id: str) -> List[RevenueEntry]:
        """Lấy revenue entries theo client."""
        revenue_entries = self.load_revenue_entries()
        return [entry for entry in revenue_entries if entry.client_id == client_id]
    
    # ═══════════════════════════════════════════════════════════
    # Client Metrics Operations
    # ═══════════════════════════════════════════════════════════
    
    def save_client_metrics(self, client_metrics: Dict[str, ClientMetrics]) -> bool:
        """Lưu client metrics."""
        try:
            data = {}
            for client_id, metrics in client_metrics.items():
                data[client_id] = {
                    "client_id": metrics.client_id,
                    "client_name": metrics.client_name,
                    "total_revenue": metrics.total_revenue,
                    "projects_count": metrics.projects_count,
                    "avg_project_value": metrics.avg_project_value,
                    "lifetime_value": metrics.lifetime_value,
                    "months_active": metrics.months_active,
                    "health_score": metrics.health_score
                }
            
            with open(self.clients_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Invalidate cache
            if self.cache:
                self.cache.invalidate_all()
            
            logger.info(f"Saved {len(client_metrics)} client metrics")
            return True
        except Exception as e:
            logger.error(f"Failed to save client metrics: {e}")
            return False
    
    def load_client_metrics(self) -> Dict[str, ClientMetrics]:
        """Tải client metrics."""
        try:
            if not self.clients_file.exists():
                return {}
            
            with open(self.clients_file, 'r') as f:
                data = json.load(f)
            
            client_metrics = {}
            for client_id, metrics_data in data.items():
                metrics = ClientMetrics(
                    client_id=metrics_data["client_id"],
                    client_name=metrics_data["client_name"],
                    total_revenue=metrics_data["total_revenue"],
                    projects_count=metrics_data["projects_count"],
                    avg_project_value=metrics_data["avg_project_value"],
                    lifetime_value=metrics_data["lifetime_value"],
                    months_active=metrics_data["months_active"],
                    health_score=metrics_data["health_score"]
                )
                client_metrics[client_id] = metrics
            
            logger.info(f"Loaded {len(client_metrics)} client metrics")
            return client_metrics
        except Exception as e:
            logger.error(f"Failed to load client metrics: {e}")
            return {}
    
    def update_client_metrics(self, client_id: str, metrics: ClientMetrics) -> bool:
        """Cập nhật metrics cho một client."""
        try:
            client_metrics = self.load_client_metrics()
            client_metrics[client_id] = metrics
            return self.save_client_metrics(client_metrics)
        except Exception as e:
            logger.error(f"Failed to update client metrics: {e}")
            return False
    
    # ═══════════════════════════════════════════════════════════
    # Cache Operations
    # ═══════════════════════════════════════════════════════════
    
    def get_cached_result(self, method: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Lấy kết quả từ cache."""
        if not self.cache:
            return None
        return self.cache.get(method, **kwargs)
    
    def cache_result(self, method: str, data: Dict[str, Any], **kwargs) -> None:
        """Lưu kết quả vào cache."""
        if self.cache:
            self.cache.set(method, data, **kwargs)
    
    def invalidate_cache(self) -> None:
        """Xóa cache."""
        if self.cache:
            self.cache.invalidate_all()
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Lấy cache information."""
        if self.cache:
            return self.cache.get_cache_stats()
        return {"cache_enabled": False}
    
    # ═══════════════════════════════════════════════════════════
    # Data Operations
    # ═══════════════════════════════════════════════════════════
    
    def generate_demo_data(self) -> bool:
        """Tạo demo data cho testing."""
        try:
            import random
            
            logger.info("Generating demo analytics data...")
            now = datetime.now()
            revenue_entries = []
            
            types_weights = [
                (RevenueType.SERVICE, 0.4),
                (RevenueType.RETAINER, 0.3),
                (RevenueType.AFFILIATE, 0.15),
                (RevenueType.TEMPLATE, 0.1),
                (RevenueType.REFERRAL, 0.05)
            ]
            
            for months_ago in range(12):
                date = now - timedelta(days=months_ago * 30)
                base_revenue = 5000 + (12 - months_ago) * 500
                
                for _ in range(random.randint(5, 15)):
                    rev_type_data = random.choices(
                        types_weights,
                        weights=[w for _, w in types_weights]
                    )[0]
                    rev_type = rev_type_data[0]
                    
                    amount = random.uniform(100, base_revenue / 3)
                    
                    entry = RevenueEntry(
                        id=f"REV-{len(revenue_entries):04d}",
                        amount=amount,
                        type=rev_type,
                        client_id=f"CLI-{random.randint(1, 10):04d}" if rev_type in [RevenueType.SERVICE, RevenueType.RETAINER] else None,
                        description=f"{rev_type.value.title()} revenue",
                        date=date,
                        recurring=rev_type == RevenueType.RETAINER
                    )
                    revenue_entries.append(entry)
            
            success = self.save_revenue_entries(revenue_entries)
            
            # Demo client metrics
            clients = [
                ("CLI-0001", "Acme Corp", 15000, 3),
                ("CLI-0002", "TechStart Inc", 8500, 2),
                ("CLI-0003", "GrowthLab", 22000, 5),
                ("CLI-0004", "LocalBiz", 4500, 1),
                ("CLI-0005", "ScaleUp Co", 12000, 2)
            ]
            
            client_metrics = {}
            for client_id, name, revenue, projects in clients:
                client_metrics[client_id] = ClientMetrics(
                    client_id=client_id,
                    client_name=name,
                    total_revenue=float(revenue),
                    projects_count=projects,
                    avg_project_value=revenue / max(1, projects),
                    lifetime_value=float(revenue * 2.5),
                    months_active=random.randint(3, 24),
                    health_score=random.uniform(70, 100)
                )
            
            self.save_client_metrics(client_metrics)
            
            logger.info(f"Generated {len(revenue_entries)} revenue entries and {len(client_metrics)} client records")
            return success
        except Exception as e:
            logger.error(f"Failed to generate demo data: {e}")
            return False
    
    def get_data_summary(self) -> Dict[str, Any]:
        """Lấy summary của data."""
        revenue_entries = self.load_revenue_entries()
        client_metrics = self.load_client_metrics()
        
        return {
            "revenue_entries_count": len(revenue_entries),
            "client_metrics_count": len(client_metrics),
            "total_revenue": sum(e.amount for e in revenue_entries),
            "date_range": {
                "earliest": min(e.date for e in revenue_entries).isoformat() if revenue_entries else None,
                "latest": max(e.date for e in revenue_entries).isoformat() if revenue_entries else None
            },
            "cache_info": self.get_cache_info()
        }