"""
Strategy Module - Service Logic (Binh Phap Hub)
"""
import logging
from typing import List, Dict, Any
from .entities import Chapter, StrategicInsight

logger = logging.getLogger(__name__)

class StrategyService:
    """
    Binh Phap Strategic Engine.
    Analyzes business context against the 13 Chapters of Art of War.
    """
    
    def __init__(self, agency_name: str):
        self.agency_name = agency_name
        
    def analyze_situation(self, context: str) -> List[StrategicInsight]:
        """
        Perform a strategic analysis based on provided context.
        In a real scenario, this would use LLM. Here we use heuristics.
        """
        insights = []
        
        # Chapter 1: Planning (Assess 5 Factors)
        insights.append(StrategicInsight(
            chapter=Chapter.PLANNING,
            title="Initial Assessment (Kế)",
            content="Before battle, calculations must be made in the temple.",
            action_items=["Define clear MVV (Mission/Vision/Values)", "Assess market timing (Heaven)"],
            score=85
        ))
        
        # Chapter 3: Strategy (Win without fighting)
        insights.append(StrategicInsight(
            chapter=Chapter.STRATEGY,
            title="Strategic Attack (Mưu Công)",
            content="The supreme art of war is to subdue the enemy without fighting.",
            action_items=["Identify niche dominance", "Build proprietary data moat"],
            score=90
        ))
        
        return insights

    def get_chapter_title(self, chapter: Chapter) -> str:
        titles = {
            Chapter.PLANNING: "Laying Plans",
            Chapter.RESOURCES: "Waging War",
            Chapter.STRATEGY: "Attack by Stratagem",
            Chapter.POSITIONING: "Tactical Dispositions",
            Chapter.MOMENTUM: "Energy",
            Chapter.WEAKNESS: "Weak Points & Strong",
            Chapter.MANEUVERING: "Maneuvering",
            Chapter.ADAPTATION: "Variation in Tactics",
            Chapter.OPERATIONS: "The Army on the March",
            Chapter.TERRAIN: "Terrain",
            Chapter.SITUATIONS: "The Nine Situations",
            Chapter.DISRUPTION: "The Attack by Fire",
            Chapter.INTELLIGENCE: "The Use of Spies"
        }
        return titles.get(chapter, "Unknown")
