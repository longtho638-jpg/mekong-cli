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

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import uuid


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
    """Enrollment status."""
    ENROLLED = "enrolled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DROPPED = "dropped"


@dataclass
class Lesson:
    """A course lesson."""
    id: str
    title: str
    duration_mins: int
    content_type: str = "video"  # video, article, quiz
    completed: bool = False


@dataclass
class Course:
    """A training course."""
    id: str
    title: str
    description: str
    category: CourseCategory
    level: CourseLevel
    lessons: List[Lesson] = field(default_factory=list)
    duration_hours: float = 0
    instructor: str = ""
    enrollments: int = 0
    completions: int = 0


@dataclass
class Enrollment:
    """A course enrollment."""
    id: str
    course_id: str
    employee_name: str
    status: EnrollmentStatus = EnrollmentStatus.ENROLLED
    progress: int = 0  # 0-100
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


class CourseManager:
    """
    Course Manager - Internal LMS.
    
    Train your team effectively.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.courses: Dict[str, Course] = {}
        self.enrollments: List[Enrollment] = []
        
        self._init_demo_courses()
    
    def _init_demo_courses(self):
        """Initialize demo courses."""
        courses = [
            ("SEO Fundamentals", CourseCategory.MARKETING, CourseLevel.BEGINNER, 4),
            ("Advanced React", CourseCategory.TECHNICAL, CourseLevel.ADVANCED, 8),
            ("UI/UX Best Practices", CourseCategory.DESIGN, CourseLevel.INTERMEDIATE, 6),
            ("Client Communication", CourseCategory.SOFT_SKILLS, CourseLevel.BEGINNER, 2),
            ("Leadership 101", CourseCategory.LEADERSHIP, CourseLevel.INTERMEDIATE, 4),
        ]
        
        for title, cat, level, hours in courses:
            self.create_course(title, f"Learn {title.lower()}", cat, level, hours)
    
    def create_course(
        self,
        title: str,
        description: str,
        category: CourseCategory,
        level: CourseLevel,
        duration_hours: float,
        instructor: str = ""
    ) -> Course:
        """Create a new course."""
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
        return course
    
    def add_lesson(
        self,
        course: Course,
        title: str,
        duration_mins: int,
        content_type: str = "video"
    ) -> Lesson:
        """Add a lesson to a course."""
        lesson = Lesson(
            id=f"LSN-{uuid.uuid4().hex[:6].upper()}",
            title=title,
            duration_mins=duration_mins,
            content_type=content_type
        )
        course.lessons.append(lesson)
        return lesson
    
    def enroll_employee(self, course: Course, employee_name: str) -> Enrollment:
        """Enroll an employee in a course."""
        enrollment = Enrollment(
            id=f"ENR-{uuid.uuid4().hex[:6].upper()}",
            course_id=course.id,
            employee_name=employee_name
        )
        self.enrollments.append(enrollment)
        course.enrollments += 1
        return enrollment
    
    def update_progress(self, enrollment: Enrollment, progress: int):
        """Update enrollment progress."""
        enrollment.progress = min(100, progress)
        
        if progress > 0:
            enrollment.status = EnrollmentStatus.IN_PROGRESS
        
        if progress >= 100:
            enrollment.status = EnrollmentStatus.COMPLETED
            enrollment.completed_at = datetime.now()
            
            # Update course completions
            course = self.courses.get(enrollment.course_id)
            if course:
                course.completions += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get LMS statistics."""
        total_enrollments = len(self.enrollments)
        completed = sum(1 for e in self.enrollments if e.status == EnrollmentStatus.COMPLETED)
        in_progress = sum(1 for e in self.enrollments if e.status == EnrollmentStatus.IN_PROGRESS)
        avg_progress = sum(e.progress for e in self.enrollments) / total_enrollments if total_enrollments else 0
        
        return {
            "courses": len(self.courses),
            "enrollments": total_enrollments,
            "completed": completed,
            "in_progress": in_progress,
            "avg_progress": avg_progress,
            "completion_rate": (completed / total_enrollments * 100) if total_enrollments else 0
        }
    
    def format_dashboard(self) -> str:
        """Format course manager dashboard."""
        stats = self.get_stats()
        
        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  📚 COURSE MANAGER - INTERNAL LMS                         ║",
            f"║  {stats['courses']} courses │ {stats['enrollments']} enrolled │ {stats['completion_rate']:.0f}% done  ║",
            "╠═══════════════════════════════════════════════════════════╣",
            "║  📖 COURSE CATALOG                                        ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ]
        
        level_icons = {"beginner": "🌱", "intermediate": "🌿",
                      "advanced": "🌳", "expert": "⭐"}
        cat_icons = {"technical": "💻", "marketing": "📢", "design": "🎨",
                    "soft_skills": "🗣️", "leadership": "👑", "tools": "🔧"}
        
        for course in list(self.courses.values())[:5]:
            l_icon = level_icons.get(course.level.value, "📚")
            c_icon = cat_icons.get(course.category.value, "📖")
            lines.append(f"║    {c_icon} {l_icon} {course.title[:20]:<20} │ {course.duration_hours:.0f}h │ {course.enrollments:>2}  ║")
        
        lines.extend([
            "║                                                           ║",
            "║  📊 LEARNING METRICS                                      ║",
            "║  ─────────────────────────────────────────────────────── ║",
            f"║    📚 Total Courses:      {stats['courses']:>12}              ║",
            f"║    👥 Enrollments:        {stats['enrollments']:>12}              ║",
            f"║    🔄 In Progress:        {stats['in_progress']:>12}              ║",
            f"║    ✅ Completed:          {stats['completed']:>12}              ║",
            f"║    📈 Avg Progress:       {stats['avg_progress']:>12.0f}%              ║",
            "║                                                           ║",
            "║  🏆 TOP LEARNERS                                          ║",
            "║  ─────────────────────────────────────────────────────── ║",
        ])
        
        # Top learners by completions
        learner_completions = {}
        for e in self.enrollments:
            if e.status == EnrollmentStatus.COMPLETED:
                learner_completions[e.employee_name] = learner_completions.get(e.employee_name, 0) + 1
        
        for name, count in sorted(learner_completions.items(), key=lambda x: x[1], reverse=True)[:3]:
            lines.append(f"║    🏆 {name:<20} │ {count} courses completed     ║")
        
        lines.extend([
            "║                                                           ║",
            "║  [📚 Courses]  [👥 Learners]  [📊 Reports]                ║",
            "╠═══════════════════════════════════════════════════════════╣",
            f"║  🏯 {self.agency_name} - Upskill your team!               ║",
            "╚═══════════════════════════════════════════════════════════╝",
        ])
        
        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    cm = CourseManager("Saigon Digital Hub")
    
    print("📚 Course Manager")
    print("=" * 60)
    print()
    
    # Enroll some employees
    seo = list(cm.courses.values())[0]
    react = list(cm.courses.values())[1]
    
    e1 = cm.enroll_employee(seo, "Alex Nguyen")
    e2 = cm.enroll_employee(seo, "Sarah Tran")
    e3 = cm.enroll_employee(react, "Mike Chen")
    
    cm.update_progress(e1, 100)
    cm.update_progress(e2, 50)
    cm.update_progress(e3, 75)
    
    print(cm.format_dashboard())
