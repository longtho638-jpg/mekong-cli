#!/usr/bin/env python3
"""
Reporting System - Unified reporting for CLI and agent workflows
"""

import json
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Any

class ReportingSystem:
    def __init__(self, bridge_dir: Path):
        self.bridge_dir = bridge_dir
        self.reports_dir = bridge_dir / "reports"
        self.summary_file = bridge_dir / "execution_summary.json"
        
        # Ensure directory exists
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
    def generate_execution_summary(self) -> Dict[str, Any]:
        """Generate execution summary"""
        reports = []
        
        # Read all execution reports
        for report_file in self.reports_dir.glob("*.json"):
            try:
                report = json.loads(report_file.read_text())
                reports.append(report)
            except:
                continue
                
        # Calculate statistics
        total_executions = len(reports)
        successful = len([r for r in reports if r.get("status") == "success"])
        failed = total_executions - successful
        
        # Recent executions (last 24 hours)
        recent = []
        cutoff_time = datetime.now() - timedelta(hours=24)
        
        for report in reports:
            timestamp = report.get("timestamp")
            if timestamp:
                try:
                    dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    if dt > cutoff_time:
                        recent.append(report)
                except:
                    continue
                    
        # Command usage stats
        command_stats = {}
        for report in reports:
            command = report.get("command", "unknown")
            command_stats[command] = command_stats.get(command, 0) + 1
            
        # Skill usage stats
        skill_stats = {}
        for report in reports:
            if report.get("skill"):
                skill = report["skill"]
                skill_stats[skill] = skill_stats.get(skill, 0) + 1
                
        summary = {
            "generated_at": datetime.now().isoformat(),
            "total_executions": total_executions,
            "successful": successful,
            "failed": failed,
            "success_rate": successful / total_executions if total_executions > 0 else 0,
            "recent_24h": len(recent),
            "command_usage": command_stats,
            "skill_usage": skill_stats,
            "most_used_command": max(command_stats.items(), key=lambda x: x[1])[0] if command_stats else None,
            "most_used_skill": max(skill_stats.items(), key=lambda x: x[1])[0] if skill_stats else None
        }
        
        # Save summary
        self.summary_file.write_text(json.dumps(summary, indent=2))
        
        return summary
        
    def get_execution_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get execution history"""
        reports = []
        
        for report_file in sorted(self.reports_dir.glob("*.json"), reverse=True)[:limit]:
            try:
                report = json.loads(report_file.read_text())
                reports.append(report)
            except:
                continue
                
        return reports
        
    def format_report(self, report: Dict[str, Any]) -> str:
        """Format report for display"""
        status_emoji = "✅" if report.get("status") == "success" else "❌"
        command = report.get("command", "unknown")
        timestamp = report.get("timestamp", "")
        
        lines = [
            f"{status_emoji} {command}",
            f"   Time: {timestamp}",
        ]
        
        if report.get("skill"):
            lines.append(f"   Skill: {report['skill']}")
            
        if report.get("agent"):
            lines.append(f"   Agent: {report['agent']}")
            
        if report.get("error"):
            lines.append(f"   Error: {report['error']}")
            
        return "\n".join(lines)
        
    def display_summary(self):
        """Display execution summary"""
        summary = self.generate_execution_summary()
        
        print("📊 Execution Summary")
        print("=" * 50)
        print(f"Total: {summary['total_executions']} executions")
        print(f"Success: {summary['successful']} ({summary['success_rate']:.1%})")
        print(f"Failed: {summary['failed']}")
        print(f"Recent (24h): {summary['recent_24h']}")
        
        if summary['most_used_command']:
            print(f"Most used command: {summary['most_used_command']}")
            
        if summary['most_used_skill']:
            print(f"Most used skill: {summary['most_used_skill']}")
