"""
AgentOps Categories Enum
Aligned with agencyos.network DNA
"""

from enum import Enum


class OpsCategory(str, Enum):
    """All AgentOps categories aligned with agencyos.network DNA"""

    # Sales
    SDR = "sdrops"
    AE = "aeops"
    SA = "saops"
    ISR = "isrops"
    OSR = "osrops"
    BDM = "bdmops"
    SALES = "sales"
    LEADGEN = "leadgenops"

    # Marketing
    SEO = "seoops"
    PPC = "ppcops"
    SOCIAL_MEDIA = "socialmediaops"
    CONTENT = "contentops"
    CONTENT_MARKETING = "contentmarketingops"
    EMAIL_MARKETING = "emailmarketingops"
    INFLUENCER = "influencermarketingops"
    PAID_SOCIAL = "paidsocialops"
    BRAND = "brandmanagerops"
    PRODUCT_MARKETING = "productmarketingops"
    DIGITAL_MARKETING = "digitalmarketingops"
    B2B_CONTENT = "b2bcontentops"
    B2B_MARKETING = "b2bmarketingops"
    MARKETING_MANAGER = "marketingmanagerops"
    MARKETING_ANALYST = "marketinganalystops"
    MARKETING_COORD = "marketingcoordops"
    MARKET_RESEARCH = "marketresearchops"
    EVENT_MARKETING = "eventmarketingops"
    ABM = "abmops"
    PR = "props"

    # Creative
    COPYWRITER = "copywriterops"
    CREATIVE_STRATEGIST = "creativestrategistops"
    MEDIA = "mediaops"

    # HR
    HR = "hrops"
    RECRUITER = "recruiterops"
    LD = "ldops"
    HRIS = "hrisops"
    HR_ANALYST = "hranalystops"
    COMPBEN = "compbenops"

    # Finance
    FIN = "finops"
    TAX = "taxops"

    # Engineering
    SWE = "sweops"
    SE = "seops"

    # Support
    CS = "csops"
    SERVICE = "serviceops"

    # Legal
    LEGAL = "legalops"
    IP = "ipops"

    # Admin
    ADMIN = "adminops"
    ER = "erops"

    # Ecommerce
    ECOMMERCE = "ecommerceops"
    AMAZON_FBA = "amazonfbaops"
    SM = "smops"  # Store Manager
