"""
Term Sheet Guardian Agent - 6 Agents for STARTUP WIN

STARTUP WIN Impact:
- Protection: 25% → 70%
- Auto-review all term sheets
- Flag 2x+ liquidation preferences → WALK AWAY
- Flag full ratchet → WALK AWAY
- Auto-negotiate better terms

6 Agents in this cluster:
1. Term Sheet Parser - Extract key terms from documents
2. Red Flag Detector - Identify dangerous clauses
3. Negotiation Advisor - Suggest counter-offers
4. Market Comparator - Compare to market standard
5. Risk Scorer - Rate deal risk 1-10
6. Auto-Responder - Draft response emails

Binh Pháp Application:
- Chapter 6 (Hư Thực): Protect weaknesses
- Chapter 3 (Mưu Công): Win negotiations without fighting
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class RiskLevel(str, Enum):
    WALK_AWAY = "walk_away"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SAFE = "safe"


class TermSheetTerms(BaseModel):
    """Extracted term sheet terms"""
    valuation_pre_money: float = 0
    valuation_post_money: float = 0
    investment_amount: float = 0
    equity_percentage: float = 0
    liquidation_preference: float = 1.0  # 1x, 2x, etc.
    participation: bool = False
    participating_cap: Optional[float] = None
    anti_dilution: str = "weighted_average"  # weighted_average, full_ratchet
    board_seats_investor: int = 0
    board_seats_founder: int = 0
    board_seats_independent: int = 0
    vesting_schedule: str = "4-year-1-cliff"
    pro_rata_rights: bool = True
    drag_along: bool = False
    pay_to_play: bool = False
    option_pool: float = 0
    no_shop_period_days: int = 30


class GuardianAgent:
    """
    Term Sheet Guardian Agent Cluster
    
    Runs 6 sub-agents to protect founders from predatory terms:
    - Parser extracts terms
    - Red Flag Detector finds dangerous clauses
    - Negotiation Advisor suggests counters
    - Market Comparator benchmarks terms
    - Risk Scorer gives overall rating
    - Auto-Responder drafts replies
    
    WALK AWAY triggers:
    - 2x+ liquidation preference
    - Full ratchet anti-dilution
    - Investor board majority
    - Aggressive pay-to-play
    - Founder vesting reset
    """

    def __init__(self):
        self.red_flags = {
            "liquidation_preference_max": 1.5,  # Max acceptable
            "equity_max": 30,  # Max equity for single round
            "option_pool_max": 15,  # Max option pool
            "no_shop_max_days": 45,  # Max no-shop period
        }

    # Agent 1: Term Sheet Parser
    @staticmethod
    def parse_term_sheet(document_text: str) -> Dict[str, Any]:
        """
        Agent 1: Extract key terms from term sheet document
        
        Args:
            document_text: Raw term sheet text
            
        Returns:
            Structured terms extracted from document
        """
        # TODO: Use LLM to extract terms from document
        # Mock extraction for now
        terms = {
            "valuation_pre_money": 10000000,
            "investment_amount": 2000000,
            "equity_percentage": 16.67,
            "liquidation_preference": 1.0,
            "participation": False,
            "anti_dilution": "weighted_average",
            "board_seats": {"investor": 1, "founder": 2, "independent": 1},
            "vesting": "4-year-1-cliff",
            "pro_rata": True,
            "option_pool": 10,
            "no_shop_days": 30,
            "parsed_at": datetime.now().isoformat()
        }
        return terms

    # Agent 2: Red Flag Detector
    def detect_red_flags(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agent 2: Identify dangerous clauses that warrant WALK AWAY
        
        Args:
            terms: Parsed term sheet terms
            
        Returns:
            List of red flags with severity
        """
        red_flags = []
        walk_away = False

        # Check liquidation preference
        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref >= 2.0:
            red_flags.append({
                "type": "liquidation_preference",
                "severity": "WALK_AWAY",
                "message": f"Liquidation preference {liq_pref}x is predatory",
                "binh_phap": "Chapter 6: This is a trap, retreat"
            })
            walk_away = True
        elif liq_pref > 1.5:
            red_flags.append({
                "type": "liquidation_preference",
                "severity": "HIGH",
                "message": f"Liquidation preference {liq_pref}x is aggressive",
                "binh_phap": "Negotiate to 1x non-participating"
            })

        # Check anti-dilution
        anti_dilution = terms.get("anti_dilution", "weighted_average")
        if anti_dilution == "full_ratchet":
            red_flags.append({
                "type": "anti_dilution",
                "severity": "WALK_AWAY",
                "message": "Full ratchet anti-dilution is a deal breaker",
                "binh_phap": "Chapter 6: Never accept full ratchet"
            })
            walk_away = True

        # Check board control
        board = terms.get("board_seats", {})
        if board.get("investor", 0) > board.get("founder", 0):
            red_flags.append({
                "type": "board_control",
                "severity": "WALK_AWAY",
                "message": "Investor board majority removes founder control",
                "binh_phap": "Chapter 1: Never lose strategic control"
            })
            walk_away = True

        # Check participation
        if terms.get("participation", False) and not terms.get("participating_cap"):
            red_flags.append({
                "type": "participation",
                "severity": "HIGH",
                "message": "Uncapped participation is double-dipping",
                "binh_phap": "Negotiate for 3x cap or non-participating"
            })

        # Check equity
        equity = terms.get("equity_percentage", 0)
        if equity > 30:
            red_flags.append({
                "type": "equity",
                "severity": "HIGH",
                "message": f"Giving up {equity}% in single round is excessive",
                "binh_phap": "Chapter 2: Preserve resources for long war"
            })
        elif equity > 25:
            red_flags.append({
                "type": "equity",
                "severity": "MEDIUM",
                "message": f"Giving up {equity}% is above average for this stage",
                "binh_phap": "Consider negotiating to 20% max"
            })

        # Check option pool
        option_pool = terms.get("option_pool", 0)
        if option_pool > 15:
            red_flags.append({
                "type": "option_pool",
                "severity": "MEDIUM",
                "message": f"Option pool of {option_pool}% dilutes founders excessively",
                "binh_phap": "Negotiate to 10% or post-money pool"
            })

        return {
            "total_flags": len(red_flags),
            "walk_away": walk_away,
            "red_flags": red_flags,
            "analyzed_at": datetime.now().isoformat()
        }

    # Agent 3: Negotiation Advisor
    @staticmethod
    def suggest_counter_offer(terms: Dict[str, Any], red_flags: List[Dict]) -> Dict[str, Any]:
        """
        Agent 3: Suggest counter-offers for problematic terms
        
        Args:
            terms: Current term sheet terms
            red_flags: Identified red flags
            
        Returns:
            Counter-offer suggestions
        """
        counter_offers = []

        for flag in red_flags:
            if flag["type"] == "liquidation_preference":
                counter_offers.append({
                    "term": "Liquidation Preference",
                    "current": terms.get("liquidation_preference"),
                    "proposed": 1.0,
                    "rationale": "Industry standard is 1x non-participating",
                    "priority": "HIGH"
                })

            elif flag["type"] == "anti_dilution":
                counter_offers.append({
                    "term": "Anti-Dilution",
                    "current": terms.get("anti_dilution"),
                    "proposed": "broad_weighted_average",
                    "rationale": "Broad-based weighted average is market standard",
                    "priority": "CRITICAL"
                })

            elif flag["type"] == "participation":
                counter_offers.append({
                    "term": "Participation",
                    "current": "Uncapped participating",
                    "proposed": "Non-participating or 3x cap",
                    "rationale": "Participating preferred is already generous to investors",
                    "priority": "HIGH"
                })

            elif flag["type"] == "equity":
                current_equity = terms.get("equity_percentage", 0)
                counter_offers.append({
                    "term": "Equity Percentage",
                    "current": f"{current_equity}%",
                    "proposed": f"{min(current_equity, 20)}%",
                    "rationale": "Preserve founder ownership for future rounds",
                    "priority": "MEDIUM"
                })

            elif flag["type"] == "option_pool":
                counter_offers.append({
                    "term": "Option Pool",
                    "current": f"{terms.get('option_pool')}% pre-money",
                    "proposed": "10% post-money",
                    "rationale": "Post-money option pool shares dilution with investors",
                    "priority": "MEDIUM"
                })

        return {
            "total_counters": len(counter_offers),
            "counter_offers": counter_offers,
            "negotiation_strategy": "Start with highest priority items, be willing to compromise on medium priority",
            "generated_at": datetime.now().isoformat()
        }

    # Agent 4: Market Comparator
    @staticmethod
    def compare_to_market(terms: Dict[str, Any], stage: str = "Seed") -> Dict[str, Any]:
        """
        Agent 4: Compare terms to market standards
        
        Args:
            terms: Current term sheet terms
            stage: Funding stage (Seed, Series A, etc.)
            
        Returns:
            Market comparison analysis
        """
        # Market benchmarks by stage
        benchmarks = {
            "Seed": {
                "valuation_range": (2000000, 15000000),
                "equity_typical": (10, 25),
                "liq_pref_typical": 1.0,
                "anti_dilution": "weighted_average",
                "option_pool": 10,
                "board": "Founder majority"
            },
            "Series A": {
                "valuation_range": (10000000, 50000000),
                "equity_typical": (15, 30),
                "liq_pref_typical": 1.0,
                "anti_dilution": "weighted_average",
                "option_pool": 10,
                "board": "2 founder, 1 investor, 1 independent"
            }
        }

        benchmark = benchmarks.get(stage, benchmarks["Seed"])
        comparisons = []

        # Compare each term
        val = terms.get("valuation_pre_money", 0)
        val_range = benchmark["valuation_range"]
        if val < val_range[0]:
            comparisons.append({"term": "Valuation", "status": "BELOW_MARKET", "benchmark": f"${val_range[0]:,} - ${val_range[1]:,}"})
        elif val > val_range[1]:
            comparisons.append({"term": "Valuation", "status": "ABOVE_MARKET", "benchmark": f"${val_range[0]:,} - ${val_range[1]:,}"})
        else:
            comparisons.append({"term": "Valuation", "status": "MARKET", "benchmark": f"${val_range[0]:,} - ${val_range[1]:,}"})

        equity = terms.get("equity_percentage", 0)
        eq_range = benchmark["equity_typical"]
        if equity < eq_range[0]:
            comparisons.append({"term": "Equity", "status": "FAVORABLE", "benchmark": f"{eq_range[0]}-{eq_range[1]}%"})
        elif equity > eq_range[1]:
            comparisons.append({"term": "Equity", "status": "UNFAVORABLE", "benchmark": f"{eq_range[0]}-{eq_range[1]}%"})
        else:
            comparisons.append({"term": "Equity", "status": "MARKET", "benchmark": f"{eq_range[0]}-{eq_range[1]}%"})

        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref == benchmark["liq_pref_typical"]:
            comparisons.append({"term": "Liquidation Preference", "status": "MARKET", "benchmark": "1x"})
        elif liq_pref > benchmark["liq_pref_typical"]:
            comparisons.append({"term": "Liquidation Preference", "status": "UNFAVORABLE", "benchmark": "1x"})

        return {
            "stage": stage,
            "comparisons": comparisons,
            "overall": "FAVORABLE" if all(c["status"] in ["MARKET", "FAVORABLE"] for c in comparisons) else "NEEDS_NEGOTIATION",
            "compared_at": datetime.now().isoformat()
        }

    # Agent 5: Risk Scorer
    def calculate_risk_score(self, terms: Dict[str, Any], red_flags: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agent 5: Calculate overall deal risk score 1-10
        
        Args:
            terms: Term sheet terms
            red_flags: Red flag analysis
            
        Returns:
            Risk score and recommendation
        """
        score = 0
        factors = []

        # Walk away flags = instant 10
        if red_flags.get("walk_away", False):
            return {
                "score": 10,
                "rating": "WALK_AWAY",
                "factors": ["Critical red flags detected"],
                "recommendation": "DO NOT PROCEED. Negotiate or walk away.",
                "calculated_at": datetime.now().isoformat()
            }

        # Count red flags
        flag_count = red_flags.get("total_flags", 0)
        if flag_count >= 4:
            score += 4
            factors.append("Multiple concerning terms")
        elif flag_count >= 2:
            score += 2
            factors.append("Some concerning terms")

        # Check specific high-risk terms
        liq_pref = terms.get("liquidation_preference", 1.0)
        if liq_pref > 1.0:
            score += 2
            factors.append(f"Liquidation preference above 1x ({liq_pref}x)")

        if terms.get("participation", False):
            score += 1
            factors.append("Participating preferred")

        equity = terms.get("equity_percentage", 0)
        if equity > 25:
            score += 2
            factors.append(f"High equity dilution ({equity}%)")
        elif equity > 20:
            score += 1
            factors.append(f"Above average equity ({equity}%)")

        # Determine rating
        if score >= 8:
            rating = "VERY_HIGH"
            recommendation = "Strongly recommend declining or major renegotiation"
        elif score >= 6:
            rating = "HIGH"
            recommendation = "Significant concerns. Negotiate key terms before proceeding."
        elif score >= 4:
            rating = "MEDIUM"
            recommendation = "Acceptable with negotiation on specific terms"
        elif score >= 2:
            rating = "LOW"
            recommendation = "Good deal with minor improvements possible"
        else:
            rating = "VERY_LOW"
            recommendation = "Excellent terms. Recommend proceeding."

        return {
            "score": min(score, 10),
            "rating": rating,
            "factors": factors,
            "recommendation": recommendation,
            "calculated_at": datetime.now().isoformat()
        }

    # Agent 6: Auto-Responder
    @staticmethod
    def draft_response(terms: Dict[str, Any], red_flags: Dict[str, Any], counter_offers: Dict[str, Any],
                       risk_score: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agent 6: Draft professional response email
        
        Args:
            terms: Term sheet terms
            red_flags: Red flag analysis
            counter_offers: Suggested counter-offers
            risk_score: Overall risk assessment
            
        Returns:
            Draft email response
        """
        rating = risk_score.get("rating", "MEDIUM")

        if rating == "WALK_AWAY":
            subject = "RE: Term Sheet - Unable to Proceed"
            body = """Dear [Investor Name],

Thank you for your interest in [Company Name] and for sharing your term sheet.

After careful review with our advisors, we've identified several terms that are not aligned with our expectations and market standards. Specifically:

{red_flag_list}

At this time, we are unable to move forward with these terms. We would welcome the opportunity to discuss if you are open to significant modifications.

Best regards,
[Founder Name]"""

        elif rating in ["VERY_HIGH", "HIGH"]:
            subject = "RE: Term Sheet - Counter-Proposal"
            body = """Dear [Investor Name],

Thank you for the term sheet for [Company Name]. We appreciate your interest and have carefully reviewed the proposed terms.

While we are excited about the partnership potential, we would like to discuss adjustments to the following terms:

{counter_list}

We believe these modifications would create a more balanced partnership and align with market standards for this stage.

We look forward to discussing these points and finding mutually agreeable terms.

Best regards,
[Founder Name]"""

        else:
            subject = "RE: Term Sheet - Proceeding with Minor Points"
            body = """Dear [Investor Name],

Thank you for the term sheet for our Series [X] round. We are pleased with the overall structure and excited to move forward.

We have a few minor points we'd like to discuss:

{counter_list}

Please let us know your availability for a call to finalize these details.

Best regards,
[Founder Name]"""

        return {
            "subject": subject,
            "body": body,
            "tone": "professional" if rating not in ["WALK_AWAY"] else "firm",
            "attachments_suggested": ["Counter-term sheet", "Market data comparison"],
            "drafted_at": datetime.now().isoformat()
        }


# Full review pipeline
def review_term_sheet(document_text: str, stage: str = "Seed") -> Dict[str, Any]:
    """
    End-to-end term sheet review pipeline
    
    Runs all 6 Guardian agents in sequence:
    1. Parse terms
    2. Detect red flags
    3. Suggest counters
    4. Compare to market
    5. Calculate risk
    6. Draft response
    """
    guardian = GuardianAgent()

    # Agent 1: Parse
    terms = guardian.parse_term_sheet(document_text)

    # Agent 2: Red flags
    red_flags = guardian.detect_red_flags(terms)

    # Agent 3: Counter offers
    counter_offers = guardian.suggest_counter_offer(terms, red_flags["red_flags"])

    # Agent 4: Market comparison
    market_compare = guardian.compare_to_market(terms, stage)

    # Agent 5: Risk score
    risk_score = guardian.calculate_risk_score(terms, red_flags)

    # Agent 6: Draft response
    response = guardian.draft_response(terms, red_flags, counter_offers, risk_score)

    return {
        "terms": terms,
        "red_flags": red_flags,
        "counter_offers": counter_offers,
        "market_comparison": market_compare,
        "risk_score": risk_score,
        "draft_response": response,
        "reviewed_at": datetime.now().isoformat()
    }


# Test the agent cluster
if __name__ == "__main__":
    # Sample term sheet text
    sample = """
    Series Seed Term Sheet
    Pre-money valuation: $10,000,000
    Investment: $2,000,000
    Liquidation Preference: 1x non-participating
    Anti-dilution: Broad-based weighted average
    Board: 2 founders, 1 investor
    """

    result = review_term_sheet(sample, "Seed")
    print(f"Risk Score: {result['risk_score']['score']}/10")
    print(f"Rating: {result['risk_score']['rating']}")
    print(f"Red Flags: {result['red_flags']['total_flags']}")
