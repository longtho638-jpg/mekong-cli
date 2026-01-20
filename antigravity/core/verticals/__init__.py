"""
Verticals Module
================
Contains specialized engines for specific industry verticals.
"""
from enum import Enum


class VerticalType(Enum):
    HEALTHCARE = "healthcare"
    FINTECH = "fintech"
    SAAS = "saas"
    ECOMMERCE = "ecommerce"
    GENERAL = "general"
