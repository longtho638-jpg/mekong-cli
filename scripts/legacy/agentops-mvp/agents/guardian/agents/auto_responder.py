"""Auto responder agent"""

from typing import Any, Dict, List

from ..base.guardian_base import GuardianBase


class AutoResponder(GuardianBase):
    """Agent 6: Draft professional response emails"""
    
    def __init__(self):
        super().__init__()
        self.response_templates = {
            "walk_away": {
                "subject": "RE: Term Sheet - Unable to Proceed",
                "tone": "firm"
            },
            "negotiate": {
                "subject": "RE: Term Sheet - Counter-Proposal",
                "tone": "professional"
            },
            "proceed": {
                "subject": "RE: Term Sheet - Proceeding with Minor Points",
                "tone": "enthusiastic"
            }
        }
    
    def draft_response(self, terms: Dict[str, Any], red_flags: Dict[str, Any], 
                      counter_offers: Dict[str, Any], risk_score: Dict[str, Any]) -> Dict[str, Any]:
        """Draft professional response email based on analysis"""
        rating = risk_score.get("rating", "MEDIUM")
        response_type = self._determine_response_type(rating)
        template = self.response_templates[response_type]
        
        body = self._generate_email_body(response_type, red_flags, counter_offers, risk_score)
        
        result = {
            "subject": template["subject"],
            "body": body,
            "tone": template["tone"],
            "attachments_suggested": self._suggest_attachments(response_type, counter_offers),
            "response_type": response_type
        }
        
        return self.log_analysis("auto_responder", result)
    
    def _determine_response_type(self, rating: str) -> str:
        """Determine response type based on risk rating"""
        if rating == "WALK_AWAY":
            return "walk_away"
        elif rating in ["VERY_HIGH", "HIGH"]:
            return "negotiate"
        else:
            return "proceed"
    
    def _generate_email_body(self, response_type: str, red_flags: Dict, 
                            counter_offers: Dict, risk_score: Dict) -> str:
        """Generate email body based on response type"""
        if response_type == "walk_away":
            return self._walk_away_template(red_flags)
        elif response_type == "negotiate":
            return self._negotiate_template(counter_offers)
        else:
            return self._proceed_template(counter_offers)
    
    def _walk_away_template(self, red_flags: Dict) -> str:
        """Template for walk-away response"""
        red_flag_list = self._format_red_flags(red_flags.get("red_flags", []))
        
        return f"""Dear [Investor Name],

Thank you for your interest in [Company Name] and for sharing your term sheet.

After careful review with our advisors, we've identified several terms that are not aligned with our expectations and market standards. Specifically:

{red_flag_list}

At this time, we are unable to move forward with these terms. We would welcome the opportunity to discuss if you are open to significant modifications.

Best regards,
[Founder Name]"""
    
    def _negotiate_template(self, counter_offers: Dict) -> str:
        """Template for negotiation response"""
        counter_list = self._format_counter_offers(counter_offers.get("counter_offers", []))
        
        return f"""Dear [Investor Name],

Thank you for the term sheet for [Company Name]. We appreciate your interest and have carefully reviewed the proposed terms.

While we are excited about the partnership potential, we would like to discuss adjustments to the following terms:

{counter_list}

We believe these modifications would create a more balanced partnership and align with market standards for this stage.

We look forward to discussing these points and finding mutually agreeable terms.

Best regards,
[Founder Name]"""
    
    def _proceed_template(self, counter_offers: Dict) -> str:
        """Template for proceeding response"""
        counter_list = self._format_counter_offers(counter_offers.get("counter_offers", []))
        
        return f"""Dear [Investor Name],

Thank you for the term sheet for our Series [X] round. We are pleased with the overall structure and excited to move forward.

We have a few minor points we'd like to discuss:

{counter_list}

Please let us know your availability for a call to finalize these details.

Best regards,
[Founder Name]"""
    
    def _format_red_flags(self, red_flags: List[Dict]) -> str:
        """Format red flags for email"""
        formatted = []
        for flag in red_flags:
            formatted.append(f"- {flag['message']}")
        return "\n".join(formatted)
    
    def _format_counter_offers(self, counter_offers: List[Dict]) -> str:
        """Format counter offers for email"""
        formatted = []
        for offer in counter_offers:
            formatted.append(f"- {offer['term']}: {offer['current']} → {offer['proposed']}")
        return "\n".join(formatted)
    
    def _suggest_attachments(self, response_type: str, counter_offers: Dict) -> List[str]:
        """Suggest email attachments"""
        attachments = []
        
        if response_type == "negotiate" and counter_offers.get("counter_offers"):
            attachments.extend(["Counter-term sheet", "Market data comparison"])
        elif response_type == "proceed":
            attachments.append("Updated term sheet")
        
        return attachments
    
    def personalize_response(self, response: Dict, company_name: str, 
                          investor_name: str, founder_name: str) -> Dict:
        """Personalize response with names and details"""
        body = response["body"]
        body = body.replace("[Company Name]", company_name)
        body = body.replace("[Investor Name]", investor_name)
        body = body.replace("[Founder Name]", founder_name)
        
        response["body"] = body
        return response
    
    def generate_follow_up_schedule(self, response_type: str) -> Dict[str, Any]:
        """Generate follow-up schedule based on response type"""
        schedules = {
            "walk_away": {
                "follow_up_in_days": 7,
                "message": "Checking if reconsideration is possible"
            },
            "negotiate": {
                "follow_up_in_days": 3,
                "message": "Following up on counter-proposal discussion"
            },
            "proceed": {
                "follow_up_in_days": 2,
                "message": "Confirming next steps for closing"
            }
        }
        
        return schedules.get(response_type, schedules["proceed"])