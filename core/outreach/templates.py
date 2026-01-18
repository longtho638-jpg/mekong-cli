"""
📧 Outreach Email Templates
=========================
Standard templates for various outreach scenarios.
"""

TEMPLATES = {
    # --- Standard Templates ---
    "ghost_cto": {
        "subject": "Quick question about {company}'s engineering velocity",
        "body": """Hi {name},

I noticed {company} is growing fast. Congrats!

Quick question: How are you tracking your engineering team's velocity and output?

I've been helping startups like yours with "Ghost CTO" services - basically fractional technical oversight without the full-time cost.

Here's a sample of what I provide weekly:
- Dev velocity reports (commits, PRs, cycle time)
- Technical debt identification
- Architecture recommendations

Would you be open to a 15-min call to see if this could help {company}?

Best,
Bill

P.S. I've attached a sample CTO report from a similar-sized team.
""",
    },
    "strategy_session": {
        "subject": "Binh Pháp Strategy Session for {company}",
        "body": """Hi {name},

I came across {company} and was impressed by what you're building.

I specialize in strategic consulting for startups using the "Binh Pháp" framework (applying Sun Tzu's Art of War to modern business strategy).

I'm offering a complimentary 30-min strategy session where we'll:
- Analyze your competitive moat
- Identify strategic vulnerabilities
- Map your path to market dominance

Would you be interested in scheduling a session this week?

Best,
Bill

🏯 AgencyOS
""",
    },
    
    # --- Urgent / Follow-up Templates ---
    "alex": {
        "subject": "Ghost CTO Proposal - Ready to Start Monday",
        "body": """Hi {name},

Hope you're well! Following up on our conversation about technical oversight for {company}.

I've prepared a Ghost CTO Lite proposal ($3,000/month) that includes:

✅ Weekly engineering velocity reports
✅ Monthly architecture review
✅ On-demand Slack/email support (< 24h response)
✅ Quarterly tech roadmap planning

I can start as early as Monday if you're ready.

I've attached the full proposal. Let me know if you have any questions!

Best,
[Your Name]

P.S. First invoice upon signing, then monthly thereafter.
""",
    },
    "invoice_reminder": {
        "subject": "Invoice INV-2026-0001 - Payment Reminder ($2,000)",
        "body": """Hi there,

Quick reminder about invoice INV-2026-0001 for Ghost CTO Lite (1 month) - $2,000.

Pay securely via PayPal:
https://www.paypal.com/checkoutnow?token=33075747892095613

Due date: January 31, 2026

Happy to answer any questions!

Best,
[Your Name]
""",
    },
    "sarah_followup": {
        "subject": "Quick follow-up: AI Copilot Setup for {company}",
        "body": """Hi {name},

Great chatting with you earlier! I wanted to follow up on helping {company} with AI tooling.

Quick options:

1. **AI Copilot Setup** ($997 one-time)
   - 2-day implementation
   - Full team training
   - 30-day support

2. **Ghost CTO Lite** ($3,000/month)
   - Weekly reports
   - On-demand support
   - Architecture guidance

Which sounds more interesting? Happy to hop on a quick call.

Best,
[Your Name]
""",
    },
    "quick_sale": {
        "subject": "50% off Admin Dashboard Pro - Limited Time",
        "body": """Hi!

Quick heads up - I'm running a flash sale on my developer tools:

🎁 **Admin Dashboard Pro** - $24 (was $47)
   Premium Next.js dashboard template
   https://billmentor.gumroad.com/l/admin-dashboard

🎁 **AI Skills Pack** - $14 (was $27)
   10+ production AI prompts
   https://billmentor.gumroad.com/l/ai-skills

Sale ends Friday!

Best,
[Your Name]
""",
    },
}
