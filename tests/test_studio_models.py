"""Tests for src/studio/models.py — Pydantic models for VC Studio."""

from src.studio.models import (
    DealStage,
    CompanyStage,
    PartyRole,
    TerrainType,
    MomentumLevel,
    StudioConfig,
    InvestmentThesis,
    PortfolioCompany,
    Deal,
    Expert,
    Founder,
    ExpertEngagement,
    FiveFactorEvaluation,
    CrossPortfolioInsight,
    StudioDashboard,
)


class TestEnums:
    def test_deal_stage_values(self):
        assert DealStage.SOURCED == "sourced"
        assert DealStage.CLOSED == "closed"
        assert DealStage.PASSED == "passed"
        assert len(DealStage) == 9

    def test_company_stage_values(self):
        assert CompanyStage.IDEA == "idea"
        assert CompanyStage.EXIT == "exit"
        assert len(CompanyStage) == 7

    def test_party_role_values(self):
        assert PartyRole.VC == "vc"
        assert PartyRole.EXPERT == "expert"
        assert PartyRole.FOUNDER == "founder"

    def test_terrain_type_has_six_types(self):
        assert len(TerrainType) == 6
        assert TerrainType.ACCESSIBLE == "accessible"
        assert TerrainType.NARROW_PASS == "narrow_pass"

    def test_momentum_level_values(self):
        assert MomentumLevel.SURGING == "surging"
        assert MomentumLevel.STALLED == "stalled"
        assert len(MomentumLevel) == 5


class TestStudioConfig:
    def test_create_with_name(self):
        config = StudioConfig(name="Test Studio")
        assert config.name == "Test Studio"
        assert config.default_equity_pct == 30.0
        assert config.max_portfolio_size == 20
        assert config.currency == "USD"

    def test_defaults(self):
        config = StudioConfig(name="S")
        assert config.thesis_file == "thesis.yaml"
        assert config.target_check_size_usd == 100000
        assert "global" in config.regions
        assert "en" in config.languages
        assert config.created_at  # auto-generated


class TestInvestmentThesis:
    def test_create_thesis(self):
        thesis = InvestmentThesis(
            focus_sectors=["ai", "fintech"],
            stage_preference=[CompanyStage.SEED, CompanyStage.MVP],
            geo_focus=["vietnam", "sea"],
        )
        assert thesis.focus_sectors == ["ai", "fintech"]
        assert thesis.version == "1.0"
        assert thesis.check_size["sweet_spot"] == 100000

    def test_evaluation_weights_sum(self):
        thesis = InvestmentThesis(
            focus_sectors=["ai"],
            stage_preference=[CompanyStage.SEED],
            geo_focus=["global"],
        )
        total = sum(thesis.evaluation_weights.values())
        assert abs(total - 1.0) < 0.01

    def test_anti_thesis_default_empty(self):
        thesis = InvestmentThesis(
            focus_sectors=["ai"],
            stage_preference=[CompanyStage.SEED],
            geo_focus=["global"],
        )
        assert thesis.anti_thesis == []


class TestPortfolioCompany:
    def test_create_company(self):
        company = PortfolioCompany(
            slug="test-co",
            name="Test Co",
            stage=CompanyStage.MVP,
            sector="ai",
            one_liner="AI testing platform",
        )
        assert company.slug == "test-co"
        assert company.stage == CompanyStage.MVP
        assert company.equity_pct == 30.0
        assert company.health_score == 50.0
        assert company.momentum == MomentumLevel.STEADY

    def test_id_auto_generated(self):
        c1 = PortfolioCompany(
            slug="a", name="A", stage=CompanyStage.IDEA,
            sector="ai", one_liner="test",
        )
        c2 = PortfolioCompany(
            slug="b", name="B", stage=CompanyStage.IDEA,
            sector="ai", one_liner="test",
        )
        assert c1.id != c2.id
        assert len(c1.id) == 8

    def test_financial_defaults(self):
        company = PortfolioCompany(
            slug="x", name="X", stage=CompanyStage.SEED,
            sector="fintech", one_liner="payments",
        )
        assert company.mrr == 0
        assert company.arr == 0
        assert company.burn_rate == 0
        assert company.invested_usd == 0
        assert company.runway_months is None

    def test_openclaw_active_default(self):
        company = PortfolioCompany(
            slug="x", name="X", stage=CompanyStage.SEED,
            sector="ai", one_liner="test",
        )
        assert company.openclaw_active is True

    def test_serialization_roundtrip(self):
        company = PortfolioCompany(
            slug="test", name="Test", stage=CompanyStage.MVP,
            sector="ai", one_liner="test co",
            mrr=5000, arr=60000, team_size=3,
        )
        data = company.model_dump()
        restored = PortfolioCompany(**data)
        assert restored.slug == company.slug
        assert restored.mrr == 5000


class TestDeal:
    def test_create_deal(self):
        deal = Deal(
            company_name="NewCo",
            sector="ai",
            source="referral",
            one_liner="AI agent platform",
        )
        assert deal.stage == DealStage.SOURCED
        assert deal.source == "referral"
        assert deal.notes == []

    def test_deal_with_valuation(self):
        deal = Deal(
            company_name="BigCo",
            sector="fintech",
            source="inbound",
            one_liner="Payment rails",
            ask_usd=500000,
            valuation_usd=5000000,
        )
        assert deal.ask_usd == 500000
        assert deal.valuation_usd == 5000000

    def test_deal_pass_reason(self):
        deal = Deal(
            company_name="PassCo",
            sector="crypto",
            source="manual",
            one_liner="Crypto exchange",
            stage=DealStage.PASSED,
            pass_reason="Outside thesis",
        )
        assert deal.stage == DealStage.PASSED
        assert deal.pass_reason == "Outside thesis"


class TestExpert:
    def test_create_expert(self):
        expert = Expert(
            name="John Doe",
            email="john@example.com",
            specialties=["backend", "devops"],
        )
        assert expert.name == "John Doe"
        assert expert.availability == "available"
        assert expert.rating == 0
        assert expert.equity_open is True

    def test_expert_id_unique(self):
        e1 = Expert(name="A", email="a@x.com", specialties=["ai"])
        e2 = Expert(name="B", email="b@x.com", specialties=["ml"])
        assert e1.id != e2.id


class TestFounder:
    def test_create_founder(self):
        founder = Founder(
            name="Jane Smith",
            email="jane@startup.com",
            background="10y fintech",
            skills=["product", "fundraising"],
            sectors_interested=["fintech", "ai"],
        )
        assert founder.status == "available"
        assert founder.matched_company_id is None

    def test_founder_with_preferences(self):
        founder = Founder(
            name="X",
            email="x@y.com",
            background="eng",
            skills=["code"],
            sectors_interested=["ai"],
            stage_preference=[CompanyStage.IDEA, CompanyStage.MVP],
            regions=["vietnam"],
            languages=["vi", "en"],
        )
        assert CompanyStage.IDEA in founder.stage_preference
        assert "vietnam" in founder.regions


class TestExpertEngagement:
    def test_create_engagement(self):
        eng = ExpertEngagement(
            expert_id="abc123",
            company_id="xyz789",
            scope="Backend architecture review",
        )
        assert eng.type == "advisory"
        assert eng.compensation == "equity"
        assert eng.status == "active"


class TestFiveFactorEvaluation:
    def test_create_evaluation(self):
        ev = FiveFactorEvaluation(
            target_name="TestCo",
            dao={"score": 8, "reasoning": "Strong mission"},
            thien={"score": 7, "reasoning": "Good timing"},
            dia={"score": 6, "reasoning": "Competitive market"},
            tuong={"score": 9, "reasoning": "Experienced team"},
            phap={"score": 7, "reasoning": "Solid processes"},
            composite_score=7.4,
            recommendation="invest",
            confidence=0.85,
        )
        assert ev.composite_score == 7.4
        assert ev.recommendation == "invest"


class TestCrossPortfolioInsight:
    def test_create_insight(self):
        insight = CrossPortfolioInsight(
            type="shared_tech",
            description="Both companies use same auth pattern",
            source_companies=["co-a", "co-b"],
            applicable_to=["co-c"],
            confidence=0.8,
        )
        assert insight.status == "proposed"
        assert len(insight.source_companies) == 2


class TestStudioDashboard:
    def test_empty_dashboard(self):
        dashboard = StudioDashboard()
        assert dashboard.total_portfolio_companies == 0
        assert dashboard.total_invested_usd == 0
        assert dashboard.avg_health_score == 0
        assert dashboard.alerts == []

    def test_populated_dashboard(self):
        dashboard = StudioDashboard(
            total_portfolio_companies=5,
            active_companies=4,
            total_invested_usd=500000,
            portfolio_value_usd=2000000,
            total_mrr=25000,
            avg_health_score=72.5,
            deals_in_pipeline=8,
            experts_active=3,
        )
        assert dashboard.active_companies == 4
        assert dashboard.portfolio_value_usd == 2000000
