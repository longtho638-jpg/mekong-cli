"""
Training Agent - Learning & Course Management
Manages training courses, learning paths, and completions.
"""

import random
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, Optional


class CourseStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class EnrollmentStatus(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EXPIRED = "expired"


class CourseType(Enum):
    MANDATORY = "mandatory"
    OPTIONAL = "optional"
    CERTIFICATION = "certification"


@dataclass
class Course:
    """Training course"""

    id: str
    title: str
    description: str
    course_type: CourseType
    duration_hours: float
    status: CourseStatus = CourseStatus.ACTIVE
    enrollments: int = 0
    completions: int = 0


@dataclass
class Enrollment:
    """Course enrollment"""

    id: str
    employee_id: str
    employee_name: str
    course_id: str
    course_title: str
    status: EnrollmentStatus = EnrollmentStatus.NOT_STARTED
    progress: int = 0  # 0-100
    enrolled_at: datetime = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.enrolled_at is None:
            self.enrolled_at = datetime.now()


class TrainingAgent:
    """
    Training Agent - Quản lý Đào tạo

    Responsibilities:
    - Manage courses
    - Track learning paths
    - Monitor completions
    - Handle certifications
    """

    def __init__(self):
        self.name = "Training"
        self.status = "ready"
        self.courses: Dict[str, Course] = {}
        self.enrollments: Dict[str, Enrollment] = {}

    def create_course(
        self, title: str, description: str, course_type: CourseType, duration_hours: float
    ) -> Course:
        """Create training course"""
        course_id = f"course_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"

        course = Course(
            id=course_id,
            title=title,
            description=description,
            course_type=course_type,
            duration_hours=duration_hours,
        )

        self.courses[course_id] = course
        return course

    def enroll(self, employee_id: str, employee_name: str, course_id: str) -> Enrollment:
        """Enroll employee in course"""
        if course_id not in self.courses:
            raise ValueError(f"Course not found: {course_id}")

        enrollment_id = f"enroll_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        course = self.courses[course_id]

        enrollment = Enrollment(
            id=enrollment_id,
            employee_id=employee_id,
            employee_name=employee_name,
            course_id=course_id,
            course_title=course.title,
        )

        self.enrollments[enrollment_id] = enrollment
        course.enrollments += 1

        return enrollment

    def update_progress(self, enrollment_id: str, progress: int) -> Enrollment:
        """Update enrollment progress"""
        if enrollment_id not in self.enrollments:
            raise ValueError(f"Enrollment not found: {enrollment_id}")

        enrollment = self.enrollments[enrollment_id]
        enrollment.progress = min(100, max(0, progress))

        if enrollment.progress > 0:
            enrollment.status = EnrollmentStatus.IN_PROGRESS

        if enrollment.progress >= 100:
            enrollment.status = EnrollmentStatus.COMPLETED
            enrollment.completed_at = datetime.now()

            if enrollment.course_id in self.courses:
                self.courses[enrollment.course_id].completions += 1

        return enrollment

    def get_stats(self) -> Dict:
        """Get training statistics"""
        courses = list(self.courses.values())
        enrollments = list(self.enrollments.values())
        completed = [e for e in enrollments if e.status == EnrollmentStatus.COMPLETED]

        return {
            "total_courses": len(courses),
            "total_enrollments": len(enrollments),
            "completed": len(completed),
            "completion_rate": f"{len(completed) / len(enrollments) * 100:.0f}%"
            if enrollments
            else "0%",
            "total_hours": sum(c.duration_hours * c.completions for c in courses),
        }


# Demo
if __name__ == "__main__":
    agent = TrainingAgent()

    print("📚 Training Agent Demo\n")

    # Create courses
    c1 = agent.create_course("Python Fundamentals", "Learn Python basics", CourseType.MANDATORY, 8)
    c2 = agent.create_course(
        "AWS Certification Prep", "Prepare for AWS exam", CourseType.CERTIFICATION, 40
    )

    print(f"📖 Course: {c1.title}")
    print(f"   Type: {c1.course_type.value}")
    print(f"   Duration: {c1.duration_hours}h")

    # Enroll
    e1 = agent.enroll("EMP001", "Nguyen A", c1.id)
    e2 = agent.enroll("EMP002", "Tran B", c1.id)

    # Progress
    agent.update_progress(e1.id, 100)
    agent.update_progress(e2.id, 60)

    print(f"\n✅ Completed: {e1.employee_name}")
    print(f"📊 In Progress: {e2.employee_name} ({e2.progress}%)")

    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Courses: {stats['total_courses']}")
    print(f"   Completion Rate: {stats['completion_rate']}")
