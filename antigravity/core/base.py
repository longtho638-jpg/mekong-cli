"""
🏗️ AntigravityKit - Base Architecture
=====================================

Provides the foundational classes for the entire Antigravity system. 
Ensures consistent serialization, directory management, and telemetry support
across all core engines and data entities.

Core Components:
- BaseModel: Data entity with UUID and auto-timestamping.
- BaseEngine: Abstract base for logic containers (Revenue, CRM, etc).
- Registry: Factory patterns for dynamic module loading.

Binh Pháp: 🏰 Nền Tảng (Foundation) - Building on solid ground.
"""

import logging
import json
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Dict, Any, Optional, TypeVar, Type, Union
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

T = TypeVar('T', bound='BaseModel')


@dataclass
class BaseModel:
    """
    🏗️ Base Model
    
    The standard data entity for Agency OS. 
    Inheriting classes get automatic ID generation and timestamping.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Deep serialization of the model into a dictionary."""
        data = asdict(self)
        # Type conversion for JSON compatibility
        return self._serialize_nested(data)

    def _serialize_nested(self, obj: Any) -> Any:
        """Helper to handle nested objects and datetimes during serialization."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, dict):
            return {k: self._serialize_nested(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._serialize_nested(i) for i in obj]
        return obj

    def to_json(self, indent: int = 2) -> str:
        """Serializes the model to a pretty-printed JSON string."""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """
        Deserializes a dictionary into a model instance.
        Handles ISO datetime strings and type mapping.
        """
        # Shallow copy to avoid mutating original
        data_copy = data.copy()
        
        # Convert identified datetime strings back to objects
        for key, value in data_copy.items():
            if isinstance(value, str):
                # Simple heuristic for ISO dates
                if len(value) >= 19 and (value[10] == 'T' or value[10] == ' '):
                    try:
                        data_copy[key] = datetime.fromisoformat(value)
                    except (ValueError, TypeError):
                        pass
        
        # Filter out keys that don't exist in the dataclass fields
        # This prevents errors from legacy or external data
        valid_fields = {f.name for f in field_names(cls)}
        filtered_data = {k: v for k, v in data_copy.items() if k in valid_fields}
        
        return cls(**filtered_data)

    def mark_updated(self) -> None:
        """Updates the internal modification timestamp."""
        self.updated_at = datetime.now()


def field_names(cls):
    """Helper to get dataclass field names."""
    import dataclasses
    return dataclasses.fields(cls)


class BaseEngine(ABC):
    """
    ⚙️ Base Engine
    
    The foundational logic container. Handles data persistence,
    configuration loading, and exposes standard performance metrics.
    """

    def __init__(self, data_dir: Union[str, Path] = ".antigravity"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.start_time = datetime.now()

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Aggregates and returns engine-specific telemetry and performance data."""
        pass

    def get_data_path(self, filename: str) -> Path:
        """Resolves a filename within the engine's managed data directory."""
        return self.data_dir / filename

    def save_data(self, filename: str, data: Any) -> Path:
        """Persists any serializable object to a JSON file."""
        path = self.get_data_path(filename)
        try:
            # Handle list of BaseModels or single BaseModel
            if hasattr(data, 'to_dict'):
                serializable = data.to_dict()
            elif isinstance(data, list):
                serializable = [i.to_dict() if hasattr(i, 'to_dict') else i for i in data]
            else:
                serializable = data

            path.write_text(
                json.dumps(serializable, ensure_ascii=False, indent=2, default=str),
                encoding='utf-8'
            )
            return path
        except Exception as e:
            logger.error(f"Failed to save engine data to {filename}: {e}")
            raise

    def load_data(self, filename: str, default: Any = None) -> Any:
        """Retrieves and parses JSON data from the engine's directory."""
        path = self.get_data_path(filename)
        if not path.exists():
            return default if default is not None else {}
        
        try:
            return json.loads(path.read_text(encoding='utf-8'))
        except Exception as e:
            logger.warning(f"Failed to load data from {filename}: {e}")
            return default if default is not None else {}

    def get_uptime_seconds(self) -> float:
        """Calculates seconds elapsed since engine initialization."""
        return (datetime.now() - self.start_time).total_seconds()

    def print_banner(self, title: str, subtitle: Optional[str] = None) -> None:
        """Renders a standardized visual header for CLI output."""
        print(f"\n{'═' * 60}")
        print(f"  🚀 {title.upper()}")
        if subtitle:
            print(f"     {subtitle}")
        print(f"{'{'}═{'}' * 60}\n")