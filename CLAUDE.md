# CLAUDE.md - Agency OS (Mekong CLI)

> 🏯 Agency OS v2.0 - Global Franchise Ready
> "Không đánh mà thắng" - Binh Pháp Applied
> **138 Core Modules | 83 Commits**

---

## 📊 Current State (2024-12-17)

| Metric | Value |
|--------|-------|
| Core Modules | 138 |
| Commits | 83 |
| Departments | 20 |
| Department Hubs | 17 |

---

## 🏢 Department Structure

### 1. 👥 Customer Success Hub (`cs_hub.py`)
| Module | Role |
|--------|------|
| `account_manager.py` | Client accounts & relationships |
| `onboarding_specialist.py` | Client onboarding workflow |
| `csm.py` | Success plans & QBRs |
| `cs_coordinator.py` | Task coordination |
| `cs_analyst.py` | Health scoring & insights |

### 2. 📞 Customer Service Hub (`service_hub.py`)
| Module | Role |
|--------|------|
| `tech_support.py` | Technical troubleshooting |
| `cs_team_lead.py` | Team management |
| `cs_rep.py` | Inquiry handling |
| `call_center.py` | Phone support |

### 3. 🎨 Creative Hub (`creative_hub.py`)
| Module | Role |
|--------|------|
| `art_director.py` | Creative briefs |
| `video_editor.py` | Video production |
| `web_designer.py` | Website design |
| `graphic_designer.py` | Visual assets |
| `ux_designer.py` | UX design |
| `illustrator.py` | Custom illustrations |
| `animator.py` | Motion graphics |

### 4. 📺 Media Hub (`media_hub.py`)
| Module | Role |
|--------|------|
| `content_writer.py` | Blog, copy, social |
| `journalist.py` | News & stories |
| `pr_specialist.py` | Public relations |

### 5. ⚙️ Engineering Hub (`engineering_hub.py`)
| Module | Role |
|--------|------|
| `devops_engineer.py` | CI/CD, infrastructure |
| `qa_engineer.py` | Testing, bug tracking |
| `data_engineer.py` | ETL pipelines |

### 6. 💻 IT Hub (`it_hub.py`)
| Module | Role |
|--------|------|
| `ciso.py` | Security, compliance |
| `it_manager.py` | Operations, vendors |
| `cto.py` | Strategy, innovation |
| `sysadmin.py` | Infrastructure, users |

### 7. 🛒 Retail Hub (`retail_hub.py`)
| Module | Role |
|--------|------|
| `ecommerce_manager.py` | Store management |
| `product_manager.py` | Catalog & pricing |
| `inventory_manager.py` | Stock & fulfillment |
| `digital_merchandiser.py` | Visual displays |
| `ecommerce_sales.py` | Revenue & recovery |

### 8. 🏠 Real Estate Hub (`real_estate_hub.py`)
| Module | Role |
|--------|------|
| `listing_manager.py` | Property listings |
| `re_market_analyst.py` | Market intelligence |
| `property_portfolio.py` | Asset management |
| `re_lead_manager.py` | Lead pipeline |

### 9. 📋 Administrative Hub (`admin_hub.py`)
| Module | Role |
|--------|------|
| `ai_executive_assistant.py` | Smart scheduling, tasks |
| `virtual_office_manager.py` | Resources, expenses |
| `data_automation.py` | Workflows, integrations |

### 10. 🌱 Personal Development Hub (`personal_development_hub.py`)
| Module | Role |
|--------|------|
| `career_development.py` | Paths, skills, training |
| `leadership_coach.py` | Competencies, coaching |
| `productivity_coach.py` | Habits, focus, performance |

### 11. 🚀 Entrepreneur Hub (`entrepreneur_hub.py`)
| Module | Role |
|--------|------|
| `startup_launcher.py` | Ventures, MVPs, experiments |
| `strategy_officer.py` | Vision, OKRs, initiatives |
| `operations_manager.py` | Processes, metrics, resources |

### 12. 💰 Sales Hub (`sales_hub.py`)
| Module | Role |
|--------|------|
| `crm.py` | Contacts, deals, pipeline |
| `lead_scoring.py` | Score, prioritize, qualify |
| `proposal_generator.py` | Quotes, pricing, close |

### 13. 📢 Marketing Hub (`marketing_hub.py`)
| Module | Role |
|--------|------|
| `campaign_manager.py` | Campaigns, channels, ROI |
| `social_media_manager.py` | Social posts, engagement |
| `email_automation.py` | Email sequences, lists |
| `content_generator.py` | Content ideas, calendar |

### 14. 👑 Executive Hub (`executive_hub.py`)
| Feature | Description |
|---------|-------------|
| Agency Health | Overall score across departments |
| Department View | 8 departments with status |
| Executive KPIs | Revenue, profit, retention |
| Strategic Priorities | Top company goals |

### 15. 👥 HR Hub (`hr_hub.py`)
| Module | Role |
|--------|------|
| `talent_acquisition.py` | Jobs, candidates, interviews |
| `hr_analytics.py` | eNPS, attrition, metrics |
| `compensation_manager.py` | Salary bands, benefits, comp |

### 16. 💵 Finance Hub (`finance_hub.py`)
| Module | Role |
|--------|------|
| `budget_manager.py` | Dept budgets, expenses |
| `cash_flow.py` | Cash in/out, runway |
| `financial_reports.py` | P&L, ratios, CFO dashboard |
| `invoice.py` | Client billing |
| `revenue_forecasting.py` | Projections |

### 17. 🎓 Education Hub (`education_hub.py`)
| Module | Role |
|--------|------|
| `course_manager.py` | LMS, lessons, enrollments |
| `knowledge_base.py` | Articles, resources, docs |
| `training_tracker.py` | Paths, certs, progress |

---

## 🔧 Core Operations Modules

### CRM & Client Management
- `crm.py` - Customer relationship management
- `client_health.py` - Health scoring
- `client_onboarding.py` - Onboarding flow
- `client_portal.py` - Client portal
- `client_portal_pro.py` - Advanced portal
- `client_ltv.py` - Lifetime value calculator
- `client_experience.py` - Experience tracking

### Sales & Revenue
- `invoice.py` - Invoice management
- `invoice_automation.py` - Automated invoicing
- `lead_scoring.py` - Lead qualification
- `proposal_gen.py` - Proposal generation
- `proposal_generator.py` - Advanced proposals
- `pricing.py` - Pricing engine
- `profit_margin.py` - Margin analysis
- `revenue_forecasting.py` - Revenue predictions
- `roi_calculator.py` - ROI calculations

### Marketing & Content
- `content_generator.py` - AI content ideas
- `email_automation.py` - Email campaigns
- `email_sequence.py` - Drip sequences
- `automated_outreach.py` - Outreach automation
- `testimonial.py` - Testimonial collection
- `referral.py` - Referral system

### Project Management
- `project_tracker.py` - Project tracking
- `project_templates.py` - Reusable templates
- `time_tracker.py` - Time tracking
- `resource_planner.py` - Resource allocation
- `capacity_dashboard.py` - Capacity planning
- `goal_tracker.py` - Goal management

### Analytics & Reporting
- `analytics.py` - Analytics engine
- `dashboard.py` - Dashboard system
- `report_builder.py` - Custom reports
- `agency_scorecard.py` - KPI grades
- `competitive_benchmark.py` - Industry comparison
- `growth_tracker.py` - Growth metrics
- `command_center.py` - Ultimate dashboard

### Integrations
- `calendar_sync.py` - Calendar integration
- `slack_integration.py` - Slack notifications
- `telegram_bot.py` - Telegram bot
- `webhooks.py` - Webhook management
- `pdf_generator.py` - PDF creation

### AI & Automation
- `ai_assistant.py` - AI assistant
- `ai_wingman.py` - Sales AI
- `hybrid_router.py` - Model routing
- `vibe_tuner.py` - Tone adjustment
- `voice_clone.py` - Voice cloning

### Team & Operations
- `team.py` - Team management
- `meeting.py` - Meeting scheduler
- `scheduler.py` - Task scheduling
- `automation.py` - Workflow automation
- `sop_library.py` - SOPs
- `knowledge_base.py` - Knowledge management

### Support & Feedback
- `support_tickets.py` - Ticket system
- `feedback.py` - Feedback collection
- `notification_center.py` - Notifications

### Business & Finance
- `expense.py` - Expense tracking
- `contract.py` - Contract management
- `business_plan_generator.py` - Business plans

### Franchise & Scale
- `empire_builder.py` - Empire building
- `franchise.py` - Franchise system
- `white_label.py` - White labeling
- `license.py` - License management
- `gamification.py` - Gamification system

### Infrastructure
- `api_keys.py` - API key management
- `i18n.py` - Internationalization
- `competitor.py` - Competitor analysis

---

## 🎯 Commands (Lệnh)

```bash
/ke-hoach "feature"     # Plan
/nau "feature"          # Build  
/sua "bug"              # Fix
/nong-san               # Analyze agriculture
/ban-hang               # Sales optimization
/tiep-thi               # Marketing
```

---

## 🔒 Data Diet Rules

**KHÔNG BAO GIỜ:**
- Đọc/hiển thị `.env`
- Commit API keys
- Log credentials

---

## 📂 Workflows

- `./.claude/workflows/primary-workflow.md`
- `./.claude/workflows/development-rules.md`
- `./.claude/workflows/orchestration-protocol.md`
- `./.claude/workflows/documentation-management.md`

---

**🏯 Agency OS - "Không đánh mà thắng"**