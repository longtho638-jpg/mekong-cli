---
description: ➕ Add and qualify a new client
argument-hint: "Client Name"
---

## Mission

Add a new client to the CRM and qualify the lead.

## Workflow

1. **Collect Client Info**
   - Name: `$ARGUMENTS` or prompt
   - Company
   - Email
   - Phone
   - Lead source (Referral/Network/Inbound/etc.)

2. **Delegate to Agent**
   - Use `client-magnet` agent for lead qualification

3. **Execute Python**
   ```bash
   python -c "
   from antigravity.core.client_magnet import ClientMagnet, LeadSource
   magnet = ClientMagnet()
   lead = magnet.add_lead(
       name='$NAME',
       company='$COMPANY',
       email='$EMAIL',
       phone='$PHONE',
       source=LeadSource.REFERRAL
   )
   magnet.qualify_lead(lead, budget=1000, score=70)
   client = magnet.convert_to_client(lead)
   print(f'✅ Client added: {client}')
   "
   ```

4. **Report**
   - Client details
   - Qualification score
   - Next recommended action

---

🎯 **"Mỗi khách hàng là một câu chuyện"** - Every client is a story
