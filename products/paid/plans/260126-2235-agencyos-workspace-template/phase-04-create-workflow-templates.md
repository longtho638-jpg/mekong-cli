# Phase 4: Workflow Templates

## 1. Overview
Create actionable "Standard Operating Procedures" (SOPs) as AI-readable workflow templates. These allow the user to say "Run the Quarterly Review" and have the AI execute a structured process.

## 2. Requirements
- Workflows must cover the 5 core domains.
- Format: Markdown or simple text that Agents can parse and execute.
- Must be practical and "fill-in-the-blank" style.

## 3. Workflow List
1.  **Strategy**:
    - `00-quarterly-business-review.md`: Template for QBRs.
    - `00-strategic-audit.md`: "Ngũ Sự" analysis template.
2.  **Product**:
    - `01-project-kickoff.md`: Checklist for starting new client projects.
    - `01-sprint-planning.md`: Template for weekly sprints.
3.  **Marketing**:
    - `02-content-calendar-weekly.md`: Structure for weekly content.
    - `02-viral-hook-generator.md`: Prompt chain for content ideas.
4.  **Sales**:
    - `03-lead-qualification.md`: BANT framework scoring sheet.
    - `03-proposal-template.md`: Structure for high-converting proposals.
5.  **Finance**:
    - `04-invoice-generation.md`: Checklist for billing.
    - `04-pricing-calculator.md`: Logic for retainer/project pricing.

## 4. Implementation Steps
1.  **Design Templates**: Draft the content for each workflow based on best practices (Binh Pháp, Agile, etc.).
2.  **Write Files**: Save them to `.agent/workflows/`.
3.  **Link to Agents**: Ensure Agent prompts mention these workflows.

## 5. Todo List
- [ ] Create 2 Strategy workflows.
- [ ] Create 2 Product workflows.
- [ ] Create 2 Marketing workflows.
- [ ] Create 2 Sales workflows.
- [ ] Create 2 Finance workflows.

## 6. Success Criteria
- 10 Workflow templates created.
- Templates are clearly named and structured.
