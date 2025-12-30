# /invoice - Generate and Send Invoices

Create professional invoices for clients with automatic calculations and delivery.

## Usage
```
/invoice [action] [client] [options]
```

## Actions
- **create**: Generate new invoice
- **send**: Email invoice to client
- **list**: List invoices for client
- **status**: Check invoice status
- **remind**: Send payment reminder

## Examples
```
/invoice create "ABC Corporation" --amount 2500 --description "Monthly Retainer"
/invoice send INV-2024-001
/invoice list "XYZ Ventures"
/invoice status INV-2024-001
/invoice remind INV-2024-001
```

## Options
```
--amount, -a      Invoice amount (required for create)
--description, -d Description/line items
--due, -D         Due date (default: 30 days)
--currency, -c    Currency code (default: USD)
--tax, -t         Tax percentage (default: 0)
--project, -p     Link to project
--send            Auto-send after creation
```

## Workflow

### 1. Invoice Creation
```
/invoice create "ABC Corporation" -a 2500 -d "December 2024 Retainer"
```
- Fetch client details from Supabase
- Generate unique invoice number (INV-YYYY-NNN)
- Calculate totals with tax
- Create invoice record in database
- Generate PDF

### 2. Invoice Delivery
```
/invoice send INV-2024-012
```
- Retrieve invoice from database
- Generate payment link (Polar.sh)
- Send email with PDF attachment
- Update status to "sent"
- Log activity

### 3. Payment Tracking
```
/invoice status INV-2024-012
```
Output:
```
Invoice: INV-2024-012
Client: ABC Corporation
Amount: $2,500.00
Status: PENDING
Sent: Dec 15, 2024
Due: Dec 30, 2024
Days Until Due: 11
```

### 4. Payment Reminders
```
/invoice remind INV-2024-012
```
- Check if overdue or approaching due date
- Send reminder email
- Log reminder sent

## Invoice Template
```
┌────────────────────────────────────────────────┐
│                    INVOICE                      │
│                                                 │
│  Agency OS                     Invoice #: {id}  │
│  Your Agency Name              Date: {date}    │
│  your@agency.com               Due: {due_date} │
│                                                 │
├─────────────────────────────────────────────────┤
│  Bill To:                                       │
│  {client_name}                                  │
│  {client_email}                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  Description                          Amount   │
│  ─────────────────────────────────────────────  │
│  {line_items}                                   │
│                                                 │
│                          Subtotal: ${subtotal}  │
│                          Tax ({tax}%): ${tax}   │
│                          ─────────────────────  │
│                          TOTAL: ${total}        │
│                                                 │
├─────────────────────────────────────────────────┤
│  Payment: {polar_payment_link}                  │
│                                                 │
│  Thank you for your business!                   │
└─────────────────────────────────────────────────┘
```

## Integration Points
- **Supabase**: Invoice storage, client data
- **Polar.sh**: Payment links
- **SendGrid/Resend**: Email delivery
- **react-pdf**: PDF generation

## Agent
Uses `@accountant` agent for calculations and `@mailer` for delivery.

## Binh Pháp Alignment
**Chapter 2 - Tác Chiến (Resources)**: Efficient invoicing ensures steady cash flow. "An army marches on its stomach" - timely billing keeps agency running.

## Database Schema
```sql
-- invoices table
id, agency_id, client_id, invoice_number, 
status, amount, tax, total, currency,
issue_date, due_date, paid_date, notes,
stripe_invoice_id, created_at, updated_at
```
