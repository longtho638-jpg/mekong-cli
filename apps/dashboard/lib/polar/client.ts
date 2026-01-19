 
import { Polar } from '@polar-sh/sdk'

// Initialize Polar client
export const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
})

// Sandbox client for testing
export const polarSandbox = new Polar({
    accessToken: process.env.POLAR_SANDBOX_ACCESS_TOKEN,
    server: 'sandbox',
})

// Use sandbox in development
export const polarClient = process.env.NODE_ENV === 'production' ? polar : polarSandbox

// Product IDs (set these from Polar dashboard)
export const PRODUCTS = {
    STARTER: process.env.POLAR_PRODUCT_STARTER || 'starter-product-id',
    PRO: process.env.POLAR_PRODUCT_PRO || 'pro-product-id',
    AGENCY: process.env.POLAR_PRODUCT_AGENCY || 'agency-product-id',
    FRANCHISE: process.env.POLAR_PRODUCT_FRANCHISE || 'franchise-product-id',
}

// Pricing tiers
export const PRICING_TIERS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        description: 'Get started with basic features',
        features: [
            '5 dashboards',
            '1 client',
            'Community support',
            'Basic analytics',
        ],
        cta: 'Get Started',
        popular: false,
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 99,
        period: 'month',
        description: 'Perfect for solo agencies',
        features: [
            '20 dashboards',
            '5 clients',
            'Email support',
            'Client Portal',
            'Invoice generation',
            'Basic reports',
        ],
        cta: 'Start Free Trial',
        popular: false,
        productId: PRODUCTS.STARTER,
    },
    {
        id: 'pro',
        name: 'Professional',
        price: 299,
        period: 'month',
        description: 'For growing agencies',
        features: [
            'All dashboards',
            '20 clients',
            'Priority support',
            'White-label reports',
            'API access',
            'Advanced analytics',
            'Team collaboration',
        ],
        cta: 'Start Free Trial',
        popular: true,
        productId: PRODUCTS.PRO,
    },
    {
        id: 'agency',
        name: 'Agency',
        price: 499,
        period: 'month',
        description: 'For established agencies',
        features: [
            'Everything in Pro',
            'Unlimited clients',
            'White-label platform',
            'Custom domain',
            'Dedicated support',
            'SLA guarantee',
            'Custom integrations',
        ],
        cta: 'Contact Sales',
        popular: false,
        productId: PRODUCTS.AGENCY,
    },
]
