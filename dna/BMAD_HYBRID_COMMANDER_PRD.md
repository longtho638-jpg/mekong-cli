# DEEP TECH PRD: AGENCY-OS "HYBRID COMMANDER" ARCHITECTURE

**Project Codename:** `AgencyOS-C2` (Command & Control)
**Source:** BMAD-METHOD (`https://github.com/bmad-code-org/BMAD-METHOD`)
**Objective:** Establish secure bidirectional command link between Cloud (BMAD Logic) and Local (OpenClaw on M1).

---

## SYSTEM TOPOLOGY

```
┌─────────────────────────────────────────┐
│     THE BRAIN (Cloud - GCP/Antigravity) │
│     - BMAD Core (PM, Architect Agents)  │
│     - Decision: Cloud-Native vs Local   │
└─────────────────┬───────────────────────┘
                  │ HTTPS (Cloudflare Tunnel)
┌─────────────────▼───────────────────────┐
│          THE MUSCLE (M1 Mac)            │
│     - Local Soldier (FastAPI)           │
│     - OpenClaw (Browser Automation)     │
│     - Residential IP (Viettel/FPT)      │
└─────────────────────────────────────────┘
```

---

## PROTOCOL SCHEMA

```python
class TaskPayload(BaseModel):
    job_id: str
    agent_persona: str  # "SocialMediaManager", "VideoEditor"
    action_type: str    # "browser_navigate", "os_render", "file_upload"
    params: Dict[str, Any]
    priority: str = "normal"

class TaskResult(BaseModel):
    job_id: str
    status: str         # "success", "failed", "processing"
    data: Dict[str, Any]
    error_msg: Optional[str]
```

---

## IMPLEMENTATION PHASES

### Phase 1: Infrastructure Handshake

- Cloud: Generate `CF_TUNNEL_TOKEN`
- Local: `start_tunnel.sh` for `cloudflared`
- Verify: `ping_pong.py` (Cloud→Local→Cloud)

### Phase 2: Local Sentinel (apps/local_soldier)

- FastAPI server with `/exec` endpoint
- Playwright CDP to existing Chrome (port 9222)
- AppleScript for MacOS app control

### Phase 3: Cloud Brain (BMAD Integration)

- Inject `RemoteHands` tool into BMAD Architect
- Route `#local` tagged tasks to M1 Tunnel

### Phase 4: Feedback Loop

- Webhook `/api/callback` on Cloud
- Job status update in Redis

---

## CRITICAL: CHROME CDP MODE

```bash
# Start Chrome with debug port for cookie reuse
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222
```

---

## VIRAL ANGLE

> "Residential IP Mode" - Use home ISP IP (Viettel/FPT) instead of datacenter IP.
> Social media automation becomes "immortal" - no shadowban from IP detection.

---

## BMAD PERSONAS TO INJECT

Create in `dna/personas/`:

- `PM_AGENT.md` - Product Manager (writes PRD from vague ideas)
- `ARCHITECT_AGENT.md` - System Architect (designs structure)
- `QA_AGENT.md` - Quality Assurance (reviews code quality)

---

## EXECUTION COMMAND FOR ANTIGRAVITY

```markdown
@Antigravity

# MISSION: DEPLOY AGENCY-OS HYBRID CONTROLLER

STEP 1: Build `apps/local_soldier/main.py` (FastAPI)
STEP 2: Inject `RemoteHands` tool into BMAD router
STEP 3: Generate Cloudflare Tunnel config
STEP 4: Test Cloud→Local→Cloud loop

GOAL: Send "Download TikTok analytics" to Cloud, have M1 execute and return data.
```
