/**
 * 📊 Dashboard API Client
 * =======================
 *
 * Fetches data from the /api/dashboard endpoints.
 * Supports both local development and production API.
 */

// Types
export interface Lead {
  name: string;
  email: string;
  company: string;
  stage: "new" | "contacted" | "replied" | "meeting" | "closed";
  added: string | null;
}

export interface SocialItem {
  id: string;
  date: string;
  theme: string;
  content?: string;
  product: string;
  status: "queued" | "posted";
}

export interface SalesItem {
  date: string;
  product: string;
  price: number;
  email: string;
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  pending_invoices: number;
  paid_invoices: number;
  goal: number;
  progress_percent: number;
}

export interface LeadsStats {
  total: number;
  stages: Record<string, number>;
  conversion_rate: number;
}

export interface DashboardData {
  revenue: number;
  leads_count: number;
  queue_count: number;
  recent_sales: SalesItem[];
  leads: Lead[];
  queue: SocialItem[];
}

// API Base URL - auto-detect environment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch dashboard summary from API
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    // Try API first
    const response = await fetch(`${API_BASE}/api/dashboard/summary`, {
      next: { revalidate: 0 }, // No cache
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Fetch additional data in parallel
      const [leadsRes, salesRes, queueRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/leads`),
        fetch(`${API_BASE}/api/dashboard/sales`),
        fetch(`${API_BASE}/api/dashboard/queue`),
      ]);

      const leads = leadsRes.ok ? await leadsRes.json() : [];
      const sales = salesRes.ok ? await salesRes.json() : [];
      const queue = queueRes.ok ? await queueRes.json() : [];

      return {
        revenue: data.revenue?.paid_invoices || 0,
        leads_count: data.leads?.total || 0,
        queue_count: data.queued_content || 0,
        recent_sales: sales.slice(0, 5),
        leads: leads.slice(0, 5),
        queue: queue.slice(0, 5).map((q: SocialItem) => ({
          ...q,
          content: q.theme, // Map theme to content for UI
        })),
      };
    }
  } catch (error) {
    console.warn("API unavailable, using fallback:", error);
  }

  // Fallback to mock data
  return getMockData();
}

/**
 * Fetch revenue metrics
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/revenue`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Revenue API unavailable:", error);
  }

  return {
    mrr: 0,
    arr: 0,
    pending_invoices: 0,
    paid_invoices: 0,
    goal: 200000,
    progress_percent: 0,
  };
}

/**
 * Fetch leads statistics
 */
export async function getLeadsStats(): Promise<LeadsStats> {
  try {
    const response = await fetch(`${API_BASE}/api/dashboard/leads/stats`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn("Leads API unavailable:", error);
  }

  return {
    total: 0,
    stages: {},
    conversion_rate: 0,
  };
}

/**
 * Mock data for demo/offline mode
 */
function getMockData(): DashboardData {
  return {
    revenue: 12500,
    leads_count: 12,
    queue_count: 5,
    recent_sales: [
      {
        date: "2026-01-16",
        product: "AgencyOS Pro",
        price: 197,
        email: "demo@example.com",
      },
      {
        date: "2026-01-15",
        product: "AI Skills Pack",
        price: 27,
        email: "test@user.com",
      },
    ],
    leads: [
      {
        name: "John Doe",
        email: "john@corp.com",
        company: "Corp Inc",
        stage: "new",
        added: "2026-01-17",
      },
      {
        name: "Jane Smith",
        email: "jane@agency.com",
        company: "Agency XYZ",
        stage: "contacted",
        added: "2026-01-16",
      },
    ],
    queue: [
      {
        id: "q1",
        date: "2026-01-18",
        theme: "Strategy Sunday",
        product: "agencyos",
        status: "queued",
      },
      {
        id: "q2",
        date: "2026-01-19",
        theme: "Motivation Monday",
        product: "agencyos",
        status: "queued",
      },
    ],
  };
}
