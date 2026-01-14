"""
🎓 Education Hub - Learning Center
=====================================

Central hub connecting all Education roles with their operational tools.

Integrates:
- Course Manager
- Knowledge Base
- Training Tracker
"""

import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from datetime import datetime

# Import existing modules with fallback for direct testing
try:
    from core.course_manager import CourseManager
    from core.knowledge_base import KnowledgeBase
    from core.training_tracker import TrainingTracker
except ImportError:
    from course_manager import CourseManager
    from knowledge_base import KnowledgeBase
    from training_tracker import TrainingTracker

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class EducationMetrics:
    """Department-wide metrics container."""
    courses_available: int = 0
    total_enrollments: int = 0
    completion_rate: float = 0.0
    articles_published: int = 0
    learning_paths: int = 0
    certifications: int = 0
    avg_progress: float = 0.0


class EducationHub:
    """
    Education Hub System.
    
    Orchestrates team training, knowledge sharing, and competency tracking.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        logger.info(f"Initializing Education Hub for {agency_name}")
        try:
            self.courses = CourseManager(agency_name)
            self.knowledge = KnowledgeBase(agency_name)
            self.training = TrainingTracker(agency_name)
        except Exception as e:
            logger.error(f"Education Hub initialization failed: {e}")
            raise
    
    def get_department_metrics(self) -> EducationMetrics:
        """Aggregate data from all learning and development sub-modules."""
        metrics = EducationMetrics()
        
        try:
            # 1. Course metrics
            c_stats = self.courses.get_stats()
            metrics.courses_available = c_stats.get("courses", 0)
            metrics.total_enrollments = c_stats.get("enrollments", 0)
            metrics.completion_rate = float(c_stats.get("completion_rate", 0.0))
            
            # 2. Knowledge metrics
            metrics.articles_published = len(getattr(self.knowledge, 'resources', {}))
            
            # 3. Training metrics
            t_stats = self.training.get_stats()
            metrics.learning_paths = t_stats.get("paths", 0)
            metrics.certifications = t_stats.get("certifications", 0)
            metrics.avg_progress = float(t_stats.get("avg_progress", 0.0))
            
        except Exception as e:
            logger.warning(f"Error aggregating Education metrics: {e}")
            
        return metrics
    
    def format_hub_dashboard(self) -> str:
        """Render the Education Hub Dashboard."""
        m = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎓 EDUCATION HUB{' ' * 41}║",
            f"║  {self.agency_name[:50]:<50}         ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 LEARNING & DEVELOPMENT METRICS                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📚 Courses Available:  {m.courses_available:>5}                          ║",
            f"║    👥 Total Enrollments:  {m.total_enrollments:>5}                          ║",
            f"║    ✅ Completion Rate:    {m.completion_rate:>5.0f}%                         ║",
            f"║    📖 Articles Published: {m.articles_published:>5}                          ║",
            f"║    📚 Learning Paths:     {m.learning_paths:>5}                          ║",
            f"║    🏆 Certifications:     {m.certifications:>5}                          ║",
            f"║    📈 Avg Progress:       {m.avg_progress:>5.0f}%                         ║",
            "║                                                           ║",
            "║  🔗 SERVICE INTEGRATIONS                                  ║",
            "║  ───────────────────────────────────────────────────────  ║",
            "║    📚 LMS (Course Manager) │ 📖 KB (Knowledge Base)       ║",
            "║    🎯 Tracker (Training Tracker)                          ║",
            "║                                                           ║",
            "║  📋 TEAM SNAPSHOT                                         ║",
            "║  ───────────────────────────────────────────────────────  ║",
            f"║    📚 Courses  │ {m.courses_available} courses, {m.total_enrollments} enrolled           ║",
            f"║    📖 Knowledge│ {m.articles_published} articles published                   ║",
            f"║    🎯 Training │ {m.learning_paths} paths, {m.certifications} certs               ║",
            "║                                                           ║",
            "║  [📚 Catalog]  [📖 Library]  [🎯 Paths]  [⚙️ Settings]    ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Growth!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("🎓 Initializing Education Hub...")
    print("=" * 60)
    
    try:
        hub = EducationHub("Saigon Digital Hub")
        print("\n" + hub.format_hub_dashboard())
    except Exception as e:
        logger.error(f"Hub Error: {e}")
