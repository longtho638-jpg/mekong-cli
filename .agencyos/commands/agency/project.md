# /project - Project Management Commands

Manage agency projects from creation to completion.

## Usage
```
/project [action] [name/id] [options]
```

## Actions
- **create**: Create new project
- **list**: List all projects
- **status**: Get project status
- **update**: Update project details
- **complete**: Mark project as complete
- **archive**: Archive completed project

## Examples
```
/project create "Website Redesign" --client "ABC Corp" --budget 15000
/project list --status active
/project status "Website Redesign"
/project update PRJ-001 --progress 75
/project complete PRJ-001
```

## Create Options
```
--client, -c      Client name or ID (required)
--budget, -b      Project budget
--type, -t        retainer, project, hourly
--start, -s       Start date (default: today)
--end, -e         End date
--description, -d Project description
```

## Workflow

### 1. Project Creation
```
/project create "SEO Campaign Q1" --client "XYZ" --budget 6000 --type retainer
```
Output:
```
✅ Project Created
ID: PRJ-2024-015
Name: SEO Campaign Q1
Client: XYZ Ventures
Budget: $6,000
Type: Retainer
Status: Active
Start: Dec 19, 2024
```

### 2. Project Tracking
```
/project status PRJ-2024-015
```
Output:
```
📁 SEO Campaign Q1 (PRJ-2024-015)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Client: XYZ Ventures
Status: In Progress
Progress: ████████░░░░░░░░ 45%

Budget: $6,000 ($2,700 spent)
Timeline: Dec 1, 2024 - Apr 30, 2025

Tasks:
  ✅ 9 completed
  🔄 5 in progress
  ⏳ 6 pending

Recent Activity:
  • Keyword research completed (2h ago)
  • Technical audit started (1d ago)
  • Client kickoff call (5d ago)
```

### 3. Project Updates
```
/project update PRJ-2024-015 --progress 60 --note "On-page optimization complete"
```

### 4. Project Completion
```
/project complete PRJ-2024-015
```
- Update status to "Completed"
- Generate final report
- Create case study draft
- Send completion notification

## Task Management
Projects can have tasks attached:
```
/project add-task PRJ-001 "Technical SEO Audit" --due "2024-12-25" --priority high
/project tasks PRJ-001
/project task-done PRJ-001 TASK-005
```

## Integration Points
- **Supabase**: Project and task storage
- **Client Portal**: Status updates for clients
- **Calendar**: Timeline and deadlines
- **Invoicing**: Link to billing

## Agent
Uses `@project-manager` agent for planning and tracking.

## Binh Pháp Alignment
**Chapter 1 - Kế Hoạch (Planning)**: Proper project planning is the foundation of success. "The general who wins a battle makes many calculations before the battle is fought."

## Database Schema
```sql
-- projects table
id, agency_id, client_id, name, description,
status, type, budget, start_date, end_date,
created_at, updated_at

-- tasks table  
id, agency_id, project_id, title, description,
status, priority, due_date, completed_at,
created_at, updated_at
```
