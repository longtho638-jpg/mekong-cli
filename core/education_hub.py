"""
🎓 Education Hub - Learning Center
=====================================

Central hub connecting all Education roles.

Integrates:
- Course Manager (course_manager.py)
- Knowledge Base (knowledge_base.py) - existing
- Training Tracker (training_tracker.py)
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

# Import role modules
from core.course_manager import CourseManager
from core.knowledge_base import KnowledgeBase
from core.training_tracker import TrainingTracker


@dataclass
class EducationMetrics:
    """Department-wide metrics."""
    courses_available: int
    total_enrollments: int
    completion_rate: float
    articles_published: int
    learning_paths: int
    certifications: int
    avg_progress: float


class EducationHub:
    """
    Education Hub.
    
    Team learning center.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
        # Initialize role modules
        self.courses = CourseManager(agency_name)
        self.knowledge = KnowledgeBase(agency_name)
        self.training = TrainingTracker(agency_name)
    
    def get_department_metrics(self) -> EducationMetrics:
        """Get department-wide metrics."""
        course_stats = self.courses.get_stats()
        training_stats = self.training.get_stats()
        
        # Knowledge base uses resources dict directly
        kb_articles = len(self.knowledge.resources) if hasattr(self.knowledge, 'resources') else 0
        
        return EducationMetrics(
            courses_available=course_stats.get("courses", 0),
            total_enrollments=course_stats.get("enrollments", 0),
            completion_rate=course_stats.get("completion_rate", 0),
            articles_published=kb_articles,
            learning_paths=training_stats.get("paths", 0),
            certifications=training_stats.get("certifications", 0),
            avg_progress=training_stats.get("avg_progress", 0)
        )
    
    def format_hub_dashboard(self) -> str:
        """Format the hub dashboard."""
        metrics = self.get_department_metrics()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  🎓 EDUCATION HUB                                         ║",
            f"║  {self.agency_name:<50}  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📊 DEPARTMENT METRICS                                    ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📚 Courses Available:  {metrics.courses_available:>5}                          ║",
            f"║    👥 Total Enrollments:  {metrics.total_enrollments:>5}                          ║",
            f"║    ✅ Completion Rate:    {metrics.completion_rate:>5.0f}%                         ║",
            f"║    📖 Articles Published: {metrics.articles_published:>5}                          ║",
            f"║    📚 Learning Paths:     {metrics.learning_paths:>5}                          ║",
            f"║    🏆 Certifications:     {metrics.certifications:>5}                          ║",
            f"║    📈 Avg Progress:       {metrics.avg_progress:>5.0f}%                         ║",
            "║                                                           ║",
            "║  🔗 EDUCATION ROLES                                       ║",
            "║  ─────────────────────────────────────────────────────── ║",
            "║    📚 Course Manager    → LMS, lessons, enrollments      ║",
            "║    📖 Knowledge Base    → Articles, FAQs, docs           ║",
            "║    🎯 Training Tracker  → Paths, certs, team progress    ║",
            "║                                                           ║",
            "║  📋 EDUCATION TEAM                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📚 Courses          │ {metrics.courses_available} courses, {metrics.total_enrollments} enrolled    ║",
            f"║    📖 Knowledge        │ {metrics.articles_published} articles published    ║",
            f"║    🎯 Training         │ {metrics.learning_paths} paths, {metrics.certifications} certs        ║",
            "║                                                           ║",
            "║  [📚 Courses]  [📖 Knowledge]  [🎯 Training]              ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Never stop learning!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ]
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    hub = EducationHub("Saigon Digital Hub")
    
    print("🎓 Education Hub")
    print("=" * 60)
    print()
    
    print(hub.format_hub_dashboard())
