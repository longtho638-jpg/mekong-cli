# 🌸 AGRIOS CORE IP - Technical Documentation
> **Tên tác phẩm**: Agentic OS & Garden OS Framework
> **Tác giả**: Minh Long
> **Version**: 1.0.0
> **Ngày tạo**: 2024

---

## 📋 Mục Lục (Table of Contents)

1. [Tổng Quan (Overview)](#tổng-quan)
2. [Kiến Trúc Hệ Thống (Architecture)](#kiến-trúc-hệ-thống)
3. [Agentic OS Engine](#agentic-os-engine)
4. [Garden OS Framework](#garden-os-framework)
5. [AI/ML Services](#aiml-services)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)

---

## 🎯 Tổng Quan

### Mô tả (Description)

**AGRIOS** (AI-Powered Agricultural Intelligence Operating System) là hệ thống phần mềm độc quyền được phát triển để số hóa và tối ưu hóa hoạt động kinh doanh hoa kiểng tại Việt Nam, đặc biệt tại làng hoa Sa Đéc.

### Các thành phần chính (Core Components)

| Component | Mô tả | Công nghệ |
|-----------|-------|-----------|
| **Agentic OS Engine** | Hệ thống điều phối AI đa tác vụ | TypeScript, Gemini AI |
| **Garden OS Framework** | Nền tảng quản lý vườn hoa | Next.js, Supabase |
| **Yield Predictor** | Dự báo năng suất và giá cả | ML Algorithms |
| **Multi-Agent System** | 24 agent chuyên biệt | Agent Protocol |

### Tính năng nổi bật (Key Features)

1. **AI-Powered Orchestration**: CEO Agent điều phối 24 agent chuyên biệt
2. **Dynamic Pricing**: Thuật toán định giá dựa trên cung-cầu
3. **Flash Sale Detection**: Phát hiện "Giải cứu hoa" tự động
4. **Multi-channel Marketing**: Tự động tạo nội dung TikTok, SEO, Email

---

## 🏗️ Kiến Trúc Hệ Thống

### Architecture Diagram

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                          AGRIOS ARCHITECTURE                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │                    PRESENTATION LAYER                               │  ║
║  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  ║
║  │  │   Web App   │ │  Admin UI   │ │  IPO Suite  │ │ Mobile PWA  │   │  ║
║  │  │  (Next.js)  │ │  Dashboard  │ │  Readiness  │ │  Offline    │   │  ║
║  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                    │                                      ║
║                                    ▼                                      ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │                    AGENTIC OS ENGINE                                │  ║
║  │  ┌─────────────────────────────────────────────────────────────┐   │  ║
║  │  │                   MASTER AGENT (CEO)                        │   │  ║
║  │  │  • orchestrate() - Điều phối toàn bộ workflow               │   │  ║
║  │  │  • determineDepartments() - Xác định phòng ban              │   │  ║
║  │  │  • delegateToDepartment() - Phân công nhiệm vụ              │   │  ║
║  │  └─────────────────────────────────────────────────────────────┘   │  ║
║  │                           │                                        │  ║
║  │          ┌────────────────┼────────────────┐                       │  ║
║  │          ▼                ▼                ▼                       │  ║
║  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │  ║
║  │  │  Marketing  │  │   Sales     │  │  Finance    │                │  ║
║  │  │    Dept     │  │    Dept     │  │    Dept     │                │  ║
║  │  └─────────────┘  └─────────────┘  └─────────────┘                │  ║
║  │        │                │                │                         │  ║
║  │        ▼                ▼                ▼                         │  ║
║  │  ┌─────────────────────────────────────────────────────────────┐   │  ║
║  │  │                 24 SPECIALIZED AGENTS                       │   │  ║
║  │  │  02: Mapping | 03: IPO | 04: Gap | 05: BizModel | ...      │   │  ║
║  │  │  11: Story | 13: Sales | 16: Fundraising | 21: OKR | ...   │   │  ║
║  │  └─────────────────────────────────────────────────────────────┘   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                    │                                      ║
║                                    ▼                                      ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │                    GARDEN OS FRAMEWORK                              │  ║
║  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  ║
║  │  │   Yield     │ │  Content    │ │   Lead      │ │  TikTok     │   │  ║
║  │  │  Predictor  │ │  Generator  │ │  Nurture    │ │   Viral     │   │  ║
║  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                    │                                      ║
║                                    ▼                                      ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │                      AI/ML SERVICES                                 │  ║
║  │  ┌─────────────────────────────────────────────────────────────┐   │  ║
║  │  │              GEMINI SERVICE (Google AI)                     │   │  ║
║  │  │  • generateText() - Tạo văn bản                             │   │  ║
║  │  │  • generateFromImage() - Nhận diện hình ảnh                 │   │  ║
║  │  │  • generateMarketingContent() - Tạo nội dung marketing      │   │  ║
║  │  └─────────────────────────────────────────────────────────────┘   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                    │                                      ║
║                                    ▼                                      ║
║  ┌─────────────────────────────────────────────────────────────────────┐  ║
║  │                      DATA LAYER                                     │  ║
║  │  ┌─────────────────────────────────────────────────────────────┐   │  ║
║  │  │                 SUPABASE (PostgreSQL)                       │   │  ║
║  │  │  Tables: users, gardens, flowers, orders, check_ins, ...   │   │  ║
║  │  │  Features: RLS, Real-time, Edge Functions                   │   │  ║
║  │  └─────────────────────────────────────────────────────────────┘   │  ║
║  └─────────────────────────────────────────────────────────────────────┘  ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Data Flow Diagram

```
USER REQUEST
     │
     ▼
┌─────────────┐
│  Next.js    │ ──────────────────────────────────┐
│  Frontend   │                                    │
└─────────────┘                                    │
     │                                             │
     ▼                                             ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  API Route  │ ──▶ │ MasterAgent │ ──▶ │   Gemini    │
│  Handler    │     │    (CEO)    │     │     AI      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Specialized Agents   │
              │  (11-Story, 13-Sales)  │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │       Supabase         │
              │    (Data Storage)      │
              └────────────────────────┘
```

---

## 🤖 Agentic OS Engine

### Overview

Agentic OS Engine là trái tim của hệ thống AGRIOS, cung cấp khả năng điều phối AI đa tác vụ theo mô hình tổ chức doanh nghiệp (CEO → Departments → Agents).

### Core Classes

#### 1. MasterAgent (CEO)

**Location**: `bizplan-cli-toolkit/src/orchestrator/master-agent.ts`

```typescript
/**
 * CEO (Agent 21) - Master Orchestrator
 * Receives strategic directives from Chairman's Assistant
 * Delegates to department heads and consolidates reports
 */
export class MasterAgent {
    
    /**
     * Orchestrate workflow across departments
     * @param input - Strategic directive from Chairman
     * @returns Consolidated CEO report
     */
    async orchestrate(input: MasterInput): Promise<CEOReport>;
    
    /**
     * Determine which departments to activate
     * @param input - Strategic directive
     * @returns Array of department names
     */
    private determineDepartments(input: MasterInput): string[];
    
    /**
     * Delegate task to specific department
     * @param dept - Department name
     * @param directive - Task directive
     * @returns Department report
     */
    private delegateToDepartment(dept: string, directive: MasterInput): Promise<DeptReport>;
    
    /**
     * Execute Marketing Department workflow
     */
    private executeMarketingDept(directive: MasterInput): Promise<MarketingReport>;
    
    /**
     * Execute Sales Department workflow
     */
    private executeSalesDept(directive: MasterInput): Promise<SalesReport>;
}
```

#### 2. Agent Protocol

**Location**: `bizplan-cli-toolkit/src/protocol/agent-protocol.ts`

Defines standard communication protocol between agents:
- Input/Output format
- Error handling
- Metadata structure

#### 3. Base Agent

**Location**: `bizplan-cli-toolkit/src/agents/base-agent.ts`

Abstract class that all 24 agents inherit from:
- `execute()` - Main execution method
- `validate()` - Input validation
- `format()` - Output formatting

### Agent Registry

| ID | Name | Department | Function |
|----|------|------------|----------|
| 02 | Mapping Agent | Strategy | Architecture mapping |
| 03 | IPO Agent | Finance | IPO readiness |
| 04 | Gap Agent | Strategy | Gap analysis |
| 05 | BizModel Agent | Finance | Business model |
| 06 | Psychology Agent | Marketing | Customer psychology |
| 11 | Storytelling Agent | Marketing | Content creation |
| 13 | Sales Agent | Sales | Sales process |
| 16 | Fundraising Agent | Finance | VC narrative |
| 21 | OKR Agent | Operations | Execution tracking |
| ... | ... | ... | ... |

---

## 🌻 Garden OS Framework

### Overview

Garden OS Framework cung cấp các công cụ chuyên biệt cho việc quản lý và tối ưu hóa vườn hoa.

### Core Modules

#### 1. Yield Predictor

**Location**: `lib/agents/yield-predictor.ts`

```typescript
/**
 * AI-powered demand forecasting and dynamic pricing
 * for Sa Đéc flowers based on supply/demand signals
 */
export class YieldPredictor {
    
    /**
     * Analyze demand signals from user behavior
     * Sources: Check-ins, page views, orders, searches
     * @returns Array of demand signals by flower type
     */
    async senseDemand(): Promise<DemandSignal[]>;
    
    /**
     * Aggregate supply data from all gardens
     * @returns Array of supply data by flower type
     */
    async analyzeSupply(): Promise<SupplyData[]>;
    
    /**
     * Forecast demand for upcoming period (especially Tet)
     * Uses historical + seasonal factors
     * @returns Demand forecast with trend analysis
     */
    async forecastDemand(): Promise<DemandForecast[]>;
    
    /**
     * Generate pricing recommendations based on supply/demand
     * @returns Pricing recommendations with confidence scores
     */
    async generatePricingRecommendations(): Promise<PricingRecommendation[]>;
    
    /**
     * Identify candidates for "Giải cứu hoa" flash sales
     * Detects oversupply situations
     * @returns Flash sale candidates with discount suggestions
     */
    async generateFlashSales(): Promise<FlashSaleCandidate[]>;
    
    /**
     * Run full yield prediction analysis
     * Combines all methods for comprehensive report
     */
    async runAnalysis(): Promise<YieldReport>;
}
```

#### 2. Content Generator

**Location**: `lib/agents/content-generator.ts`

Generates marketing content for multiple channels.

#### 3. TikTok Viral Agent

**Location**: `lib/agents/tiktok-viral.ts`

Creates viral TikTok content strategies.

#### 4. SEO Blog Agent

**Location**: `lib/agents/seo-blog.ts`

Generates SEO-optimized blog content.

---

## 🧠 AI/ML Services

### Gemini Service

**Location**: `lib/gemini-service.ts`

```typescript
export const GeminiService = {
    /**
     * Generate text from prompt
     * @param prompt - Input prompt
     * @returns Generated text
     */
    generateText: async (prompt: string): Promise<string>;
    
    /**
     * Generate content from image
     * @param imageBase64 - Base64 encoded image
     * @param mimeType - Image MIME type
     * @param prompt - Analysis prompt
     * @returns Generated analysis
     */
    generateFromImage: async ({imageBase64, mimeType, prompt}): Promise<string>;
    
    /**
     * Generate marketing content
     * @param topic - Content topic
     * @param persona - Target persona
     * @param goal - Marketing goal
     * @returns Marketing content
     */
    generateMarketingContent: async ({topic, persona, goal, context}): Promise<string>;
};
```

### Retry Mechanism

Implements robust retry with exponential backoff:
- 3 retry attempts
- 30s timeout per request
- Automatic handling of network errors

---

## 💾 Database Schema

### Supabase Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts | id, email, role |
| `gardens` | Flower gardens | id, name, owner_id, location |
| `flowers` | Flower types | id, name, price, garden_id |
| `orders` | Customer orders | id, user_id, total, status |
| `check_ins` | Garden check-ins | id, user_id, garden_id |
| `missions` | Gamification missions | id, title, reward |

### Row Level Security (RLS)

All tables implement RLS policies for data isolation and security.

---

## 📚 API Reference

### Agent Execution

```typescript
// Execute MasterAgent
const master = new MasterAgent();
const result = await master.orchestrate({
    type: 'marketing',
    workflowPreset: 'gtm',
    data: {...}
});
```

### Yield Prediction

```typescript
// Run yield analysis
const predictor = new YieldPredictor();
const analysis = await predictor.runAnalysis();
```

### Gemini AI

```typescript
// Generate content
const content = await GeminiService.generateText("Your prompt here");
```

---

## 📄 License & Copyright

**© 2024 Minh Long. All Rights Reserved.**

This software and associated documentation files (the "Software") are proprietary and confidential. Unauthorized copying, modification, distribution, or use of this Software, via any medium, is strictly prohibited without the express written permission of the copyright holder.

---

*Documentation Version 1.0 - Generated for SHTT Registration*
