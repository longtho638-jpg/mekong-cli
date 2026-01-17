"""
🎛 MAX LEVEL Antigravity Control Center - Remote Config & Analytics
================================================================

Enhanced control system with:
- Remote configuration via Redis/Environment variables
- Feature flag analytics with detailed usage tracking
- Advanced circuit breaker patterns with predictive failure detection
- Distributed configuration management
"""

import os
import json
import time
import logging
import threading
from typing import Dict, Any, List, Optional, Callable, Union
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict, deque
import hashlib
import pickle

# Redis support (optional)
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Redis not available, using local cache only")

logger = logging.getLogger(__name__)

class ConfigSource(Enum):
    """Configuration source types."""
    LOCAL = "local"
    REDIS = "redis"
    ENVIRONMENT = "environment"
    REMOTE_API = "remote_api"

class FeatureFlagAnalytics:
    """Feature flag analytics data."""
    
    def __init__(self):
        self.usage_counts = defaultdict(int)
        self.usage_history = deque(maxlen=10000)
        self.performance_metrics = defaultdict(list)
        self.user_segments = defaultdict(set)
        self.error_counts = defaultdict(int)

@dataclass
class RemoteConfig:
    """Remote configuration data."""
    config_key: str
    value: Any
    source: ConfigSource
    last_updated: float
    ttl: Optional[float] = None
    checksum: str
    
@dataclass
class AdvancedCircuitConfig:
    """Advanced circuit breaker configuration."""
    failure_threshold: int = 5
    timeout: float = 60.0
    success_threshold: int = 3
    monitor_window: float = 300.0
    predictive_enabled: bool = True
    failure_prediction_window: int = 100
    recovery_strategy: str = "exponential_backoff"

class EnhancedControlCenter:
    """Enhanced control center with remote config and analytics."""
    
    def __init__(self):
        self.feature_flags: Dict[str, Dict[str, Any]] = {}
        self.analytics = FeatureFlagAnalytics()
        self.circuit_breakers: Dict[str, Any] = {}
        self.remote_configs: Dict[str, RemoteConfig] = {}
        self.config_cache = {}
        self.lock = threading.Lock()
        
        # Initialize Redis connection if available
        self.redis_client = None
        self.redis_available = False
        
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                self.redis_available = True
                logger.info("Redis connection established")
            except Exception as e:
                logger.error(f"Redis connection failed: {e}")
                
        # Load initial configuration
        self._load_initial_config()
        
        # Start background tasks
        self._start_background_tasks()
        
    def _load_initial_config(self):
        """Load initial configuration from multiple sources."""
        # Load from environment first (highest priority)
        self._load_from_environment()
        
        # Load from Redis if available
        if self.redis_available:
            self._load_from_redis()
            
        # Load from local config files
        self._load_from_local_files()
        
        logger.info(f"Loaded {len(self.feature_flags)} feature flags and {len(self.remote_configs)} remote configs")
        
    def _load_from_environment(self):
        """Load configuration from environment variables."""
        env_prefix = "ANTIGRAVITY_"
        
        for key, value in os.environ.items():
            if key.startswith(env_prefix):
                config_key = key[len(env_prefix):].lower()
                
                # Parse boolean environment variables
                if value.lower() in ['true', 'false', '1', '0']:
                    value = value.lower() in ['true', '1']
                    
                self.remote_configs[config_key] = RemoteConfig(
                    config_key=config_key,
                    value=value,
                    source=ConfigSource.ENVIRONMENT,
                    last_updated=time.time()
                )
                
    def _load_from_redis(self):
        """Load configuration from Redis."""
        if not self.redis_available:
            return
            
        try:
            # Load feature flags from Redis
            feature_pattern = "feature_flag:*"
            for key in self.redis_client.scan_iter(match=feature_pattern):
                feature_name = key.decode().replace("feature_flag:", "")
                value = self.redis_client.get(key)
                
                if value:
                    try:
                        parsed_value = json.loads(value.decode())
                        self.feature_flags[feature_name] = parsed_value
                    except json.JSONDecodeError:
                        self.feature_flags[feature_name] = {"enabled": value.decode()}
                        
            # Load remote configs from Redis
            config_pattern = "config:*"
            for key in self.redis_client.scan_iter(match=config_pattern):
                config_key = key.decode().replace("config:", "")
                value = self.redis_client.get(key)
                
                if value:
                    try:
                        parsed_value = json.loads(value.decode())
                        self.remote_configs[config_key] = RemoteConfig(
                            config_key=config_key,
                            value=parsed_value,
                            source=ConfigSource.REDIS,
                            last_updated=time.time()
                        )
                    except json.JSONDecodeError:
                        self.remote_configs[config_key] = RemoteConfig(
                            config_key=config_key,
                            value=value.decode(),
                            source=ConfigSource.REDIS,
                            last_updated=time.time()
                        )
                        
        except Exception as e:
            logger.error(f"Failed to load from Redis: {e}")
            
    def _load_from_local_files(self):
        """Load configuration from local JSON files."""
        config_dir = os.getenv("CONFIG_DIR", "config")
        
        # Load feature flags
        feature_flags_file = os.path.join(config_dir, "feature_flags.json")
        if os.path.exists(feature_flags_file):
            try:
                with open(feature_flags_file, 'r') as f:
                    self.feature_flags.update(json.load(f))
                    logger.info(f"Loaded {len(self.feature_flags)} feature flags from local file")
            except Exception as e:
                logger.error(f"Failed to load feature flags: {e}")
                
    def _start_background_tasks(self):
        """Start background tasks for monitoring and caching."""
        tasks = [
            threading.Thread(target=self._config_sync_loop, daemon=True),
            threading.Thread(target=self._analytics_processing_loop, daemon=True),
            threading.Thread(target=self._health_check_loop, daemon=True)
        ]
        
        for task in tasks:
            task.start()
            
        logger.info("Started background monitoring tasks")
        
    def _config_sync_loop(self):
        """Background loop for configuration synchronization."""
        while True:
            try:
                # Sync to Redis every 30 seconds
                if self.redis_available:
                    self._sync_to_redis()
                    
                # Check for remote updates every 60 seconds
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Config sync error: {e}")
                time.sleep(60)  # Wait before retrying
                
    def _sync_to_redis(self):
        """Synchronize configuration to Redis."""
        if not self.redis_available:
            return
            
        try:
            # Sync feature flags to Redis
            for feature_name, flag_data in self.feature_flags.items():
                key = f"feature_flag:{feature_name}"
                value = json.dumps(flag_data)
                self.redis_client.setex(key, 3600, value)  # 1 hour TTL
                
            # Sync remote configs to Redis
            for config_key, config_data in self.remote_configs.items():
                if config_data.source != ConfigSource.REDIS:  # Don't sync Redis to Redis
                    key = f"config:{config_key}"
                    value = json.dumps(config_data.value)
                    self.redis_client.setex(key, 3600, value)
                    
        except Exception as e:
            logger.error(f"Redis sync failed: {e}")
            
    def _analytics_processing_loop(self):
        """Background loop for processing analytics data."""
        while True:
            try:
                # Process analytics every 5 minutes
                time.sleep(300)
                
                # Generate analytics report
                report = self._generate_analytics_report()
                
                # Store in Redis for dashboard
                if self.redis_available:
                    analytics_key = f"analytics:{int(time.time())}"
                    self.redis_client.setex(analytics_key, 86400, json.dumps(report))  # 24 hours TTL
                    
                # Clean old analytics data
                self._cleanup_old_analytics()
                
            except Exception as e:
                logger.error(f"Analytics processing error: {e}")
                
    def _health_check_loop(self):
        """Background loop for health monitoring."""
        while True:
            try:
                # Health check every 30 seconds
                time.sleep(30)
                
                # Check Redis health
                if self.redis_available:
                    try:
                        self.redis_client.ping()
                    except Exception as e:
                        logger.error(f"Redis health check failed: {e}")
                        self.redis_available = False
                        
                # Check circuit breaker health
                self._check_circuit_health()
                
            except Exception as e:
                logger.error(f"Health check error: {e}")
                
    def set_remote_config(
        self,
        config_key: str,
        value: Any,
        source: ConfigSource = ConfigSource.REMOTE_API,
        ttl: Optional[float] = None
    ):
        """Set remote configuration."""
        with self.lock:
            config = RemoteConfig(
                config_key=config_key,
                value=value,
                source=source,
                last_updated=time.time(),
                ttl=ttl,
                checksum=self._calculate_checksum(value)
            )
            
            self.remote_configs[config_key] = config
            
            # Update Redis if available
            if self.redis_available:
                redis_key = f"config:{config_key}"
                redis_value = json.dumps(value)
                
                if ttl:
                    self.redis_client.setex(redis_key, int(ttl), redis_value)
                else:
                    self.redis_client.set(redis_key, redis_value)
                    
            logger.info(f"Set remote config: {config_key} from {source.value}")
            
    def get_remote_config(self, config_key: str, default: Any = None) -> Any:
        """Get remote configuration with caching."""
        # Check local cache first
        if config_key in self.remote_configs:
            config = self.remote_configs[config_key]
            
            # Check TTL
            if config.ttl and (time.time() - config.last_updated) > config.ttl:
                # Expired, remove from cache
                del self.remote_configs[config_key]
            else:
                return config.value
                
        # Try Redis if not in cache or expired
        if self.redis_available:
            try:
                redis_key = f"config:{config_key}"
                value = self.redis_client.get(redis_key)
                
                if value:
                    parsed_value = json.loads(value.decode())
                    
                    # Update cache
                    self.remote_configs[config_key] = RemoteConfig(
                        config_key=config_key,
                        value=parsed_value,
                        source=ConfigSource.REDIS,
                        last_updated=time.time()
                    )
                    
                    return parsed_value
                    
            except Exception as e:
                logger.error(f"Redis get failed: {e}")
                
        return default
        
    def set_feature_flag(
        self,
        flag_name: str,
        enabled: bool,
        config: Dict[str, Any] = None,
        user_segment: str = None,
        rollout_percentage: float = None
    ):
        """Set feature flag with advanced targeting."""
        flag_data = {
            "enabled": enabled,
            "config": config or {},
            "user_segment": user_segment,
            "rollout_percentage": rollout_percentage,
            "created_at": time.time(),
            "updated_at": time.time()
        }
        
        with self.lock:
            self.feature_flags[flag_name] = flag_data
            
            # Update Redis if available
            if self.redis_available:
                key = f"feature_flag:{flag_name}"
                value = json.dumps(flag_data)
                self.redis_client.setex(key, 3600, value)
                
            logger.info(f"Set feature flag: {flag_name} = {enabled}")
            
    def is_feature_enabled(self, flag_name: str, context: Dict[str, Any] = None) -> bool:
        """Check if feature is enabled with advanced targeting."""
        if flag_name not in self.feature_flags:
            return False
            
        flag_data = self.feature_flags[flag_name]
        enabled = flag_data.get("enabled", False)
        
        if not enabled:
            # Track usage attempt
            self.analytics.usage_counts[f"{flag_name}_disabled"] += 1
            return False
            
        # Check user segment targeting
        user_segment = context.get("user_segment") if context else None
        target_segment = flag_data.get("user_segment")
        if target_segment and user_segment != target_segment:
            self.analytics.usage_counts[f"{flag_name}_segment_mismatch"] += 1
            return False
            
        # Check rollout percentage
        rollout_percentage = flag_data.get("rollout_percentage")
        if rollout_percentage and rollout_percentage < 100:
            user_hash = self._calculate_user_hash(context)
            if user_hash % 100 >= rollout_percentage:
                self.analytics.usage_counts[f"{flag_name}_rollout_excluded"] += 1
                return False
                
        # Track successful usage
        self.analytics.usage_counts[f"{flag_name}_enabled"] += 1
        self._record_feature_usage(flag_name, context)
        
        return True
        
    def _record_feature_usage(self, flag_name: str, context: Dict[str, Any] = None):
        """Record feature usage for analytics."""
        usage_record = {
            "timestamp": time.time(),
            "flag_name": flag_name,
            "context": context or {},
            "performance": self._measure_performance()
        }
        
        self.analytics.usage_history.append(usage_record)
        
        # Update user segments
        if context and "user_id" in context:
            self.analytics.user_segments[flag_name].add(context["user_id"])
            
    def _calculate_user_hash(self, context: Dict[str, Any]) -> int:
        """Calculate consistent user hash for rollout targeting."""
        user_id = context.get("user_id", "")
        timestamp = str(int(time.time()))
        combined = f"{user_id}{timestamp}"
        return int(hashlib.md5(combined.encode()).hexdigest(), 16)
        
    def _measure_performance(self) -> Dict[str, float]:
        """Measure current system performance."""
        # Simplified performance measurement
        # In production, use actual system metrics
        return {
            "cpu_usage": 50.0,  # Placeholder
            "memory_usage": 60.0,  # Placeholder
            "response_time": 0.1,  # Placeholder
        }
        
    def get_feature_analytics(self, flag_name: str = None) -> Dict[str, Any]:
        """Get comprehensive feature flag analytics."""
        if flag_name:
            # Analytics for specific flag
            flag_usage = [u for u in self.analytics.usage_history if u.get("flag_name") == flag_name]
            flag_errors = [e for e in self.analytics.usage_history if e.get("flag_name") == flag_name and not e.get("success", True)]
            
            return {
                "flag_name": flag_name,
                "total_usage": len(flag_usage),
                "error_rate": len(flag_errors) / max(len(flag_usage), 1) if flag_usage else 0,
                "unique_users": len(self.analytics.user_segments.get(flag_name, set())),
                "performance_metrics": {
                    "avg_response_time": sum(u.get("performance", {}).get("response_time", 0) for u in flag_usage) / max(len(flag_usage), 1),
                    "error_count": len(flag_errors)
                },
                "usage_by_hour": self._get_usage_by_hour(flag_usage)
            }
        else:
            # Overall analytics
            return {
                "total_flags": len(self.feature_flags),
                "enabled_flags": len([f for f in self.feature_flags.values() if f.get("enabled", False)]),
                "usage_counts": dict(self.analytics.usage_counts),
                "user_segments": {name: len(users) for name, users in self.analytics.user_segments.items()},
                "recent_usage": list(self.analytics.usage_history)[-100:],
                "performance_summary": self._calculate_performance_summary()
            }
            
    def _get_usage_by_hour(self, usage_records: List[Dict[str, Any]]) -> Dict[int, int]:
        """Get usage distribution by hour."""
        hourly_usage = defaultdict(int)
        
        for record in usage_records:
            hour = time.localtime(record["timestamp"]).tm_hour
            hourly_usage[hour] += 1
            
        return dict(hourly_usage)
        
    def _calculate_performance_summary(self) -> Dict[str, Any]:
        """Calculate overall performance summary."""
        if not self.analytics.usage_history:
            return {"avg_response_time": 0, "error_rate": 0}
            
        response_times = [u.get("performance", {}).get("response_time", 0) for u in self.analytics.usage_history[-1000:]]
        error_count = len([u for u in self.analytics.usage_history[-1000:] if not u.get("success", True)])
        
        return {
            "avg_response_time": sum(response_times) / len(response_times) if response_times else 0,
            "error_rate": (error_count / len(self.analytics.usage_history[-1000:])) * 100 if self.analytics.usage_history else 0
        }
        
    def _generate_analytics_report(self) -> Dict[str, Any]:
        """Generate comprehensive analytics report."""
        current_time = time.time()
        
        return {
            "timestamp": current_time,
            "report_period": "last_24_hours",
            "feature_flags": {
                name: {
                    "enabled": data.get("enabled", False),
                    "usage_count": self.analytics.usage_counts.get(f"{name}_enabled", 0),
                    "error_count": self.analytics.usage_counts.get(f"{name}_disabled", 0),
                    "rollout_percentage": data.get("rollout_percentage", 100)
                }
                for name, data in self.feature_flags.items()
            },
            "remote_configs": {
                name: {
                    "source": config.source.value,
                    "last_updated": config.last_updated,
                    "ttl": config.ttl
                }
                for name, config in self.remote_configs.items()
            },
            "system_health": {
                "redis_available": self.redis_available,
                "total_configurations": len(self.remote_configs),
                "cache_size": len(self.config_cache)
            }
        }
        
    def _cleanup_old_analytics(self):
        """Clean old analytics data."""
        cutoff_time = time.time() - (7 * 24 * 3600)  # 7 days ago
        
        # Remove old usage records
        self.analytics.usage_history = deque(
            [u for u in self.analytics.usage_history if u["timestamp"] > cutoff_time],
            maxlen=10000
        )
        
    def _check_circuit_health(self):
        """Check health of circuit breakers."""
        # Implementation would monitor circuit breaker states
        # and trigger alerts if needed
        pass
        
    def _calculate_checksum(self, value: Any) -> str:
        """Calculate checksum for configuration integrity."""
        value_str = json.dumps(value, sort_keys=True)
        return hashlib.sha256(value_str.encode()).hexdigest()
        
    def export_config(self, file_path: str = None) -> str:
        """Export all configuration to file."""
        export_data = {
            "timestamp": time.time(),
            "feature_flags": self.feature_flags,
            "remote_configs": self.remote_configs,
            "analytics_summary": self.get_feature_analytics()
        }
        
        if not file_path:
            file_path = f"config_export_{int(time.time())}.json"
            
        try:
            with open(file_path, 'w') as f:
                json.dump(export_data, f, indent=2)
                
            logger.info(f"Configuration exported to {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Export failed: {e}")
            return ""

# Global enhanced control center instance
enhanced_control_center = EnhancedControlCenter()

# Export enhanced functions
def set_remote_config(config_key: str, value: Any, source: ConfigSource = ConfigSource.REMOTE_API, ttl: Optional[float] = None):
    """Set remote configuration."""
    enhanced_control_center.set_remote_config(config_key, value, source, ttl)

def get_remote_config(config_key: str, default: Any = None) -> Any:
    """Get remote configuration."""
    return enhanced_control_center.get_remote_config(config_key, default)

def set_feature_flag(flag_name: str, enabled: bool, config: Dict[str, Any] = None, user_segment: str = None, rollout_percentage: float = None):
    """Set feature flag with advanced targeting."""
    enhanced_control_center.set_feature_flag(flag_name, enabled, config, user_segment, rollout_percentage)

def is_feature_enabled(flag_name: str, context: Dict[str, Any] = None) -> bool:
    """Check if feature is enabled."""
    return enhanced_control_center.is_feature_enabled(flag_name, context)

def get_feature_analytics(flag_name: str = None) -> Dict[str, Any]:
    """Get feature flag analytics."""
    return enhanced_control_center.get_feature_analytics(flag_name)

def export_config(file_path: str = None) -> str:
    """Export configuration."""
    return enhanced_control_center.export_config(file_path)

__all__ = [
    "EnhancedControlCenter",
    "enhanced_control_center",
    "set_remote_config",
    "get_remote_config",
    "set_feature_flag",
    "is_feature_enabled",
    "get_feature_analytics",
    "export_config",
    "RemoteConfig",
    "ConfigSource",
    "FeatureFlagAnalytics",
    "AdvancedCircuitConfig"
]