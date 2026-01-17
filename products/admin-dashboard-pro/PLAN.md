# Admin Dashboard Pro - Implementation Plan

## Goal

Build a modern Next.js 14 Dashboard that:

1.  **Reads Local Data**: Displays real data from `~/.mekong/*.json` (Sales, Leads, Queue).
2.  **Is Sellable**: A clean, component-based architecture that serves as a premium template ($47).
3.  **Is "WOW"**: Dark mode, charts, sleek UI (Tailwind + Framer Motion).

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Recharts (Charts)
- Framer Motion (Animations)

## Features

1.  **Overview Page**: Revenue charts, recent activity.
2.  **CRM Page**: Kanban board of leads (from `leads.json`).
3.  **Sales Page**: Transaction history (from `sales.log`).
4.  **Content Page**: Social queue visuals (from `social_queue.json`).
5.  **Settings**: API key management.

## Project Structure

```
src/
  app/
    api/        # Local API routes to read JSON
    page.tsx    # Dashboard Home
    crm/        # Lead Management
    sales/      # Revenue
  components/
    ui/         # Shadcn-like components
    charts/     # Recharts wrappers
  lib/
    mekong.ts   # Utilities to read local files
```
