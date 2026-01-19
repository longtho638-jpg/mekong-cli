"""
⭐ Testimonial Generator - Social Proof Engine
===============================================

Collect and showcase client testimonials.
The ultimate social proof for sales!

Features:
- Testimonial request emails
- Star rating display
- Case study format
- Social proof showcase
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional


class Rating(Enum):
    """Star rating."""

    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5


@dataclass
class Testimonial:
    """A client testimonial."""

    client_name: str
    company: str
    role: str
    rating: Rating
    quote: str
    results: Dict[str, str]
    date: datetime = field(default_factory=datetime.now)
    photo_url: Optional[str] = None


class TestimonialGenerator:
    """
    Testimonial Generator.

    Collect and showcase client testimonials.
    """

    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        self.testimonials: List[Testimonial] = []

    def add_testimonial(self, testimonial: Testimonial):
        """Add a testimonial."""
        self.testimonials.append(testimonial)

    def generate_request_email(self, client_name: str, project_name: str) -> str:
        """Generate testimonial request email."""
        return f"""Subject: Quick favor? Share your experience with {self.agency_name}

Hi {client_name}! 👋

I hope you're doing great! We've loved working with you on {project_name}.

I have a quick favor to ask - would you mind sharing a brief testimonial about your experience working with us?

Just a few sentences about:
✅ What you liked most
✅ Results you achieved
✅ Would you recommend us?

Your feedback helps other businesses discover us!

Reply to this email with your thoughts, or I can schedule a quick 5-min call if easier.

Thanks so much! 🙏

Best,
{self.agency_name} Team 🏯

P.S. As a thank you, you'll get 10% off your next project! 💰
"""

    def format_testimonial(self, testimonial: Testimonial) -> str:
        """Format single testimonial."""
        stars = "★" * testimonial.rating.value + "☆" * (5 - testimonial.rating.value)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⭐ {stars}                                            ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        # Quote (wrapped)
        quote = testimonial.quote
        while len(quote) > 50:
            lines.append(f'║  "{quote[:50]}"              ║')
            quote = quote[50:]
        if quote:
            lines.append(f'║  "{quote}"{"·" * (52 - len(quote))}║')

        lines.append("║                                                           ║")
        lines.append(f"║  — {testimonial.client_name:<40}       ║")
        lines.append(f"║    {testimonial.role}, {testimonial.company:<35}  ║")

        # Results
        if testimonial.results:
            lines.append("║                                                           ║")
            lines.append("║  📊 RESULTS:                                              ║")
            for key, value in list(testimonial.results.items())[:3]:
                lines.append(f"║    ✓ {key}: {value:<40}  ║")

        lines.append("╚═══════════════════════════════════════════════════════════╝")

        return "\n".join(lines)

    def format_showcase(self) -> str:
        """Format testimonial showcase."""
        if not self.testimonials:
            return "No testimonials yet!"

        # Calculate average rating
        avg_rating = sum(t.rating.value for t in self.testimonials) / len(self.testimonials)

        lines = [
            "╔═══════════════════════════════════════════════════════════╗",
            f"║  ⭐ CLIENT TESTIMONIALS: {self.agency_name.upper()[:28]:<28}   ║",
            f"║  Average Rating: {'★' * int(avg_rating)}{'☆' * (5 - int(avg_rating))} ({avg_rating:.1f}/5.0)              ║",
            f"║  Total Reviews: {len(self.testimonials):<38}   ║",
            "╠═══════════════════════════════════════════════════════════╣",
        ]

        for t in self.testimonials[:3]:
            stars = "★" * t.rating.value
            quote_short = t.quote[:45] + "..." if len(t.quote) > 45 else t.quote
            lines.append("║                                                           ║")
            lines.append(f"║  {stars}                                             ║")
            lines.append(f'║  "{quote_short}"  ║')
            lines.append(f"║  — {t.client_name}, {t.company[:25]:<25}            ║")

        lines.extend(
            [
                "║                                                           ║",
                "╠═══════════════════════════════════════════════════════════╣",
                f"║  🏯 {self.agency_name} - Trusted by {len(self.testimonials)}+ clients!          ║",
                "╚═══════════════════════════════════════════════════════════╝",
            ]
        )

        return "\n".join(lines)

    def format_case_study(self, testimonial: Testimonial) -> str:
        """Format as mini case study."""
        lines = [
            f"# 📊 Case Study: {testimonial.company}",
            "",
            f'> "{testimonial.quote}"',
            f"> — {testimonial.client_name}, {testimonial.role}",
            "",
            "## Challenge",
            f"{testimonial.company} needed expert help with their marketing.",
            "",
            "## Solution",
            f"{self.agency_name} implemented a comprehensive strategy.",
            "",
            "## Results",
        ]

        for key, value in testimonial.results.items():
            lines.append(f"- **{key}:** {value}")

        lines.extend(
            [
                "",
                "---",
                f"*Rating: {'★' * testimonial.rating.value}*",
                f'*{self.agency_name} - "Không đánh mà thắng"*',
            ]
        )

        return "\n".join(lines)


# Example usage
if __name__ == "__main__":
    generator = TestimonialGenerator("Saigon Digital Hub")

    # Add sample testimonials
    generator.add_testimonial(
        Testimonial(
            client_name="Mr. Hoang",
            company="Sunrise Realty",
            role="CEO",
            rating=Rating.FIVE,
            quote="Saigon Digital Hub transformed our marketing. Traffic up 200%, leads up 300%. Best investment we ever made!",
            results={"Traffic Increase": "+200%", "Lead Generation": "+300%", "ROI": "1500%"},
        )
    )

    generator.add_testimonial(
        Testimonial(
            client_name="Ms. Linh",
            company="Coffee Lab",
            role="Founder",
            rating=Rating.FIVE,
            quote="They understand our local market perfectly. Our social following tripled in 3 months!",
            results={"Social Followers": "+300%", "Engagement Rate": "+150%", "Sales": "+85%"},
        )
    )

    generator.add_testimonial(
        Testimonial(
            client_name="Dr. Pham",
            company="Dental Plus",
            role="Director",
            rating=Rating.FOUR,
            quote="Professional team, great results. Highly recommend for any business!",
            results={"New Patients": "+45%", "Online Bookings": "+200%"},
        )
    )

    print("⭐ Testimonial Generator")
    print("=" * 60)
    print()

    print("📧 Request Email Example:")
    print("-" * 40)
    print(generator.generate_request_email("Mr. Hoang", "SEO Campaign"))
    print()

    print("⭐ Testimonial Showcase:")
    print("-" * 40)
    print(generator.format_showcase())
    print()

    print("📊 Single Testimonial:")
    print("-" * 40)
    print(generator.format_testimonial(generator.testimonials[0]))
