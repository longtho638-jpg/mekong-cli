import pytest

from backend.agents.hrops.logic import CandidateStage, JobStatus, RecruitmentAgent


class TestRecruitmentAgent:
    def test_initialization(self):
        agent = RecruitmentAgent()
        assert agent.name == "Recruitment"
        assert agent.status == "ready"
        assert len(agent.jobs) == 0
        assert len(agent.candidates) == 0

    def test_create_job(self):
        agent = RecruitmentAgent()
        job = agent.create_job(
            title="Senior Engineer",
            department="Engineering",
            location="Remote",
            salary="$120k-$150k",
        )

        assert job.id in agent.jobs
        assert job.title == "Senior Engineer"
        assert job.status == JobStatus.OPEN
        assert agent.jobs[job.id] == job

    def test_add_candidate(self):
        agent = RecruitmentAgent()
        job = agent.create_job(
            title="Product Manager", department="Product", location="On-site", salary="$100k-$130k"
        )

        candidate = agent.add_candidate(
            name="John Doe", email="john@example.com", job_id=job.id, rating=4
        )

        assert candidate.id in agent.candidates
        assert candidate.name == "John Doe"
        assert candidate.job_id == job.id
        assert candidate.stage == CandidateStage.APPLIED
        assert job.candidates_count == 1

    def test_get_stats(self):
        agent = RecruitmentAgent()
        agent.create_job("J1", "D1", "L1", "S1")
        agent.create_job("J2", "D2", "L2", "S2")

        job = list(agent.jobs.values())[0]
        agent.add_candidate("C1", "E1", job.id)

        stats = agent.get_stats()
        assert stats["open_jobs"] == 2
        assert stats["total_candidates"] == 1
