# /ship - Ship Product to Production

Spawn agents: `fullstack-developer` + `tester`

## 🎯 Mục đích

Deploy và launch sản phẩm/feature ra production - Quân Tranh cluster.

## 💰 Money Flow
```
/ship → Product live → Users can buy → Revenue → $$$
```

## 🚀 Cách sử dụng

```bash
/ship                    # Pre-ship checklist
/ship feature "auth"     # Ship specific feature
/ship hotfix "bug123"    # Emergency fix
/ship rollback "v1.2.3"  # Rollback if needed
```

## 📝 Output Format

```markdown
## 🚀 Ship Checklist: [Feature/Version]

### ✅ Pre-Deploy
- [ ] All tests passing
- [ ] Code reviewed & approved
- [ ] Staging tested
- [ ] Docs updated
- [ ] Changelog updated

### 🔄 Deploy Steps
1. [ ] Backup database
2. [ ] Run migrations
3. [ ] Deploy to production
4. [ ] Verify health checks
5. [ ] Monitor errors

### 📢 Post-Deploy
- [ ] Announce to team
- [ ] Update status page
- [ ] Notify customers (if applicable)
- [ ] Monitor metrics 1 hour

### 🔙 Rollback Plan
- Trigger: Error rate > 1%
- Command: `npm run rollback`
- ETA: 5 minutes

### 📊 Success Metrics
- Error rate: < 0.1%
- Response time: < 200ms
- User feedback: Positive
```

---

*AgencyOS v10.0 | Quân Tranh Cluster*
