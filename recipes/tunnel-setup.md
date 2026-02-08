---
name: Cloudflare Tunnel Setup
display: one-button
agent: ShellAgent
---

# Cloudflare Tunnel Setup

Connect your local Mekong Gateway to the internet via Cloudflare Tunnel.
Enables remote access from OpenClaw, Telegram bots, or any web client.

## Step 1: Install cloudflared

brew install cloudflare/cloudflare/cloudflared || echo "Already installed"

## Step 2: Authenticate with Cloudflare

cloudflared tunnel login

## Step 3: Create tunnel

cloudflared tunnel create mekong-gateway

## Step 4: Configure DNS route

cloudflared tunnel route dns mekong-gateway gateway.yourdomain.com

## Step 5: Start persistent tunnel

cloudflared tunnel --url http://127.0.0.1:8000 run mekong-gateway
