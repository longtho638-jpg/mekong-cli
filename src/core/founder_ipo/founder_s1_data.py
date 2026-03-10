"""S-1 filing constants — section templates, risk categories."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class S1Section:
    name: str
    content_template: str
    key_points: list[str] = field(default_factory=list)


RISK_CATEGORIES: list[str] = [
    "Financial Risk",
    "Operational Risk",
    "Market and Competitive Risk",
    "Regulatory and Legal Risk",
    "Technology and Security Risk",
]

# (flag, category, description, severity)
RISK_TEMPLATES: list[tuple[str, str, str, str]] = [
    (
        "has_losses",
        "Financial Risk",
        "We have a history of net losses and may not achieve or maintain "
        "profitability. We expect operating expenses to increase significantly.",
        "high",
    ),
    (
        "always",
        "Market and Competitive Risk",
        "The market for our products is intensely competitive. "
        "We face competition from established vendors with greater resources.",
        "medium",
    ),
    (
        "customer_concentration",
        "Operational Risk",
        "A significant portion of our revenue is concentrated among a small "
        "number of customers. Loss of any key customer could harm our results.",
        "high",
    ),
    (
        "always",
        "Regulatory and Legal Risk",
        "We are subject to evolving data privacy regulations including GDPR and CCPA. "
        "Non-compliance could result in significant fines and reputational damage.",
        "medium",
    ),
    (
        "ai_dependent",
        "Technology and Security Risk",
        "Our products rely on AI and machine learning models. "
        "Model failures or inaccuracies could harm our reputation and results.",
        "medium",
    ),
    (
        "always",
        "Technology and Security Risk",
        "Security breaches or unauthorized access to customer data could expose us "
        "to liability, damage our reputation, and adversely affect our business.",
        "high",
    ),
    (
        "international",
        "Operational Risk",
        "International operations subject us to additional risks including "
        "foreign currency fluctuation, differing regulations, and geopolitical instability.",
        "medium",
    ),
]

S1_SECTIONS: list[S1Section] = [
    S1Section(
        name="Prospectus Summary",
        content_template=(
            "{company_name} is a {business_description}. "
            "We generated ${arr}M ARR growing {growth_pct}% YoY, "
            "serving {customers} customers with {nrr_pct}% net revenue retention."
        ),
        key_points=[
            "One-paragraph company description investors will quote",
            "Key financial metrics: ARR, growth, NRR",
            "Market opportunity statement",
            "Use of proceeds summary",
        ],
    ),
    S1Section(
        name="Business Description",
        content_template=(
            "We address a ${tam}B+ total addressable market. "
            "Our platform enables {value_prop}. "
            "We generate revenue through {revenue_model}."
        ),
        key_points=[
            "Problem statement with market validation",
            "Solution and product description",
            "Revenue model and pricing",
            "Customer acquisition and go-to-market strategy",
        ],
    ),
    S1Section(
        name="Key Metrics",
        content_template=(
            "ARR: ${arr}M | Growth: {growth_pct}% YoY | "
            "Gross Margin: {gross_margin_pct}% | "
            "Customers: {customers} | NRR: {nrr_pct}%"
        ),
        key_points=[
            "Annual Recurring Revenue (ARR) and growth rate",
            "Gross margin and path to profitability",
            "Net Revenue Retention (NRR / NDR)",
            "Customer count and cohort analysis",
            "CAC, LTV, and payback period",
        ],
    ),
    S1Section(
        name="Risk Factors",
        content_template=(
            "Investing in {company_name} involves risks. "
            "We have a history of net losses and may not achieve profitability. "
            "See Risk Factors section for a detailed discussion."
        ),
        key_points=[
            "History of losses and uncertain profitability",
            "Customer concentration risk",
            "Competitive market dynamics",
            "Regulatory and compliance risks",
            "Key-person dependency",
        ],
    ),
    S1Section(
        name="Use of Proceeds",
        content_template=(
            "We estimate net proceeds of approximately ${net_proceeds}M. "
            "We intend to use proceeds for: sales and marketing expansion, "
            "R&D investment, geographic expansion, and general corporate purposes."
        ),
        key_points=[
            "Specific allocation percentages for each use",
            "Prioritized list aligned with growth strategy",
            "No proceeds used for insider enrichment",
            "Timeline for deployment of capital",
        ],
    ),
    S1Section(
        name="Management and Governance",
        content_template=(
            "{company_name} is led by {ceo_name} (CEO) and supported by "
            "an experienced executive team. Our board includes {board_count} "
            "directors, a majority of whom are independent."
        ),
        key_points=[
            "CEO and C-suite background and relevant experience",
            "Board composition and independence",
            "Audit and compensation committee charters",
            "Executive compensation and equity structure",
            "Corporate governance policies",
        ],
    ),
]
