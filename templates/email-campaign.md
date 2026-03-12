# SOP: Email Marketing Campaign

**ID:** SOP-MKT-001 | **Version:** 1.0 | **Owner:** Marketing Agent

---

## Trigger

- [ ] Campaign scheduled date reached
- [ ] Manual trigger from dashboard
- [ ] Automated nurture sequence step
- [ ] Product launch milestone

---

## Prerequisites

- [ ] Email list segmented
- [ ] Email template designed
- [ ] Copy written and approved
- [ ] Tracking configured

---

## Steps

### Step 1: Validate Campaign Assets
```
CHECK: template.html exists AND valid
CHECK: subject_line.length <= 70
CHECK: preview_text.length <= 100
CHECK: unsubscribe_link present
CHECK: sender_domain authenticated (SPF, DKIM)
```

### Step 2: Segment Audience
```
audience = contacts.where({
  status: "active",
  email_verified: true,
  unsubscribed: false
})

IF campaign.target_segment:
  audience = audience.where(campaign.target_segment)

audience = deduplicate(audience, by: "email")
```

### Step 3: Throttle Send Rate
```
send_limit = {
  default: 500/hour,
  new_domain: 100/hour,
  warmed_up: 2000/hour
}[domain.reputation]

batch_size = send_limit / 60  # per minute
```

### Step 4: Send Emails
```
FOR EACH batch IN chunks(audience, batch_size):
  FOR EACH contact IN batch:
    email = personalize({
      template: campaign.template,
      contact: contact,
      variables: campaign.merge_fields
    })

    result = email.send({
      to: contact.email,
      from: campaign.from_address,
      subject: campaign.subject,
      body: email,
      tracking: {
        opens: true,
        clicks: true,
        unsub: true
      }
    })

    log.send_result(result)

  WAIT: 60 seconds  # rate limiting
```

### Step 5: Monitor Delivery
```
delivery_stats = {
  sent: emails.count(),
  delivered: bounces.where(type="soft").count(),
  hard_bounced: bounces.where(type="hard").count(),
  opened: opens.count(),
  clicked: clicks.count(),
  unsubscribed: unsubs.count()
}

open_rate = delivery_stats.opened / delivery_stats.delivered
click_rate = delivery_stats.clicked / delivery_stats.delivered
```

### Step 6: Process Bounces
```
hard_bounces = bounces.where(type="hard")
FOR EACH bounce IN hard_bounces:
  contact.update({
    email: bounce.email,
    status: "bounced",
    bounce_reason: bounce.reason
  })
```

### Step 7: Process Unsubscribes
```
unsubscribes = unsubs.list()
FOR EACH unsub IN unsubscribes:
  contact.update({
    email: unsub.email,
    unsubscribed: true,
    unsubscribed_at: now()
  })
```

### Step 8: Generate Report
```
report = {
  campaign_id: campaign.id,
  sent_at: now(),
  stats: delivery_stats,
  open_rate: open_rate,
  click_rate: click_rate,
  revenue_attributed: attribute_revenue(campaign.id),
  top_links: clicks.group_by(url).top(5)
}
```

### Step 9: Follow-up Actions
```
IF campaign.nurture_sequence:
  next_step = campaign.nurture_sequence.next()
  FOR EACH contact IN engaged_users (opened OR clicked):
    task.schedule({
      type: "nurture_email",
      step: next_step,
      contact_id: contact.id,
      send_at: now() + next_step.delay
    })
```

---

## Success Criteria

- [ ] All emails sent successfully
- [ ] Bounces processed
- [ ] Unsubscribes honored
- [ ] Report generated
- [ ] Follow-up tasks scheduled

---

## Error Handling

| Error | Action |
|-------|--------|
| SMTP rate limit | Pause, wait, resume |
| High bounce rate (>5%) | Pause campaign, alert |
| Spam complaints | Pause, review content |
| Link broken | Fix, resend to unopens |

---

## Rollback

If campaign sent with errors:
1. Pause remaining sends
2. Send apology/correction if needed
3. Document issue
4. Resend corrected version to affected

---

## Related SOPs

- SOP-SAL-001: Qualify Lead
- SOP-MKT-002: Social Media Post
- SOP-OPS-004: Payment Follow-up
