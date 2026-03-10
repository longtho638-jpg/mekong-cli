"""Tests for Mekong Multi-Agent Collaboration (AGI v2)."""

import unittest

from src.core.collaboration import (
    AgentMessage,
    AgentProfile,
    AgentRole,
    CollaborationProtocol,
    DebateProposal,
    MessageType,
    ReviewResult,
)


class TestAgentProfile(unittest.TestCase):
    def test_default_values(self):
        p = AgentProfile(name="agent1")
        self.assertEqual(p.role, AgentRole.IMPLEMENTER)
        self.assertTrue(p.active)
        self.assertAlmostEqual(p.success_rate, 0.5)

    def test_success_rate(self):
        p = AgentProfile(name="a", success_count=8, failure_count=2)
        self.assertAlmostEqual(p.success_rate, 0.8)

    def test_best_specialization(self):
        p = AgentProfile(
            name="a",
            specializations={"deploy": 0.9, "test": 0.6, "build": 0.3},
        )
        self.assertEqual(p.best_specialization, "deploy")

    def test_no_specialization(self):
        p = AgentProfile(name="a")
        self.assertEqual(p.best_specialization, "general")


class TestDebateProposal(unittest.TestCase):
    def test_vote_score(self):
        p = DebateProposal(
            proposer="a",
            approach="plan A",
            votes_for=["b", "c"],
            votes_against=["d"],
        )
        self.assertEqual(p.vote_score, 1)


class TestCollaborationProtocol(unittest.TestCase):
    def test_register_agent(self):
        proto = CollaborationProtocol()
        profile = proto.register_agent("agent1", AgentRole.PLANNER)
        self.assertEqual(profile.name, "agent1")
        self.assertEqual(profile.role, AgentRole.PLANNER)

    def test_unregister_agent(self):
        proto = CollaborationProtocol()
        proto.register_agent("agent1")
        self.assertTrue(proto.unregister_agent("agent1"))
        self.assertFalse(proto.unregister_agent("nonexistent"))

    def test_send_message(self):
        proto = CollaborationProtocol()
        proto.register_agent("a")
        proto.register_agent("b")
        msg = proto.send_message("a", "b", MessageType.TASK_REQUEST, "do this")
        self.assertEqual(msg.sender, "a")
        self.assertEqual(msg.receiver, "b")

    def test_request_task(self):
        proto = CollaborationProtocol()
        proto.register_agent("requester", AgentRole.PLANNER)
        proto.register_agent("worker", AgentRole.IMPLEMENTER)
        assignee = proto.request_task("requester", "build feature")
        self.assertEqual(assignee, "worker")

    def test_request_task_no_agents(self):
        proto = CollaborationProtocol()
        proto.register_agent("solo")
        self.assertIsNone(proto.request_task("solo", "task"))

    def test_submit_review(self):
        proto = CollaborationProtocol()
        proto.register_agent("reviewer", AgentRole.REVIEWER)
        review = proto.submit_review(
            "reviewer", "code.py",
            approved=True, score=0.9,
            feedback=["Looks good"],
        )
        self.assertTrue(review.approved)
        self.assertAlmostEqual(review.score, 0.9)

    def test_debate_flow(self):
        proto = CollaborationProtocol()
        proto.register_agent("a")
        proto.register_agent("b")

        debate_id = proto.start_debate("Best approach for deploy")
        p1 = proto.propose(debate_id, "a", "Blue/Green", "Safe rollback")
        p2 = proto.propose(debate_id, "b", "Canary", "Gradual rollout")

        self.assertIsNotNone(p1)
        self.assertIsNotNone(p2)

        proto.vote(debate_id, "a", p2.id, True)
        proto.vote(debate_id, "b", p1.id, False)

        winner = proto.resolve_debate(debate_id)
        self.assertIsNotNone(winner)

    def test_debate_nonexistent(self):
        proto = CollaborationProtocol()
        self.assertIsNone(proto.propose("fake", "a", "plan"))
        self.assertIsNone(proto.resolve_debate("fake"))

    def test_assign_roles(self):
        proto = CollaborationProtocol()
        proto.register_agent("planner", AgentRole.PLANNER)
        proto.register_agent("dev", AgentRole.IMPLEMENTER)
        proto.register_agent("qa", AgentRole.TESTER)

        assignments = proto.assign_roles("build feature")
        self.assertIn(AgentRole.PLANNER, assignments)
        self.assertIn(AgentRole.IMPLEMENTER, assignments)

    def test_update_specialization(self):
        proto = CollaborationProtocol()
        proto.register_agent("a")
        proto.update_specialization("a", "deploy", True)
        proto.update_specialization("a", "deploy", True)
        agent = proto._agents["a"]
        self.assertGreater(agent.specializations["deploy"], 0.5)
        self.assertEqual(agent.success_count, 2)

    def test_get_messages(self):
        proto = CollaborationProtocol()
        proto.register_agent("a")
        proto.register_agent("b")
        proto.send_message("a", "b", MessageType.STATUS_UPDATE, "hello")
        msgs = proto.get_messages("b")
        self.assertGreater(len(msgs), 0)

    def test_get_stats(self):
        proto = CollaborationProtocol()
        proto.register_agent("a")
        proto.register_agent("b")
        stats = proto.get_stats()
        self.assertEqual(stats["total_agents"], 2)
        self.assertEqual(stats["active_agents"], 2)


if __name__ == "__main__":
    unittest.main()
