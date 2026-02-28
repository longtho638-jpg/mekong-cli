# User Manual: How to Use Your AgencyOS Machine

> For everyone — no coding experience needed.
> Danh cho nguoi khong biet code.

## What is Mekong Dashboard?

Mekong Dashboard is your **control panel**. Think of it like a washing machine — you press a button, it does the work.

## Getting Started

### Option 1: Web Dashboard (Recommended)

1. Open your browser
2. Go to: `http://localhost:8000`
3. Enter your API Token (ask your admin)
4. Click **Save**
5. Press any button!

### Option 2: Terminal Menu

```bash
mekong dash
```

Pick a number from the menu. Done.

## Available Actions

| Button | What It Does |
|--------|-------------|
| Quick Deploy | Deploys all your apps to the internet |
| Audit Leads | Checks all your lead sources |
| Plan Content | Creates a content plan for the week |
| Ask AI | Answers your question using AI |
| Code Review | Checks code quality and security |
| System Status | Shows health of all services |

## Understanding Results

### Green = Success

> "All done! 3 tasks completed successfully."
> "Xong! 3 tac vu hoan thanh thanh cong."

Everything worked. Nothing to do.

### Yellow = Partial

> "Partially done. 2/3 tasks completed."

Some things worked, some need attention. Check the details.

### Red = Failed

> "Failed. 1 task had problems."

Something went wrong. Show the error to your developer.

## Custom Goals

You can also type your own goal:

- In the web dashboard: type in the text box at the bottom
- In the terminal: use `mekong cook "your goal here"`

## Security

- Your API Token is like a password — keep it safe
- The token is saved in your browser (localStorage)
- Never share your token with untrusted people

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API Token not set" | Enter your token and click Save |
| "Invalid token" | Check your token with your admin |
| "Network Error" | Make sure the server is running |
| Button stays yellow | The task is still running — wait |

## Need Help?

Contact your system administrator or run:

```bash
mekong --help
```
