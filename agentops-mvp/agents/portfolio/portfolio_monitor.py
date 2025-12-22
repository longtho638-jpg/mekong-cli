"""
Portfolio Monitor Agent Cluster - 8 Agents for WIN³

ANH WIN Impact:
- Portfolio visibility: 28% → 60%
- Track 30+ startups' metrics automatically
- Flag dilution risks
- Predict exit opportunities

8 Agents in this cluster:
1. Metrics Scraper - Pull MRR, CAC, LTV from APIs
2. Burn Rate Tracker - Calculate runway
3. Alert Engine - Flag threshold breaches
4. Health Reporter - Weekly startup health
5. Trend Analyzer - Identify metric trends
6. Benchmark Comparator - Compare to market
7. Churn Predictor - Predict startup failures
8. Recommendation Engine - Suggest interventions
"""

import os
import redis
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.tools import tool


class StartupMetrics(BaseModel):
    """Startup metrics data model"""
    startup_id: str
    name: str
    mrr: float = 0
    arr: float = 0
    burn_rate: float = 0
    runway_months: float = 0
    cac: float = 0
    ltv: float = 0
    ltv_cac_ratio: float = 0
    churn_rate: float = 0
    growth_rate: float = 0
    team_size: int = 0
    last_funding: Optional[str] = None
    funding_amount: float = 0
    equity_held: float = 0
    health_score: float = 0
    risk_level: str = "medium"
    updated_at: datetime = None


class PortfolioMonitorAgent:
    """
    Portfolio Monitor Agent Cluster
    
    Runs 8 sub-agents for comprehensive portfolio tracking:
    - Metrics Scraper → Burn Rate Tracker → Health Reporter
    - Alert Engine monitors thresholds
    - Trend Analyzer + Benchmark Comparator provide insights
    - Churn Predictor + Recommendation Engine suggest actions
    
    Binh Pháp Application:
    - Chapter 1 (Kế Hoạch): Know your battlefield (portfolio)
    - Chapter 6 (Hư Thực): Attack weaknesses (struggling startups)
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.llm = ChatOpenAI(
            model="google/gemini-2.0-flash-exp:free",
            temperature=0.3,
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        
    def get_tools(self) -> List:
        """All 8 agent tools"""
        return [
            self.scrape_metrics,
            self.track_burn_rate,
            self.check_alerts,
            self.generate_health_report,
            self.analyze_trends,
            self.compare_benchmarks,
            self.predict_churn,
            self.recommend_interventions
        ]
    
    # Agent 1: Metrics Scraper
    @staticmethod
    @tool
    def scrape_metrics(startup_id: str, data_source: str = "manual") -> Dict[str, Any]:
        """
        Agent 1: Scrape startup metrics from various sources
        
        Args:
            startup_id: Unique identifier for startup
            data_source: Source of data (stripe, mixpanel, manual)
            
        Returns:
            Current metrics for the startup
        """
        # TODO: Integrate with real APIs (Stripe, Mixpanel, etc.)
        # Mock data for now
        return {
            "startup_id": startup_id,
            "mrr": 50000,
            "arr": 600000,
            "burn_rate": 80000,
            "cac": 500,
            "ltv": 2500,
            "churn_rate": 3.5,
            "growth_rate": 15.0,
            "team_size": 12,
            "scraped_at": datetime.now().isoformat(),
            "source": data_source
        }
    
    # Agent 2: Burn Rate Tracker
    @staticmethod
    @tool
    def track_burn_rate(startup_id: str, cash_balance: float, monthly_burn: float) -> Dict[str, Any]:
        """
        Agent 2: Calculate runway and burn rate trends
        
        Args:
            startup_id: Startup identifier
            cash_balance: Current cash in bank
            monthly_burn: Average monthly burn rate
            
        Returns:
            Runway analysis and recommendations
        """
        runway_months = cash_balance / monthly_burn if monthly_burn > 0 else 999
        
        risk_level = "low"
        if runway_months < 6:
            risk_level = "critical"
        elif runway_months < 12:
            risk_level = "high"
        elif runway_months < 18:
            risk_level = "medium"
            
        return {
            "startup_id": startup_id,
            "cash_balance": cash_balance,
            "monthly_burn": monthly_burn,
            "runway_months": round(runway_months, 1),
            "risk_level": risk_level,
            "recommendation": "Raise funding" if runway_months < 12 else "Healthy runway",
            "calculated_at": datetime.now().isoformat()
        }
    
    # Agent 3: Alert Engine
    @staticmethod
    @tool
    def check_alerts(startup_id: str, metrics: Dict[str, float], thresholds: Dict[str, float] = None) -> Dict[str, Any]:
        """
        Agent 3: Check if metrics breach thresholds and generate alerts
        
        Args:
            startup_id: Startup identifier
            metrics: Current metrics dict
            thresholds: Alert thresholds (default provided)
            
        Returns:
            List of active alerts
        """
        if thresholds is None:
            thresholds = {
                "runway_months_min": 12,
                "churn_rate_max": 5.0,
                "growth_rate_min": 10.0,
                "ltv_cac_ratio_min": 3.0
            }
        
        alerts = []
        
        if metrics.get("runway_months", 999) < thresholds["runway_months_min"]:
            alerts.append({
                "type": "runway",
                "severity": "high",
                "message": f"Runway below {thresholds['runway_months_min']} months"
            })
            
        if metrics.get("churn_rate", 0) > thresholds["churn_rate_max"]:
            alerts.append({
                "type": "churn",
                "severity": "medium",
                "message": f"Churn rate above {thresholds['churn_rate_max']}%"
            })
            
        if metrics.get("growth_rate", 0) < thresholds["growth_rate_min"]:
            alerts.append({
                "type": "growth",
                "severity": "medium",
                "message": f"Growth rate below {thresholds['growth_rate_min']}%"
            })
            
        return {
            "startup_id": startup_id,
            "total_alerts": len(alerts),
            "alerts": alerts,
            "checked_at": datetime.now().isoformat()
        }
    
    # Agent 4: Health Reporter
    @staticmethod
    @tool
    def generate_health_report(startup_id: str, metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Agent 4: Generate weekly health report for a startup
        
        Args:
            startup_id: Startup identifier
            metrics: All current metrics
            
        Returns:
            Health score and detailed report
        """
        # Calculate health score (0-100)
        score = 0
        factors = []
        
        # Runway score (25 points max)
        runway = metrics.get("runway_months", 0)
        if runway >= 18:
            score += 25
            factors.append("Healthy runway (+25)")
        elif runway >= 12:
            score += 15
            factors.append("Adequate runway (+15)")
        elif runway >= 6:
            score += 5
            factors.append("Low runway (+5)")
        else:
            factors.append("Critical runway (0)")
            
        # Growth score (25 points max)
        growth = metrics.get("growth_rate", 0)
        if growth >= 20:
            score += 25
            factors.append("Excellent growth (+25)")
        elif growth >= 10:
            score += 15
            factors.append("Good growth (+15)")
        elif growth >= 0:
            score += 5
            factors.append("Flat growth (+5)")
        else:
            factors.append("Negative growth (0)")
            
        # LTV/CAC ratio (25 points max)
        ltv_cac = metrics.get("ltv", 0) / metrics.get("cac", 1)
        if ltv_cac >= 5:
            score += 25
            factors.append("Excellent unit economics (+25)")
        elif ltv_cac >= 3:
            score += 15
            factors.append("Good unit economics (+15)")
        elif ltv_cac >= 1:
            score += 5
            factors.append("Break-even economics (+5)")
        else:
            factors.append("Negative economics (0)")
            
        # Churn score (25 points max)
        churn = metrics.get("churn_rate", 100)
        if churn <= 2:
            score += 25
            factors.append("Excellent retention (+25)")
        elif churn <= 5:
            score += 15
            factors.append("Good retention (+15)")
        elif churn <= 10:
            score += 5
            factors.append("Fair retention (+5)")
        else:
            factors.append("Poor retention (0)")
            
        return {
            "startup_id": startup_id,
            "health_score": score,
            "grade": "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D" if score >= 20 else "F",
            "factors": factors,
            "report_date": datetime.now().isoformat()
        }
    
    # Agent 5: Trend Analyzer
    @staticmethod
    @tool
    def analyze_trends(startup_id: str, historical_data: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Agent 5: Analyze metric trends over time
        
        Args:
            startup_id: Startup identifier
            historical_data: List of monthly metrics snapshots
            
        Returns:
            Trend analysis and predictions
        """
        # Calculate trends (simplified)
        if len(historical_data) < 2:
            return {"startup_id": startup_id, "error": "Insufficient data"}
            
        latest = historical_data[-1]
        previous = historical_data[-2]
        
        trends = {}
        for key in ["mrr", "growth_rate", "churn_rate", "burn_rate"]:
            if key in latest and key in previous:
                change = latest[key] - previous[key]
                pct_change = (change / previous[key] * 100) if previous[key] != 0 else 0
                trends[key] = {
                    "direction": "up" if change > 0 else "down" if change < 0 else "flat",
                    "change": round(change, 2),
                    "pct_change": round(pct_change, 1)
                }
                
        return {
            "startup_id": startup_id,
            "trends": trends,
            "analysis_period": "monthly",
            "analyzed_at": datetime.now().isoformat()
        }
    
    # Agent 6: Benchmark Comparator
    @staticmethod
    @tool
    def compare_benchmarks(startup_id: str, metrics: Dict[str, float], industry: str = "SaaS") -> Dict[str, Any]:
        """
        Agent 6: Compare startup metrics to industry benchmarks
        
        Args:
            startup_id: Startup identifier
            metrics: Current metrics
            industry: Industry vertical for benchmarks
            
        Returns:
            Benchmark comparison and ranking
        """
        # Industry benchmarks (SaaS defaults)
        benchmarks = {
            "SaaS": {
                "growth_rate": {"top_quartile": 25, "median": 15, "bottom_quartile": 5},
                "churn_rate": {"top_quartile": 2, "median": 5, "bottom_quartile": 10},
                "ltv_cac_ratio": {"top_quartile": 5, "median": 3, "bottom_quartile": 1},
                "burn_multiple": {"top_quartile": 1, "median": 1.5, "bottom_quartile": 2}
            }
        }
        
        industry_bench = benchmarks.get(industry, benchmarks["SaaS"])
        comparisons = {}
        
        for metric, values in industry_bench.items():
            if metric in metrics:
                value = metrics[metric]
                if value >= values["top_quartile"]:
                    comparisons[metric] = {"percentile": 75, "status": "Top 25%"}
                elif value >= values["median"]:
                    comparisons[metric] = {"percentile": 50, "status": "Above median"}
                elif value >= values["bottom_quartile"]:
                    comparisons[metric] = {"percentile": 25, "status": "Below median"}
                else:
                    comparisons[metric] = {"percentile": 10, "status": "Bottom 25%"}
                    
        return {
            "startup_id": startup_id,
            "industry": industry,
            "comparisons": comparisons,
            "compared_at": datetime.now().isoformat()
        }
    
    # Agent 7: Churn Predictor
    @staticmethod
    @tool
    def predict_churn(startup_id: str, metrics: Dict[str, float], health_score: float) -> Dict[str, Any]:
        """
        Agent 7: Predict probability of startup failure/success
        
        Args:
            startup_id: Startup identifier
            metrics: Current metrics
            health_score: Health score from Agent 4
            
        Returns:
            Churn probability and risk factors
        """
        # Simple prediction model
        risk_factors = []
        churn_probability = 0
        
        # Runway risk
        if metrics.get("runway_months", 12) < 6:
            churn_probability += 40
            risk_factors.append("Critical runway (<6 months)")
        elif metrics.get("runway_months", 12) < 12:
            churn_probability += 20
            risk_factors.append("Low runway (<12 months)")
            
        # Growth risk
        if metrics.get("growth_rate", 0) < 0:
            churn_probability += 25
            risk_factors.append("Negative growth")
        elif metrics.get("growth_rate", 0) < 10:
            churn_probability += 10
            risk_factors.append("Slow growth")
            
        # Churn risk
        if metrics.get("churn_rate", 0) > 10:
            churn_probability += 20
            risk_factors.append("High churn (>10%)")
            
        # Health score risk
        if health_score < 40:
            churn_probability += 15
            risk_factors.append("Poor health score")
            
        churn_probability = min(churn_probability, 95)  # Cap at 95%
        
        return {
            "startup_id": startup_id,
            "churn_probability": churn_probability,
            "risk_level": "critical" if churn_probability > 60 else "high" if churn_probability > 40 else "medium" if churn_probability > 20 else "low",
            "risk_factors": risk_factors,
            "survival_probability": 100 - churn_probability,
            "predicted_at": datetime.now().isoformat()
        }
    
    # Agent 8: Recommendation Engine
    @staticmethod
    @tool
    def recommend_interventions(startup_id: str, alerts: List[Dict], churn_probability: float) -> Dict[str, Any]:
        """
        Agent 8: Suggest interventions based on alerts and predictions
        
        Args:
            startup_id: Startup identifier
            alerts: Active alerts from Agent 3
            churn_probability: From Agent 7
            
        Returns:
            Prioritized list of recommended actions
        """
        recommendations = []
        
        # Process alerts
        for alert in alerts:
            if alert.get("type") == "runway":
                recommendations.append({
                    "priority": "high",
                    "action": "Schedule fundraising strategy call",
                    "timeline": "This week",
                    "binh_phap": "Chapter 2: Runway is ammunition"
                })
            elif alert.get("type") == "churn":
                recommendations.append({
                    "priority": "medium",
                    "action": "Analyze churn reasons and implement retention strategy",
                    "timeline": "Within 2 weeks",
                    "binh_phap": "Chapter 6: Strengthen weaknesses"
                })
            elif alert.get("type") == "growth":
                recommendations.append({
                    "priority": "medium",
                    "action": "Review and optimize growth channels",
                    "timeline": "Within 2 weeks",
                    "binh_phap": "Chapter 5: Build momentum"
                })
                
        # Add churn-based recommendations
        if churn_probability > 60:
            recommendations.insert(0, {
                "priority": "critical",
                "action": "Emergency intervention - CEO call required",
                "timeline": "Today",
                "binh_phap": "Chapter 11: Crisis response"
            })
        elif churn_probability > 40:
            recommendations.append({
                "priority": "high",
                "action": "Accelerated support program",
                "timeline": "This week",
                "binh_phap": "Chapter 8: Know when to pivot"
            })
            
        return {
            "startup_id": startup_id,
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "generated_at": datetime.now().isoformat()
        }


# Test the agent cluster
if __name__ == "__main__":
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    agent = PortfolioMonitorAgent(redis_client)
    
    # Test with sample startup
    startup_id = "startup-001"
    
    # Agent 1: Scrape metrics
    metrics = agent.scrape_metrics(startup_id)
    print(f"Metrics: {metrics}")
    
    # Agent 2: Track burn rate
    burn = agent.track_burn_rate(startup_id, 1000000, 80000)
    print(f"Burn Rate: {burn}")
    
    # Agent 3: Check alerts
    alerts = agent.check_alerts(startup_id, {"runway_months": 10, "churn_rate": 6, "growth_rate": 8})
    print(f"Alerts: {alerts}")
    
    # Agent 4: Health report
    health = agent.generate_health_report(startup_id, metrics)
    print(f"Health: {health}")
