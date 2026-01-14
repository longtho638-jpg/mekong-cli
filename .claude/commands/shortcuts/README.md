# 🔗 Command Shortcuts

> **Legacy shortcuts → New suites mapping**

## How Shortcuts Work

Shortcuts provide backward compatibility. Old commands redirect to new suites:

```
/cook       →  /dev:cook
/test       →  /dev:test  
/quote      →  /revenue:quote
/plan       →  /strategy:plan
```

## Shortcut List

| Shortcut | Redirects To | Suite |
|----------|--------------|-------|
| `/cook` | `/dev:cook` | dev |
| `/test` | `/dev:test` | dev |
| `/ship` | `/dev:ship` | dev |
| `/debug` | `/dev:debug` | dev |
| `/quote` | `/revenue:quote` | revenue |
| `/invoice` | `/revenue:invoice` | revenue |
| `/proposal` | `/revenue:proposal` | revenue |
| `/plan` | `/strategy:plan` | strategy |
| `/binh-phap` | `/strategy:analyze` | strategy |

## Migration Notice

When using shortcuts, you'll see:

```
⚠️ Shortcut: /cook → /dev:cook
   Consider using /dev:cook directly
```

---

> 🏯 **Shortcuts = Backward compatibility**
