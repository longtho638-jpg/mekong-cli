"""
📚 Course Manager - Internal LMS
==================================

Manage team training courses.
Upskill your team!

Features:
- Course catalog
- Lesson management
- Progress tracking
- Completion certificates
"""

import uuid
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CourseLevel(Enum):
    """Course difficulty levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class CourseCategory(Enum):
    """Course categories."""
    TECHNICAL = "technical"
    MARKETING = "marketing"
    DESIGN = "design"
    SOFT_SKILLS = "soft_skills"
    LEADERSHIP = "leadership"
    TOOLS = "tools"


class EnrollmentStatus(Enum):
    """Enrollment tracking status."""
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"


@dataclass
class Lesson:
    """A course lesson entity."""
    id: str
    title: str
    duration_mins: int
    content_type: str = "video"  # video, article, quiz
    completed: bool = False


@dataclass
class Course:
    """A training course entity."""
    id: str
    title: str
    description: str
    category: CourseCategory
    level: CourseLevel
    lessons: List[Lesson] = field(default_factory=list)
    duration_hours: float = 0.0
    instructor: str = ""
    enrollments: int = 0
    completions: int = 0

    def __post_init__(self):
        if self.duration_hours < 0:
            raise ValueError("Duration cannot be negative")


@dataclass
class Enrollment:
    """A course enrollment record."""
    id: str
    course_id: str
    employee_name: str
    status: EnrollmentStatus = EnrollmentStatus.ENROLLED
    _progress: int = 0  # 0-100
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

    @property
    def progress(self) -> int:
        return self._progress

    @progress.setter
    def progress(self, value: int) -> None:
        if not 0 <= value <= 100:
            raise ValueError("Progress must be between 0 and 100")
        self._progress = value


class CourseManager:
    """
    Course Manager System.
    
    Internal learning management system for upskilling the agency team.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.courses: Dict[str, Course] = {}
        self.enrollments: List[Enrollment] = []
        
        logger.info(f"Course Manager initialized for {agency_name}")
        self._init_defaults()
    
    def _init_defaults(self):
        """Pre-populate with standard digital agency courses."""
        default_courses = [
            ("SEO Fundamentals", CourseCategory.MARKETING, CourseLevel.BEGINNER, 4.0),
            ("Advanced React", CourseCategory.TECHNICAL, CourseLevel.ADVANCED, 8.0),
            ("UI/UX Principles", CourseCategory.DESIGN, CourseLevel.INTERMEDIATE, 6.0),
        ]
        for title, cat, level, hours in default_courses:
            self.create_course(title, f"Standard {title} guide", cat, level, hours)
    
    def create_course(
        self,
        title: str,
        description: str,
        category: CourseCategory,
        level: CourseLevel,
        duration_hours: float,
        instructor: str = "Agency AI"
    ) -> Course:
        """Add a new course to the curriculum."""
        if not title:
            raise ValueError("Course title is required")

        course = Course(
            id=f"CRS-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            description=description,
            category=category,
            level=level,
            duration_hours=duration_hours,
            instructor=instructor
        )
        self.courses[course.id] = course
        logger.info(f"Course created: {title} ({category.value})")
        return course
    
    def enroll_employee(self, course_id: str, employee_name: str) -> Optional[Enrollment]:
        """Enroll an employee in an existing course."""
        if course_id not in self.courses:
            logger.error(f"Course {course_id} not found")
            return None

        enrollment = Enrollment(
            id=f"ENR-{uuid.uuid4().hex[:6].upper()}",
            course_id=course_id,
            employee_name=employee_name
        )
        self.enrollments.append(enrollment)
        self.courses[course_id].enrollments += 1
        logger.info(f"Employee {employee_name} enrolled in {self.courses[course_id].title}")
        return enrollment
    
    def update_progress(self, enrollment_id: str, progress: int) -> bool:
        """Update progress for a specific enrollment."""
        for e in self.enrollments:
            if e.id == enrollment_id:
                try:
                    e.progress = progress
                    if progress >= 100:
                        e.status = EnrollmentStatus.COMPLETED
                        e.completed_at = datetime.now()
                        if e.course_id in self.courses:
                            self.courses[e.course_id].completions += 1
                    elif progress > 0:
                        e.status = EnrollmentStatus.IN_PROGRESS
                    
                    logger.debug(f"Progress updated for {e.employee_name}: {progress}%")
                    return True
                except ValueError as err:
                    logger.error(f"Invalid progress update: {err}")
                    return False
        return False
    
    def format_dashboard(self) -> str:
        """Render ASCII LMS Dashboard."""
        total = len(self.courses)
        completions = sum(1 for e in self.enrollments if e.status == EnrollmentStatus.COMPLETED)
        rate = (completions / len(self.enrollments) * 100) if self.enrollments else 0.0
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 COURSE MANAGER - INTERNAL LMS{' ' * 26}║",
            f"║  {total} courses │ {len(self.enrollments)} enrolled │ {rate:.0f}% completion rate{' ' * 11}║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📖 COURSE CATALOG                                        ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ]
        
        level_icons = {CourseLevel.BEGINNER: "🌱", CourseLevel.INTERMEDIATE: "🌿", CourseLevel.ADVANCED: "🌳", CourseLevel.EXPERT: "⭐"}
        cat_icons = {CourseCategory.TECHNICAL: "💻", CourseCategory.MARKETING: "📢", CourseCategory.DESIGN: "🎨"}
        
        for c in list(self.courses.values())[:5]:
            l_icon = level_icons.get(c.level, "📚")
            title_disp = (c.title[:20] + '..') if len(c.title) > 22 else c.title
            lines.append(f"║    {l_icon} {title_disp:<22} │ {c.duration_hours:.0f}h │ {c.enrollments:>2} enr  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  🏆 TOP LEARNERS                                          ║",
            "║  ───────────────────────────────────────────────────────  ║",
        ])
        
        # Aggregate completions by employee
        learner_map = {}
        for e in self.enrollments:
            if e.status == EnrollmentStatus.COMPLETED:
                learner_map[e.employee_name] = learner_map.get(e.employee_name, 0) + 1
        
        sorted_learners = sorted(learner_map.items(), key=lambda x: x[1], reverse=True)[:3]
        if not sorted_learners:
            lines.append("║    No course completions yet. Keep studying!              ║")
        else:
            for name, count in sorted_learners:
                lines.append(f"║    🏆 {name:<20} │ {count} courses completed     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📚 Catalog]  [👥 Learners]  [📊 Analysis]  [⚙️ Settings] ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name[:40]:<40} - Upskill!            ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    print("📚 Initializing Course Manager...")
    print("=" * 60)
    
    try:
        lms = CourseManager("Saigon Digital Hub")
        # Sample interaction
        if lms.courses:
            cid = list(lms.courses.keys())[0]
            enroll = lms.enroll_employee(cid, "Alex Nguyen")
            if enroll:
                lms.update_progress(enroll.id, 100)
                
        print("\n" + lms.format_dashboard())
        
    except Exception as e:
        logger.error(f"LMS Error: {e}")
