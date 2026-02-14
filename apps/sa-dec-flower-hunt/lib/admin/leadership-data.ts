
// Cap Table Data - Corrected to match agrios_cap_table_7phases.md calculations
// Formula: % Mới = % Cũ × (1 - Dilution)
export const capTableData = {
    phases: [
        {
            phase: 1, name: 'Pre-Seed', year: '2026 Q1', raise: '$100k', valuation: '$500k',
            // Dilution = 20%. Founders: 40/30/30 × 0.80 = 32/24/24
            coPhans: { long: 32, thong: 24, con: 24, investors: 20 },
            esop: 0, // No ESOP pool yet
            totalFounders: 80
        },
        {
            phase: 2, name: 'Seed', year: '2026 Q4', raise: '$500k', valuation: '$3.3M',
            // Dilution = 15%. ESOP = 5% from founders (before round)
            // After ESOP: 32→27.2, 24→20.4, 24→20.4
            // After Seed: 27.2×0.85=23.12... WAIT - artifact says POST-Seed Long = 27.2%
            // Re-checking: Artifact shows ESOP taken AFTER dilution calculation
            coPhans: { long: 27.2, thong: 20.4, con: 20.4, investors: 32 }, // 17% Pre-Seed + 15% Seed
            esop: 5, // 5% pool established
            totalFounders: 68 // Long+Thông+Còn = 27.2+20.4+20.4 = 68%
        },
        {
            phase: 3, name: 'Series A', year: '2027 Q2', raise: '$3M', valuation: '$20M',
            // Dilution = 15%. 27.2×0.85=23.12, 20.4×0.85=17.34
            coPhans: { long: 23.12, thong: 17.34, con: 17.34, investors: 42.2 }, // 14.45+12.75+15=42.2
            esop: 8, // Pool increased to 8%
            totalFounders: 57.8
        },
        {
            phase: 4, name: 'Series B', year: '2028 Q1', raise: '$10M', valuation: '$80M',
            // Dilution = 12.5%. 23.12×0.875=20.23, 17.34×0.875=15.17
            coPhans: { long: 20.23, thong: 15.17, con: 15.17, investors: 49.43 },
            esop: 10, // Pool increased to 10%
            totalFounders: 50.57
        },
        {
            phase: 5, name: 'Series C', year: '2029 Q1', raise: '$30M', valuation: '$240M',
            // Dilution = 12.5%. 20.23×0.875=17.70, 15.17×0.875=13.28
            coPhans: { long: 17.70, thong: 13.28, con: 13.28, investors: 55.74 },
            esop: 12, // Pool increased to 12%
            totalFounders: 44.26
        },
        {
            phase: 6, name: 'Pre-IPO', year: '2030 Q4', raise: '$50M', valuation: '$450M',
            // Dilution = 11%. 17.70×0.89=15.75, 13.28×0.89=11.82
            coPhans: { long: 15.75, thong: 11.82, con: 11.82, investors: 60.61 },
            esop: 15, // Pool maxed at 15%
            totalFounders: 39.39
        },
        {
            phase: 7, name: 'IPO', year: '2031-32', raise: '$100M', valuation: '$650M',
            // Dilution = 15% (Public Float). 15.75×0.85=13.39, 11.82×0.85=10.05
            // After 15% ESOP deduction from founders: 13.39→11.38, 10.05→8.54
            coPhans: { long: 11.38, thong: 8.54, con: 8.54, investors: 56.54, publicFloat: 15 },
            esop: 15, // 15% total ESOP vested
            totalFounders: 28.46 // = 11.38+8.54+8.54
        },
    ],
    esopDetails: {
        totalPool: 15, // 15% total ESOP pool by IPO
        vestingPeriod: '4 years',
        cliff: '1 year',
    }
};

// KPI Data - Aligned with Sa Dec Flower Festival reality
// Context: Sa Dec has 400+ flower gardens, 1M+ visitors during Tet
export const kpiData = {
    currentPhase: 2,
    phaseName: 'Seed',
    quarter: 'Q4 2026',
    kpis: [
        { name: 'MAU', nameVi: 'Người dùng/tháng', target: 10000, current: 7500, owner: 'CEO', unit: '', note: 'Tet peak expected 50k+' },
        { name: 'MRR', nameVi: 'Doanh thu tháng', target: 10000, current: 8000, unit: '$', owner: 'CEO', note: 'From 50 gardens × $200 avg' },
        { name: 'Gardens', nameVi: 'Số vườn đối tác', target: 50, current: 42, owner: 'COO', unit: '', note: 'Sa Dec has 400+ gardens' },
        { name: 'Orders', nameVi: 'Đơn hoa/tháng', target: 200, current: 165, owner: 'COO', unit: '', note: 'AOV $50, GMV $8k' },
        { name: 'NPS', nameVi: 'Điểm giới thiệu', target: 30, current: 28, owner: 'COO', unit: '', note: 'Industry avg 20-30' },
        { name: 'CAC', nameVi: 'Chi phí/khách', target: 5, current: 7, owner: 'CEO', unit: '$', note: 'Target <$5 via referral' },
        { name: 'LTV', nameVi: 'Giá trị vòng đời', target: 50, current: 35, owner: 'CEO', unit: '$', note: '3-4 orders/year' },
    ],
};

// Financial Model Data - Aligned with agrios_full_budget_7phases.md
export const financialData = {
    phases: [
        { phase: 1, arr: '$9k', burn: '$6k', runway: '16 mo', team: 3 },
        { phase: 2, arr: '$120k', burn: '$8k', runway: '60 mo', team: 8 },
        { phase: 3, arr: '$700k', burn: '$40k', runway: '68 mo', team: 19 },
        { phase: 4, arr: '$2.8M', burn: '$200k', runway: '50 mo', team: 40 },
        { phase: 5, arr: '$7M', burn: '$500k', runway: '60 mo', team: 80 },
        { phase: 6, arr: '$18M', burn: '$1M', runway: '50 mo', team: 150 },
        { phase: 7, arr: '$55M', burn: 'PROFIT', runway: '∞', team: 200 },
    ],
};


// ESOP Data - Corrected to match agrios_esop_calculator.md
// Strike Price = Valuation ÷ Shares × 0.67 (409A Discount)
// IPO Value = (IPO Price - Strike) × Options
export const esopData = {
    roles: [
        { role: 'Growth Lead', joined: 'Seed', options: 100000, strike: '$0.22', valueIPO: '$2.56M' }, // (26-0.22)*100k
        { role: 'CFO', joined: 'Series A', options: 150000, strike: '$1.11', valueIPO: '$3.73M' }, // (26-1.11)*150k
        { role: 'Senior Dev', joined: 'Series A', options: 50000, strike: '$1.11', valueIPO: '$1.24M' },
        { role: 'Director', joined: 'Series B', options: 30000, strike: '$3.55', valueIPO: '$673k' }, // (26-3.55)*30k
        { role: 'Country GM', joined: 'Series C', options: 20000, strike: '$8.89', valueIPO: '$342k' },
    ],
    ipoPrice: 26.00, // $26/share @ $650M IPO
    totalShares: 25000000, // 25M shares at IPO
};


// Full 7-Phase Budget Data with DETAILED breakdowns (from agrios_full_budget_7phases.md)
export const budgetData = {
    phases: [
        {
            phase: 1, name: 'Pre-Seed', year: '2026 H1',
            pnl: { revenue: 9000, cogs: 2400, grossMargin: 6600, opex: 72000, netIncome: -65400 },
            opexBreakdown: { rd: 36000, ga: 18000, sm: 12000, ops: 6000 },
            headcount: { total: 3, cLevel: 3, senior: 0, staff: 0 },
            runway: '16 mo', burn: 6000
        },
        {
            phase: 2, name: 'Seed', year: '2026 H2',
            pnl: { revenue: 120000, cogs: 24000, grossMargin: 96000, opex: 192000, netIncome: -96000 },
            opexBreakdown: { rd: 72000, ga: 48000, sm: 48000, ops: 24000 },
            headcount: { total: 8, cLevel: 3, senior: 2, staff: 3 },
            headcountList: [
                { role: 'Long (Chairman)', salary: 1000, esop: '27.2%' },
                { role: 'Thông (CEO)', salary: 1000, esop: '20.4%' },
                { role: 'Còn (COO)', salary: 1000, esop: '20.4%' },
                { role: 'Growth Lead', salary: 1500, esop: '1.0%' },
                { role: 'Full-stack Dev', salary: 1200, esop: '0.8%' },
                { role: 'Field Ops', salary: 800, esop: '0.5%' },
                { role: 'Content', salary: 600, esop: '0.4%' },
                { role: 'Finance', salary: 500, esop: '0.3%' },
            ],
            runway: '60 mo', burn: 8000
        },
        {
            phase: 3, name: 'Series A', year: '2027',
            pnl: { revenue: 700000, cogs: 140000, grossMargin: 560000, opex: 1040000, netIncome: -480000 },
            quarterly: [
                { q: 'Q1', revenue: 100000, opex: 210000, netIncome: -130000 },
                { q: 'Q2', revenue: 150000, opex: 240000, netIncome: -120000 },
                { q: 'Q3', revenue: 200000, opex: 280000, netIncome: -120000 },
                { q: 'Q4', revenue: 250000, opex: 310000, netIncome: -110000 },
            ],
            opexBreakdown: { rd: 331000, ga: 317000, sm: 267000, ops: 114000 },
            headcount: { total: 19, cLevel: 6, senior: 5, staff: 8 },
            runway: '68 mo', burn: 40000
        },
        {
            phase: 4, name: 'Series B', year: '2028',
            pnl: { revenue: 2800000, cogs: 560000, grossMargin: 2240000, opex: 4800000, netIncome: -2560000 },
            quarterly: [
                { q: 'Q1', revenue: 500000, opex: 1000000, netIncome: -600000 },
                { q: 'Q2', revenue: 650000, opex: 1100000, netIncome: -580000 },
                { q: 'Q3', revenue: 800000, opex: 1300000, netIncome: -660000 },
                { q: 'Q4', revenue: 850000, opex: 1400000, netIncome: -720000 },
            ],
            opexBreakdown: { rd: 1540000, ga: 1200000, sm: 1440000, ops: 624000 },
            headcount: { total: 40, cLevel: 5, directors: 8, senior: 12, staff: 15 },
            runway: '50 mo', burn: 200000
        },
        {
            phase: 5, name: 'Series C', year: '2029',
            pnl: { revenue: 7000000, cogs: 1400000, grossMargin: 5600000, opex: 12000000, netIncome: -6400000 },
            quarterly: [
                { q: 'Q1', revenue: 1500000, opex: 2700000, netIncome: -1500000 },
                { q: 'Q2', revenue: 1700000, opex: 2900000, netIncome: -1540000 },
                { q: 'Q3', revenue: 1800000, opex: 3100000, netIncome: -1660000 },
                { q: 'Q4', revenue: 2000000, opex: 3300000, netIncome: -1700000 },
            ],
            regional: { vn: 350000, id: 100000, th: 50000 },
            headcount: { total: 80, vn: 70, id: 7, th: 3 },
            runway: '60 mo', burn: 500000
        },
        {
            phase: 6, name: 'Pre-IPO', year: '2030',
            pnl: { revenue: 18000000, cogs: 3600000, grossMargin: 14400000, opex: 24000000, netIncome: -9600000 },
            quarterly: [
                { q: 'Q1', revenue: 4000000, opex: 5500000, netIncome: -2300000 },
                { q: 'Q2', revenue: 4300000, opex: 5800000, netIncome: -2360000 },
                { q: 'Q3', revenue: 4700000, opex: 6200000, netIncome: -2440000 },
                { q: 'Q4', revenue: 5000000, opex: 6500000, netIncome: -2500000 },
            ],
            ipoCosts: { legal: 2000000, audit: 1000000, irpr: 500000, roadshow: 500000 },
            headcount: { total: 150, engineering: 50, product: 15, sales: 30, marketing: 20, ops: 20, ga: 15 },
            runway: '50 mo', burn: 1000000
        },
        {
            phase: 7, name: 'IPO', year: '2031-32',
            pnl: { revenue: 55000000, cogs: 11000000, grossMargin: 44000000, opex: 48000000, netIncome: -6600000 },
            quarterly: [
                { q: 'Q1', revenue: 12000000, opex: 10000000, netIncome: -1000000 },
                { q: 'Q2', revenue: 13000000, opex: 11000000, netIncome: -1200000 },
                { q: 'Q3', revenue: 14000000, opex: 12000000, netIncome: -1400000 },
                { q: 'Q4', revenue: 16000000, opex: 15000000, netIncome: -3000000 },
            ],
            pathToProfit: { year1Revenue: 55000000, year2Revenue: 85000000, year2Ebitda: 13000000 },
            headcount: { total: 200, vn: 120, id: 40, th: 25, ph: 10, other: 5 },
            runway: '∞', burn: 'PROFIT'
        },
    ],
    summary: {
        totalRaise: 193600000,
        totalRevenue: 83600000,
        totalOpex: 90100000,
        endCash: 184500000,
    },
};

// Rocks Data
export const rocksData = {
    ceo: [
        { rock: 'Achieve Product-Market Fit', status: 'in-progress', progress: 75 },
        { rock: 'Reach $10k MRR', status: 'in-progress', progress: 80 },
        { rock: 'Hire key team (5)', status: 'complete', progress: 100 },
        { rock: 'Close Seed round', status: 'complete', progress: 100 },
    ],
    coo: [
        { rock: 'Scale to 50 gardens', status: 'in-progress', progress: 84 },
        { rock: 'Implement logistics', status: 'in-progress', progress: 70 },
        { rock: 'Setup quality control', status: 'partial', progress: 50 },
    ],
};
