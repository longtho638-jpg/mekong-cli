# 🧠 AUTONOMOUS ORGANIZATION BLUEPRINT (Level 5)
**Vision**: A self-driving company where Humans define "Goal" and Agents execute "Everything Else".

---

## 🏗️ 1. THE HIERARCHY OF AGENTS
We replace the traditional Org Chart with an "Agent Cluster" map.

### 👑 C-LEVEL (The Strategic Brain)
*   **Role**: Set OKRs, Allocates Budget, Manages Risk.
*   **Human Input**: Quarterly Goal (e.g., "$500k ARR").
*   **Agents**:
    *   **CEO/COO**: `Agent 21 (OKR & Execution)` - Breaks Goal into Team OKRs.
    *   **CFO**: `Agent 05 (Business Model)` + `Agent 16 (Fundraising)` - Manages Cashflow & Investor Updates.
    *   **CRO (Revenue)**: `Agent 14 (GTM Strategy)` - Decides *where* to sell (Channels).

### 👔 MANAGEMENT (The Tactical Planners)
*   **Role**: Turns OKRs into Weekly Tasks & Content Calendars.
*   **Agents**:
    *   **Marketing Mgr**: `Agent 15 (Analytics)` + `Agent 08 (Content Strategy)` - Plans the "Angle" for the week.
    *   **Sales Mgr**: `Agent 13 (Sales Process)` - Generates script variations and target lists.

### 🛠️ EXECUTION (The Hands)
*   **Role**: Does the actual work (Writing, Coding, Posting, Mailing).
*   **Agents**:
    *   **Copywriter**: `Agent 10 (Ads)` + `Agent 11 (Storytelling)` - Writes specific FB Ads/Blogs.
    *   **Outreach**: `Agent 12 (Email)` - Sends the emails (via API).
    *   **Coder**: `Gemini (Coding)` - Updates the website/app features.

---

## 🔄 2. THE "FOREVER" LOOP (Cron Job Architecture)
To run this "forever" without human micromanagement, we run a **Cascading Loop**.

### 🗓️ The Monthly Loop (Strategy)
*   **Trigger**: 1st of Month.
*   **Action**: `Agent 21` reads `Analytics_Report.json`.
*   **Output**: Updates `COMPANY_OKRS.json` (e.g., "Shift focus from Awareness to Conversion").

### 🗓️ The Weekly Loop (Planning)
*   **Trigger**: Every Monday 8:00 AM.
*   **Action**: `Agent 14` & `Agent 08` read `COMPANY_OKRS.json`.
*   **Output**: Generates `WEEKLY_EXECUTION_PLAN.json` (7 days of Ad Hooks, Blog Topics).

### 🗓️ The Daily Loop (Operations)
*   **Trigger**: Every Morning 9:00 AM.
*   **Action**: `Agent 10` (Ads) & `Agent 11` (Story) read `WEEKLY_EXECUTION_PLAN.json`.
*   **Output**:
    1.  Generates actual text/images for the day.
    2.  Pushes to Zalo/FB/TikTok (via API).
    3.  Updates `DAILY_METRICS.json`.

---

## 💻 3. TECHNICAL IMPLEMENTATION
We utilize the existing `bizplan-cli-toolkit` as the kernel.

### The Master Script (`run_autonomous_level_4.js`)
This script acts as the "Operating System". It checks the date/time and triggers the correct Agents.

```javascript
// Pseudo-code for Autonomous Loop
async function runForever() {
  while(true) {
    const today = new Date();
    
    if (isFirstDayOfMonth(today)) {
       await runStrategyLayer(); // Agents 21, 16, 05
    }
    
    if (isMonday(today)) {
       await runPlanningLayer(); // Agents 14, 08, 15
    }
    
    await runExecutionLayer();   // Agents 10, 11, 12
    
    // Sleep for 24 hours
    await sleep(24 * 60 * 60 * 1000);
  }
}
```

---

## 🚀 4. DEPLOYMENT STEPS
1.  **Define Top Goal**: Set the "North Star" in `master_config.json`.
2.  **Connect APIs**: Ensure Agents have write-access to Social/Email APIs (Resend, FB Graph).
3.  **Run the Daemon**: Deploy `run_autonomous_level_4.js` on a VPS (EC2/DigitalOcean) with `pm2`.
4.  **Monitor**: Human only checks the `WEEKLY_REPORT.pdf` sent to email on Friday.

