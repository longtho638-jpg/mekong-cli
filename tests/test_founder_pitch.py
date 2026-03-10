"""Tests for src/core/founder_pitch.py."""

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.founder_pitch import (
    CURVEBALL_QUESTIONS,
    STANDARD_QUESTIONS,
    add_round,
    create_session,
    evaluate_pitch,
    get_investor_persona,
    get_session_questions,
    load_session,
    save_session,
)


class TestInvestorPersona(unittest.TestCase):
    def test_yc(self):
        p = get_investor_persona("yc")
        self.assertEqual(p.type, "yc")
        self.assertIn("Direct", p.style)

    def test_vc(self):
        p = get_investor_persona("vc")
        self.assertIn("market", p.philosophy.lower())

    def test_angel(self):
        p = get_investor_persona("angel")
        self.assertIn("founder", p.philosophy.lower())

    def test_unknown_raises(self):
        with self.assertRaises(ValueError):
            get_investor_persona("unknown")


class TestQuestions(unittest.TestCase):
    def test_standard_count(self):
        self.assertEqual(len(STANDARD_QUESTIONS), 10)

    def test_curveball_count(self):
        self.assertGreaterEqual(len(CURVEBALL_QUESTIONS), 5)

    def test_session_questions(self):
        qs = get_session_questions(2)
        self.assertEqual(len(qs), 12)  # 10 standard + 2 curveball

    def test_session_questions_all_curveballs(self):
        qs = get_session_questions(5)
        self.assertEqual(len(qs), 15)


class TestEvaluatePitch(unittest.TestCase):
    def test_good_answers(self):
        answers = {
            1: "We build an AI-powered operating system for solo founders. Revenue $10K MRR, growing 20% monthly with 50 customers.",
            2: "$10K MRR, 50 paying customers, 20% growth rate month over month consistently.",
            3: "AI models are cheap now, solo founders are increasing — timing is perfect for AI ops.",
        }
        fb = evaluate_pitch(1, "yc", answers)
        self.assertIn(fb.result, ("INVEST", "MAYBE", "PASS"))
        self.assertGreater(fb.overall_score, 0)

    def test_weak_answers(self):
        answers = {1: "We do stuff.", 2: "Maybe some."}
        fb = evaluate_pitch(1, "vc", answers)
        self.assertIn(fb.result, ("PASS", "MAYBE"))

    def test_with_deck_slides(self):
        answers = {1: "AI company doing great things with revenue growth and customer traction."}
        slides = {"cover": "Company X — AI for Founders", "traction": "$10K MRR, 50 customers"}
        fb = evaluate_pitch(1, "angel", answers, slides)
        self.assertGreater(len(fb.slide_feedback), 0)

    def test_invalid_investor_raises(self):
        with self.assertRaises(ValueError):
            evaluate_pitch(1, "invalid", {1: "answer"})

    def test_empty_answers(self):
        fb = evaluate_pitch(1, "yc", {})
        self.assertEqual(fb.result, "PASS")
        self.assertEqual(fb.overall_score, 0)


class TestSession(unittest.TestCase):
    def test_create_session(self):
        session = create_session("yc")
        self.assertEqual(session.investor_type, "yc")
        self.assertEqual(len(session.rounds), 0)

    def test_add_round(self):
        session = create_session("vc")
        fb = evaluate_pitch(1, "vc", {1: "Good answer about revenue and growth metrics."})
        session = add_round(session, fb)
        self.assertEqual(len(session.rounds), 1)
        self.assertEqual(session.score_trend, [fb.overall_score])

    def test_multi_round(self):
        session = create_session("angel")
        for i in range(3):
            fb = evaluate_pitch(i + 1, "angel", {1: f"Round {i} with revenue ${i}K MRR growth."})
            session = add_round(session, fb)
        self.assertEqual(len(session.rounds), 3)
        self.assertEqual(len(session.score_trend), 3)


class TestSaveLoad(unittest.TestCase):
    def test_save_session(self):
        with TemporaryDirectory() as tmpdir:
            session = create_session("yc")
            fb = evaluate_pitch(1, "yc", {1: "We have 100 customers paying $50/mo with 5% churn."})
            session = add_round(session, fb)
            path = save_session(tmpdir, session)
            self.assertTrue(Path(path).exists())

    def test_load_session(self):
        with TemporaryDirectory() as tmpdir:
            session = create_session("yc")
            fb = evaluate_pitch(1, "yc", {1: "Good revenue answer with customers and growth."})
            session = add_round(session, fb)
            save_session(tmpdir, session)

            loaded = load_session(tmpdir, session.date)
            self.assertIsNotNone(loaded)
            self.assertEqual(len(loaded.rounds), 1)
            self.assertEqual(loaded.investor_type, "yc")

    def test_load_nonexistent(self):
        with TemporaryDirectory() as tmpdir:
            result = load_session(tmpdir, "2099-01-01")
            self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
