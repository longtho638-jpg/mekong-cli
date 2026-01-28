"""
HROps Agents Package
Recruitment + Employee
"""

from .employee_agent import Department, Employee, EmployeeAgent, EmployeeStatus
from .logic import Candidate, CandidateStage, Job, JobStatus, RecruitmentAgent

__all__ = [
    # Recruitment
    "RecruitmentAgent",
    "Job",
    "Candidate",
    "JobStatus",
    "CandidateStage",
    # Employee
    "EmployeeAgent",
    "Employee",
    "EmployeeStatus",
    "Department",
]
