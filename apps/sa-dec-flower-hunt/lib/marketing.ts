import fs from 'fs';
import path from 'path';

export interface MarketingConfig {
    landing_headline: string;
    banner_text: string;
    is_campaign_active: boolean;
}

const CONFIG_PATH = path.join(process.cwd(), 'marketing_config.json');

export function getMarketingConfig(): MarketingConfig {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(fileContents);
        }
    } catch (error) {
        console.error("Error reading marketing config:", error);
    }

    // Default Fallback
    return {
        landing_headline: "HYPERNATURE",
        banner_text: "Săn hoa ảo, nhận quà thật Tết 2026!",
        is_campaign_active: true
    };
}
