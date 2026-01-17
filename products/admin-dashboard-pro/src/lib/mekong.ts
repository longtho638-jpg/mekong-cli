import fs from "fs";
import path from "path";
import os from "os";

// Types
export interface Lead {
  name: string;
  email: string;
  company: string;
  stage: "new" | "contacted" | "replied" | "meeting" | "closed";
  added: string;
}

export interface SocialItem {
  date: string;
  theme: string;
  content: string;
  status: "queued" | "posted";
}

export interface SalesItem {
  date: string;
  product: string;
  price: number;
  email: string;
}

export interface DashboardData {
  revenue: number;
  leads_count: number;
  queue_count: number;
  recent_sales: SalesItem[];
  leads: Lead[];
  queue: SocialItem[];
}

// Config Path
const MEKONG_DIR = path.join(os.homedir(), ".mekong");

export async function getDashboardData(): Promise<DashboardData> {
  // Use mock data if not running locally or dir missing
  if (!fs.existsSync(MEKONG_DIR)) {
    return getMockData();
  }

  const leads = readJson<Lead[]>("leads.json") || [];
  const queue = readJson<SocialItem[]>("social_queue.json") || [];
  const sales = readSalesLog() || [];

  const revenue = sales.reduce((sum, item) => sum + item.price, 0);

  return {
    revenue,
    leads_count: leads.length,
    queue_count: queue.filter((q) => q.status === "queued").length,
    recent_sales: sales.reverse().slice(0, 5),
    leads: leads.slice(-5).reverse(), // Recent leads
    queue: queue.filter((q) => q.status === "queued").slice(0, 5),
  };
}

function readJson<T>(filename: string): T | null {
  try {
    const filePath = path.join(MEKONG_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error reading ${filename}`, e);
    return null;
  }
}

function readSalesLog(): SalesItem[] {
  try {
    const filePath = path.join(MEKONG_DIR, "sales.log");
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");

    return lines
      .map((line) => {
        const [date, product, price, email] = line.split("|");
        return {
          date,
          product,
          price: parseFloat(price) || 0,
          email,
        };
      })
      .filter((item) => item.product); // Filter empty
  } catch (e) {
    return [];
  }
}

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
        date: "2026-01-18",
        theme: "Strategy Sunday",
        content: "Focus on one thing.",
        status: "queued",
      },
      {
        date: "2026-01-19",
        theme: "Motivation Monday",
        content: "Build systems.",
        status: "queued",
      },
    ],
  };
}
