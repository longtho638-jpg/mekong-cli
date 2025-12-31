import { Polar } from '@polar-sh/sdk'

// Initialize Polar client
export const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
})

// Product IDs from Polar Dashboard (set these after creating products)
export const POLAR_PRODUCTS = {
    starter: process.env.POLAR_PRODUCT_STARTER || 'prod_starter',
    pro: process.env.POLAR_PRODUCT_PRO || 'prod_pro',
    agency: process.env.POLAR_PRODUCT_AGENCY || 'prod_agency',
}

// Price IDs
export const POLAR_PRICES = {
    starter_monthly: process.env.POLAR_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    starter_yearly: process.env.POLAR_PRICE_STARTER_YEARLY || 'price_starter_yearly',
    pro_monthly: process.env.POLAR_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    pro_yearly: process.env.POLAR_PRICE_PRO_YEARLY || 'price_pro_yearly',
    agency_monthly: process.env.POLAR_PRICE_AGENCY_MONTHLY || 'price_agency_monthly',
    agency_yearly: process.env.POLAR_PRICE_AGENCY_YEARLY || 'price_agency_yearly',
}

// Plan limits
export const PLAN_LIMITS = {
    free: {
        newsletters: 1,
        subscribers: 500,
        emails_per_month: 1000,
        ai_credits: 10,
        team_members: 1,
    },
    starter: {
        newsletters: 3,
        subscribers: 2500,
        emails_per_month: 10000,
        ai_credits: 100,
        team_members: 2,
    },
    pro: {
        newsletters: 10,
        subscribers: 10000,
        emails_per_month: 50000,
        ai_credits: 500,
        team_members: 5,
    },
    agency: {
        newsletters: -1, // unlimited
        subscribers: -1,
        emails_per_month: -1,
        ai_credits: -1,
        team_members: -1,
    },
}
