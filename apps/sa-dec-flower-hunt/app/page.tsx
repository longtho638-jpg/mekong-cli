import { getMarketingConfig } from "@/lib/marketing";
import LandingPageClient from "@/components/landing/LandingPageClient";

export const revalidate = 60; // Revalidate every 60 seconds (Simulate ISR for CMS)

export default function HomePage() {
    const config = getMarketingConfig();

    return <LandingPageClient />;
}
