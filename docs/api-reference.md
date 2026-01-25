# API Reference

**Version:** 0.2.0
**Last Updated:** 2026-01-25

## Endpoints

### GET /campaigns/
List Campaigns

### GET /api/agentops/
List All Ops

### GET /api/agentops/health
Health Check

### GET /api/agentops/{category}
Get Ops Status

### POST /api/agentops/execute
Execute Ops

### GET /api/agentops/categories/summary
Get Categories Summary

### GET /api/agentops/binh-phap/chapters
Get Binh Phap Chapters

### GET /api/agents
Get Agents

### POST /api/agents/run
Run Agent

### GET /api/router/stats
Get Router Stats

### POST /api/router/route
Route Task

### GET /api/vibes
Get Vibes

### POST /api/vibes/set
Set Vibe

### GET /api/vibes/prompt
Get Vibe Prompt

### POST /api/commands/khach-hang
Cmd Khach Hang

### POST /api/commands/ke-hoach-kinh-doanh
Cmd Ke Hoach Kinh Doanh

### POST /api/commands/nghien-cuu-thi-truong
Cmd Nghien Cuu Thi Truong

### POST /api/commands/nhan-dien-thuong-hieu
Cmd Nhan Dien Thuong Hieu

### POST /api/commands/thong-diep-tiep-thi
Cmd Thong Diep Tiep Thi

### POST /api/commands/ke-hoach-tiep-thi
Cmd Ke Hoach Tiep Thi

### POST /api/commands/noi-dung-tiep-thi
Cmd Noi Dung Tiep Thi

### POST /api/commands/y-tuong-social-media
Cmd Y Tuong Social Media

### POST /api/commands/chien-luoc-ban-hang
Cmd Chien Luoc Ban Hang

### POST /api/commands/ke-hoach-pr
Cmd Ke Hoach Pr

### POST /api/commands/ke-hoach-tang-truong
Cmd Ke Hoach Tang Truong

### POST /api/commands/nong-san
Cmd Nong San

### POST /api/commands/ban-hang
Cmd Ban Hang

### POST /api/commands/tiep-thi
Cmd Tiep Thi

### GET /monitor/status
Get Status

### GET /workflow/list
List Workflows

### POST /workflow/create
Create Workflow

### POST /workflow/{workflow_id}/save
Save Workflow

### POST /workflow/{workflow_id}/execute
Execute Workflow

### GET /agents-creator/skills
List Available Skills

### POST /agents-creator/create
Create Agent

### GET /audit/logs
Get Audit Logs

### POST /webhooks/paypal/
Handle Webhook

### GET /webhooks/paypal/status
Webhook Status

### POST /webhooks/stripe/
Handle Webhook

### POST /webhooks/gumroad/
Handle Webhook

### GET /api/v1/payments/status
Get Status

### POST /api/v1/payments/paypal/create-order
Create Paypal Order

### POST /api/v1/payments/paypal/capture-order
Capture Paypal Order

### POST /api/v1/payments/paypal/create-subscription
Create Paypal Subscription

### GET /api/v1/payments/paypal/subscription/{subscription_id}
Get Paypal Subscription

### POST /api/v1/payments/paypal/subscription/{subscription_id}/cancel
Cancel Paypal Subscription

### POST /api/v1/payments/stripe/create-checkout
Create Stripe Checkout

### GET /revenue/dashboard
Get Revenue Dashboard

### POST /revenue/sync
Sync Revenue

### GET /revenue/summary
Get Revenue Summary

### GET /revenue/by-product
Get Revenue By Product

### GET /revenue/by-period
Get Revenue By Period

### GET /revenue/affiliates
Get Revenue Affiliates

### GET /ops/status
Get Ops Status

### GET /ops/quota
Get Quota

### GET /swarm/status
Get Swarm Status

### POST /swarm/dispatch
Dispatch Task

### GET /swarm/tasks
List Tasks

### GET /ws/status
Get Websocket Status

### POST /ws/broadcast
Broadcast Message

### POST /ws/trigger/{event_type}
Trigger Event

### POST /token
Login For Access Token

### GET /
Root

### GET /health
Health

### GET /metrics
Metrics

