import { Translations } from './i18n';

// Registry of translation keys used per page for optimization
// This allows strict typing and pre-fetching of translations
export const pageTextKeys: Record<string, string[]> = {
    // Public Pages
    landing: [
        "landing.hero.tagline1", "landing.hero.tagline2", "landing.hero.tagline3",
        "landing.cta.hunter", "landing.cta.partner",
        "landing.ticker.nodes", "landing.ticker.flowers", "landing.ticker.marketcap",
        "landing.ecosystem.title", "landing.ecosystem.desc"
    ],
    festival: [
        "festival.title", "festival.hero.sadec", "festival.hero.subtitle",
        "festival.header.os", "festival.header.tet", "festival.footer.powered"
    ],
    shop: [
        "shop.title", "shop.ticker.rose", "shop.ticker.lotus", "shop.ticker.fertilizer",
        "shop.ticker.orchid", "shop.search", "shop.filter.all", "shop.filter.premium"
    ],
    partner: [
        "partner.back", "partner.status", "partner.badge", "partner.title.prefix",
        "partner.title.highlight", "partner.title.suffix", "partner.desc",
        "partner.cta.access", "partner.cta.contact",
        "partner.feature.twin.title", "partner.feature.twin.desc",
        "partner.feature.yield.title", "partner.feature.yield.desc",
        "partner.feature.market.title", "partner.feature.market.desc",
        "partner.security.title", "partner.security.1", "partner.security.2",
        "partner.security.3", "partner.security.4", "partner.security.encrypted"
    ],
    contact: [
        "contact.back", "contact.title", "contact.desc",
        "contact.hq.title", "contact.hq.addr",
        "contact.email.title",
        "contact.hotline.title",
        "contact.hours.title", "contact.hours.time",
        "contact.visit.title", "contact.visit.desc", "contact.visit.cta",
        "contact.form.title", "contact.form.name", "contact.form.email",
        "contact.form.subject", "contact.form.message", "contact.form.send",
        "contact.form.placeholder.name", "contact.form.placeholder.email",
        "contact.form.placeholder.msg"
    ],
    // Batch 2: Public & Legal
    shop_fmcg: [
        "shop.fmcg.badge", "shop.fmcg.title", "shop.fmcg.subtitle",
        "shop.fmcg.filter.all", "shop.fmcg.filter.skincare", "shop.fmcg.filter.tea",
        "shop.fmcg.filter.decor", "shop.fmcg.filter.gift",
        "shop.fmcg.sort.popular", "shop.fmcg.sort.price_low",
        "shop.fmcg.sort.price_high", "shop.fmcg.sort.rating",
        "shop.fmcg.banner.title", "shop.fmcg.banner.subtitle", "shop.fmcg.banner.cta",
        "shop.fmcg.products.count"
    ],
    payment_policy: [
        "policy.back", "policy.updated", "policy.pay.title",
        "policy.pay.card1.title", "policy.pay.card1.desc",
        "policy.pay.card2.title", "policy.pay.card2.desc",
        "policy.pay.card3.title", "policy.pay.card3.desc",
        "policy.pay.sec1.title", "policy.pay.sec1.desc",
        "policy.pay.sec2.title", "policy.pay.sec2.desc",
        "policy.pay.sec3.title", "policy.pay.sec3.warning",
        "policy.pay.sec4.title", "policy.pay.sec4.desc",
        "policy.pay.sec5.title", "policy.pay.sec5.desc",
        "policy.pay.footer"
    ],
    privacy: [
        "privacy.back", "privacy.title", "privacy.updated",
        "privacy.sec1.title", "privacy.sec1.desc",
        "privacy.sec2.title", "privacy.sec2.desc",
        "privacy.sec3.title", "privacy.sec3.desc",
        "privacy.sec4.title", "privacy.sec4.desc",
        "privacy.sec5.title", "privacy.sec5.desc",
        "privacy.sec6.title", "privacy.sec6.desc",
        "privacy.sec7.title", "privacy.sec7.desc"
    ],
    terms: [
        "terms.back", "terms.title", "terms.updated",
        "terms.sec1.title", "terms.sec1.desc",
        "terms.sec2.title", "terms.sec2.desc",
        "terms.sec3.title", "terms.sec3.desc",
        "terms.sec4.title", "terms.sec4.desc",
        "terms.sec5.title", "terms.sec5.desc",
        "terms.sec6.title", "terms.sec6.desc",
        "terms.sec7.title", "terms.sec7.desc",
        "terms.sec8.title", "terms.sec8.desc"
    ],
    hunt: [
        "hunt.title", "hunt.gps.locked", "hunt.gps.searching",
        "hunt.stats.loot", "hunt.stats.epic", "hunt.stats.zones", "hunt.stats.nodes",
        "hunt.headings.anomalies", "hunt.headings.hotspots", "hunt.headings.all_targets",
        "hunt.status.scanning", "hunt.action.warp"
    ],
    about: [
        "about.back", "about.hero.title_prefix", "about.hero.subtitle", "about.hero.desc",
        "about.stats.partners", "about.stats.capital", "about.stats.hours", "about.stats.vsic",
        "about.vision.title", "about.vision.desc", "about.mission.title", "about.mission.desc",
        "about.legal.title", "about.legal.desc",
        "about.vsic.6201", "about.vsic.6311", "about.vsic.6202", "about.vsic.6312",
        "about.vsic.4791", "about.vsic.5229", "about.vsic.4620", "about.vsic.4632",
        "about.vsic.4649", "about.vsic.6619", "about.vsic.7990", "about.vsic.7310",
        "about.tax.title", "about.tax.desc",
        "about.info.title", "about.info.name_label", "about.info.name_value",
        "about.info.eng_label", "about.info.eng_value",
        "about.info.type_label", "about.info.type_value",
        "about.info.cap_label", "about.info.cap_value",
        "about.info.tax_label", "about.info.tax_value",
        "about.contact.title", "about.contact.hq_label", "about.contact.hq_value",
        "about.contact.hotline_label", "about.contact.email_label", "about.contact.partner_btn",
        "about.cta.title", "about.cta.desc", "about.cta.investor_btn", "about.cta.blog_btn"
    ],
    offline: [
        "offline.title", "offline.desc", "offline.tip_title", "offline.tip_desc",
        "offline.retry_btn", "offline.back_btn", "offline.footer"
    ],
    not_found: [
        "not_found.title", "not_found.heading", "not_found.desc", "not_found.home_btn", "not_found.search_btn"
    ]
    // Auto-generated keys will be added here by the extraction script
};

// Helper to extract specific keys for a page from the main translation object
export function getPageTexts(pageKey: string, t: (key: string) => string) {
    const keys = pageTextKeys[pageKey] || [];
    const texts: Record<string, string> = {};

    keys.forEach(key => {
        // Use the last part of the key as the prop name (e.g., 'landing.title' -> 'title')
        // Or keep full key if preferred. Let's use simplified keys for cleaner props.
        const shortKey = key.split('.').pop() || key;
        texts[shortKey] = t(key);
    });

    return texts;
}
