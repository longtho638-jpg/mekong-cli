"""
Formatting logic for Project views in the portal.
"""
from typing import List

from .entities_proxy import Project


class ProjectViewPresenter:
    def format_project_details(self, project: Project) -> str:
        lines = [f"📋 Project: {project.name}", f"📝 Description: {project.description}", f"📊 Progress: {project.progress:.1f}%", f"💰 Budget: ${project.budget:,.2f} / Spent: ${project.spent:,.2f}", f"📅 Started: {project.start_date.strftime('%Y-%m-%d')}", f"🏁 Deadline: {project.end_date.strftime('%Y-%m-%d') if project.end_date else 'Not set'}", "", "📝 Tasks:"]
        for task in project.tasks:
            icon = {"todo": "⏳", "in_progress": "🔄", "review": "👀", "done": "✅"}.get(task.status.value, "❓")
            lines.append(f"  {icon} {task.name} ({task.status.value})")
        return "\n".join(lines)

    def format_project_list(self, projects: List[Project]) -> str:
        if not projects: return "No projects found."
        lines = ["🚀 Project List:", "=" * 60]
        for project in projects:
            lines.append(f"📋 {project.name}\n   Client ID: {project.client_id}\n   Progress: {project.progress:.1f}% | Budget: ${project.budget:,.2f}\n   Status: {project.status.value}\n")
        return "\n".join(lines)
