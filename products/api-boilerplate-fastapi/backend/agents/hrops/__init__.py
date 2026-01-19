"""
HROps Agents Package
Recruitment + Employee
"""

from .recruitment_agent import RecruitmentAgent, Job, Candidate, JobStatus, CandidateStage
from .employee_agent import EmployeeAgent, Employee, EmployeeStatus, Department

__all__ = [
    # Recruitment
    "RecruitmentAgent", "Job", "Candidate", "JobStatus", "CandidateStage",
    # Employee
    "EmployeeAgent", "Employee", "EmployeeStatus", "Department",
]
