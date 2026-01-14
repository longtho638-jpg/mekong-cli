"""
Base classes for AntigravityKit.

Provides shared functionality across all core modules:
- BaseModel: Serializable data models
- BaseEngine: Engine base with common methods
- Serializable: Mixin for JSON serialization

🏯 "Nền tảng vững chắc" - Solid foundation
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import Dict, Any, Optional, TypeVar, Type
import json
from pathlib import Path


T = TypeVar('T', bound='BaseModel')


@dataclass
class BaseModel:
    """
    Base model with serialization support.
    
    All data models should inherit from this class.
    """
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary."""
        data = asdict(self)
        # Convert datetime to ISO format
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data

    def to_json(self) -> str:
        """Convert model to JSON string."""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)

    @classmethod
    def from_dict(cls: Type[T], data: Dict[str, Any]) -> T:
        """Create model from dictionary."""
        # Convert ISO strings back to datetime
        for key, value in data.items():
            if isinstance(value, str) and 'T' in value:
                try:
                    data[key] = datetime.fromisoformat(value)
                except ValueError:
                    pass
        return cls(**data)

    def update(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now()


class BaseEngine(ABC):
    """
    Base engine class with common functionality.
    
    All engine classes (RevenueEngine, ClientMagnet, etc.)
    should inherit from this.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics. Must be implemented."""
        pass

    def get_data_path(self, filename: str) -> Path:
        """Get full path for a data file."""
        return self.data_dir / filename

    def save_json(self, filename: str, data: Any) -> Path:
        """Save data to JSON file."""
        path = self.get_data_path(filename)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        return path

    def load_json(self, filename: str, default: Any = None) -> Any:
        """Load data from JSON file."""
        path = self.get_data_path(filename)
        if not path.exists():
            return default if default is not None else {}
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def print_banner(self, title: str) -> None:
        """Print formatted banner."""
        print(f"\n{'=' * 60}")
        print(f"  🚀 {title}")
        print(f"{'=' * 60}\n")
