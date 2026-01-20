"""
Testimonial Generator Facade.
"""
from .engine import TestimonialEngine
from .models import Rating, Testimonial


class TestimonialGenerator(TestimonialEngine):
    """
    Testimonial Generator.
    Collect and showcase client testimonials.
    """
    def format_showcase(self) -> str:
        if not self.testimonials: return "No testimonials yet!"
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
            lines.extend(["║                                                           ║", f"║  {stars}                                             ║", f'║  "{quote_short}"  ║', f"║  — {t.client_name}, {t.company[:25]:<25}            ║"])
        lines.extend(["║                                                           ║", "╠═══════════════════════════════════════════════════════════╣", f"║  Castle {self.agency_name} - Trusted by {len(self.testimonials)}+ clients!          ║", "╚═══════════════════════════════════════════════════════════╝"])
        return "\n".join(lines)

    def format_case_study(self, testimonial: Testimonial) -> str:
        lines = [f"# 📊 Case Study: {testimonial.company}", "", f'> "{testimonial.quote}"', f"> — {testimonial.client_name}, {testimonial.role}", "", "## Challenge", f"{testimonial.company} needed expert help with their marketing.", "", "## Solution", f"{self.agency_name} implemented a comprehensive strategy.", "", "## Results"]
        for key, value in testimonial.results.items(): lines.append(f"- **{key}:** {value}")
        lines.extend(["", "---", f"*Rating: {'★' * testimonial.rating.value}*", f'*{self.agency_name} - "Không đánh mà thắng"*'])
        return "\n".join(lines)
