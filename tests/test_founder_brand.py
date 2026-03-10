"""Tests for src/core/founder_brand.py."""

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from src.core.founder_brand import (
    BrandKit,
    DomainCheck,
    NameCandidate,
    Tagline,
    build_positioning,
    build_voice_guide,
    generate_elevator_pitches,
    generate_name_candidates,
    generate_taglines,
    save_brand_kit,
)


class TestNameGeneration(unittest.TestCase):
    def test_generates_15_candidates(self):
        candidates = generate_name_candidates("task manager", "founders")
        self.assertEqual(len(candidates), 15)

    def test_three_tracks(self):
        candidates = generate_name_candidates("SaaS tool", "devs")
        tracks = {c.track for c in candidates}
        self.assertEqual(tracks, {"descriptive", "invented", "metaphorical"})

    def test_score_property(self):
        c = NameCandidate("Test", "descriptive", 5, 5, 5, 5)
        self.assertEqual(c.score, 5.0)

    def test_empty_desc_raises(self):
        with self.assertRaises(ValueError):
            generate_name_candidates("", "audience")

    def test_5_per_track(self):
        candidates = generate_name_candidates("app", "users")
        desc = [c for c in candidates if c.track == "descriptive"]
        self.assertEqual(len(desc), 5)


class TestPositioning(unittest.TestCase):
    def test_build_basic(self):
        pos = build_positioning(
            "solo founders", "need automation",
            "operating system", "80% automated",
            "project management tools", "runs entire company",
        )
        self.assertEqual(pos.target_customer, "solo founders")

    def test_render(self):
        pos = build_positioning("devs", "slow deploys", "CI tool", "fast", "Jenkins", "10x faster")
        text = pos.render("DeployBot")
        self.assertIn("DeployBot IS:", text)
        self.assertIn("devs", text)

    def test_empty_required_raises(self):
        with self.assertRaises(ValueError):
            build_positioning("", "problem", "category", "", "", "")

    def test_defaults_for_optional(self):
        pos = build_positioning("users", "pain", "tool", "", "", "")
        self.assertIn("value", pos.key_benefit)


class TestTaglines(unittest.TestCase):
    def test_generates_15(self):
        taglines = generate_taglines("Acme", "automation", "founders")
        self.assertEqual(len(taglines), 15)

    def test_word_count(self):
        t = Tagline("test", "Hello world foo")
        self.assertEqual(t.word_count, 3)

    def test_strategies_covered(self):
        taglines = generate_taglines("Co", "fast", "devs")
        strategies = {t.strategy for t in taglines}
        self.assertEqual(len(strategies), 5)


class TestElevatorPitches(unittest.TestCase):
    def test_three_lengths(self):
        pos = build_positioning("users", "pain", "tool", "speed", "others", "faster")
        pitches = generate_elevator_pitches("Co", pos, "$10K MRR")
        self.assertIn("10s_party", pitches)
        self.assertIn("30s_investor", pitches)
        self.assertIn("2min_demo", pitches)


class TestVoiceGuide(unittest.TestCase):
    def test_professional(self):
        voice = build_voice_guide("professional")
        self.assertEqual(len(voice.personality), 3)
        self.assertEqual(len(voice.never_sounds_like), 3)
        self.assertGreater(len(voice.writing_rules), 3)

    def test_all_tones(self):
        for tone in ("minimal", "playful", "professional", "bold"):
            voice = build_voice_guide(tone)
            self.assertEqual(voice.tone, tone)

    def test_unknown_defaults_professional(self):
        voice = build_voice_guide("unknown_tone")
        self.assertEqual(len(voice.personality), 3)


class TestSaveBrandKit(unittest.TestCase):
    def test_saves_5_files(self):
        with TemporaryDirectory() as tmpdir:
            candidates = generate_name_candidates("app", "users")
            pos = build_positioning("users", "pain", "tool", "fast", "old", "new")
            taglines = generate_taglines("Co", "speed", "devs")
            voice = build_voice_guide("bold")
            kit = BrandKit(
                company_name="Co",
                candidates=candidates,
                domain_checks=[DomainCheck("test")],
                positioning=pos,
                taglines=taglines,
                voice=voice,
            )
            saved = save_brand_kit(tmpdir, kit)
            self.assertEqual(len(saved), 5)
            for f in saved:
                self.assertTrue(Path(f).exists())
                data = json.loads(Path(f).read_text())
                self.assertTrue(data)  # non-empty


if __name__ == "__main__":
    unittest.main()
