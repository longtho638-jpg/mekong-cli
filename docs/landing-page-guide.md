# Landing Page Builder & Optimization Guide

## Overview

The Landing Page Builder (Mission IPO-022) is a comprehensive system designed for rapid marketing campaign deployment, A/B testing, and conversion rate optimization. It empowers marketers to build high-performance landing pages without engineering bottlenecks.

## Key Features

1.  **Drag-and-Drop Builder**: Intuitive interface to construct pages using pre-built blocks (Hero, Features, CTA, Forms).
2.  **A/B Testing Framework**: Built-in capabilities to split traffic between variants and statistically determine winners.
3.  **Conversion Optimization**: Integrated heatmaps, scroll tracking, and funnel analytics.
4.  **Performance First**: Optimized for Core Web Vitals (Next.js, image optimization, code splitting).

## Architecture

### Frontend (`apps/landing`)
-   **Framework**: Next.js 16 (App Router)
-   **State Management**: React `useReducer` with Undo/Redo history.
-   **Drag & Drop**: `@dnd-kit/core` for accessible, robust drag interactions.
-   **Styling**: Tailwind CSS with `shadcn/ui` principles.
-   **Visualization**: `recharts` for analytics dashboards.

### Backend (`backend`)
-   **API**: FastAPI routers at `/api/landing-pages`.
-   **Database**: PostgreSQL with SQLAlchemy ORM.
-   **Services**:
    -   `LandingPageService`: CRUD, publishing logic, template instantiation.
    -   `ABTestingService`: Traffic splitting logic, event recording (chi-square stats pending).

## User Guide: Building a Page

1.  **Access the Builder**: Navigate to `/builder`.
2.  **Choose Components**: Drag components from the left palette (Hero, Features, etc.) onto the canvas.
3.  **Edit Properties**: Click any component on the canvas to open the Property Panel on the right. Customize text, colors, images, and links.
4.  **Responsive Check**: Use the device toggle (Desktop/Tablet/Mobile) in the toolbar to verify responsiveness.
5.  **Save & Publish**: Click "Publish" to make the page live.

## A/B Testing Workflow

1.  **Create Test**: Duplicate an existing page to create a Variant B.
2.  **Configure Split**: In the dashboard, select the original and variant, and define traffic split (e.g., 50/50).
3.  **Launch**: Start the test. The system will automatically route users based on a sticky cookie.
4.  **Analyze**: View the "A/B Testing" tab in Analytics to see conversion rates and statistical confidence.
5.  **Winner**: Once significance (>95%) is reached, promote the winner to 100% traffic.

## Analytics & Heatmaps

-   **Tracker**: The `<Tracker />` component is automatically embedded in published pages.
-   **Events**: Tracks Page Views, Clicks (for heatmaps), Scroll Depth, and Form Submissions.
-   **Dashboard**: Visualize traffic trends, top referrers, and conversion funnels at `/analytics`.

## Developer Notes

### Adding New Components
1.  **Define Type**: Add to `ComponentType` in `lib/builder/types.ts`.
2.  **Define Properties**: Add schema to `COMPONENT_DEFINITIONS`.
3.  **Create React Component**: Build the visual component in `components/blocks/index.tsx`.
4.  **Register**: Add to `ComponentMap` in `components/builder/SortableItem.tsx` and `DnDEditor.tsx`.

### Database Schema
-   `landing_pages`: Stores the JSON structure of the page content.
-   `ab_tests`: Manages active tests and traffic splits.
-   `landing_analytics_events`: High-volume table for raw event data.

## Deployment
-   **Frontend**: Deploys as a standard Next.js container (Standalone mode).
-   **Backend**: Deploys with the main FastAPI service.
-   **Migrations**: Run `alembic upgrade head` to apply schema changes.

## Security
-   All form submissions are validated.
-   Public pages are read-only; Builder APIs require authentication (Admin/User).
