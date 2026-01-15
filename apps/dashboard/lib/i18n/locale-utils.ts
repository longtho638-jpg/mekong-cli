/**
 * Locale Utilities for SEA Markets
 * Date, time, number, and currency formatting
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 SUPPORTED LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

export type SupportedLocale = 'en' | 'vi' | 'th' | 'id' | 'tl';

export interface LocaleConfig {
    code: SupportedLocale;
    name: string;
    nativeName: string;
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
    numberFormat: {
        decimal: string;
        thousand: string;
    };
    country: string;
    flag: string;
}

export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        currency: 'USD',
        currencySymbol: '$',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        numberFormat: { decimal: '.', thousand: ',' },
        country: 'US',
        flag: '🇺🇸',
    },
    vi: {
        code: 'vi',
        name: 'Vietnamese',
        nativeName: 'Tiếng Việt',
        currency: 'VND',
        currencySymbol: '₫',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1,
        numberFormat: { decimal: ',', thousand: '.' },
        country: 'VN',
        flag: '🇻🇳',
    },
    th: {
        code: 'th',
        name: 'Thai',
        nativeName: 'ไทย',
        currency: 'THB',
        currencySymbol: '฿',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 0,
        numberFormat: { decimal: '.', thousand: ',' },
        country: 'TH',
        flag: '🇹🇭',
    },
    id: {
        code: 'id',
        name: 'Indonesian',
        nativeName: 'Bahasa Indonesia',
        currency: 'IDR',
        currencySymbol: 'Rp',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1,
        numberFormat: { decimal: ',', thousand: '.' },
        country: 'ID',
        flag: '🇮🇩',
    },
    tl: {
        code: 'tl',
        name: 'Filipino',
        nativeName: 'Filipino',
        currency: 'PHP',
        currencySymbol: '₱',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0,
        numberFormat: { decimal: '.', thousand: ',' },
        country: 'PH',
        flag: '🇵🇭',
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 DATE/TIME FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

export function formatDate(date: Date | string, locale: SupportedLocale): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const config = LOCALE_CONFIGS[locale];

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return config.dateFormat
        .replace('DD', day)
        .replace('MM', month)
        .replace('YYYY', year.toString());
}

export function formatTime(date: Date | string, locale: SupportedLocale): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const config = LOCALE_CONFIGS[locale];

    if (config.timeFormat === '12h') {
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(date: Date | string, locale: SupportedLocale): string {
    return `${formatDate(date, locale)} ${formatTime(date, locale)}`;
}

export function formatRelativeTime(date: Date | string, locale: SupportedLocale): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const labels: Record<SupportedLocale, Record<string, string>> = {
        en: { now: 'just now', min: 'm ago', hour: 'h ago', day: 'd ago' },
        vi: { now: 'vừa xong', min: ' phút trước', hour: ' giờ trước', day: ' ngày trước' },
        th: { now: 'เมื่อกี้', min: ' นาทีที่แล้ว', hour: ' ชั่วโมงที่แล้ว', day: ' วันที่แล้ว' },
        id: { now: 'baru saja', min: ' menit lalu', hour: ' jam lalu', day: ' hari lalu' },
        tl: { now: 'ngayon lang', min: ' minuto ang nakalipas', hour: ' oras ang nakalipas', day: ' araw ang nakalipas' },
    };

    const l = labels[locale];

    if (diffSecs < 60) return l.now;
    if (diffMins < 60) return `${diffMins}${l.min}`;
    if (diffHours < 24) return `${diffHours}${l.hour}`;
    return `${diffDays}${l.day}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔢 NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

export function formatNumber(value: number, locale: SupportedLocale): string {
    const config = LOCALE_CONFIGS[locale];

    return new Intl.NumberFormat(`${locale}-${config.country}`, {
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatCompactNumber(value: number, locale: SupportedLocale): string {
    const config = LOCALE_CONFIGS[locale];

    return new Intl.NumberFormat(`${locale}-${config.country}`, {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(value);
}

export function formatPercent(value: number, locale: SupportedLocale): string {
    const config = LOCALE_CONFIGS[locale];

    return new Intl.NumberFormat(`${locale}-${config.country}`, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(value / 100);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💰 CURRENCY FORMATTING (Enhanced)
// ═══════════════════════════════════════════════════════════════════════════════

export function formatLocalCurrency(amount: number, locale: SupportedLocale): string {
    const config = LOCALE_CONFIGS[locale];

    return new Intl.NumberFormat(`${locale}-${config.country}`, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: config.currency === 'VND' || config.currency === 'IDR' ? 0 : 2,
        maximumFractionDigits: config.currency === 'VND' || config.currency === 'IDR' ? 0 : 2,
    }).format(amount);
}

export function formatLocalCurrencyCompact(amount: number, locale: SupportedLocale): string {
    const config = LOCALE_CONFIGS[locale];

    return new Intl.NumberFormat(`${locale}-${config.country}`, {
        style: 'currency',
        currency: config.currency,
        notation: 'compact',
        compactDisplay: 'short',
    }).format(amount);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌐 LOCALE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function detectUserLocale(): SupportedLocale {
    if (typeof navigator === 'undefined') return 'en';

    const browserLocale = navigator.language.split('-')[0].toLowerCase();

    if (browserLocale in LOCALE_CONFIGS) {
        return browserLocale as SupportedLocale;
    }

    // Map common variants
    const localeMap: Record<string, SupportedLocale> = {
        'fil': 'tl',
        'ms': 'id', // Malay → Indonesian (similar)
    };

    return localeMap[browserLocale] || 'en';
}

export function getLocaleConfig(locale: SupportedLocale): LocaleConfig {
    return LOCALE_CONFIGS[locale] || LOCALE_CONFIGS.en;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗓️ CALENDAR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export function getDayNames(locale: SupportedLocale, format: 'short' | 'long' = 'short'): string[] {
    const config = LOCALE_CONFIGS[locale];
    const days: string[] = [];

    // Create a week starting from Sunday
    const baseDate = new Date(2024, 0, 7); // Sunday

    for (let i = 0; i < 7; i++) {
        const day = new Date(baseDate);
        day.setDate(day.getDate() + i);
        days.push(day.toLocaleDateString(`${locale}-${config.country}`, { weekday: format }));
    }

    // Rotate if first day is Monday
    if (config.firstDayOfWeek === 1) {
        const sunday = days.shift()!;
        days.push(sunday);
    }

    return days;
}

export function getMonthNames(locale: SupportedLocale, format: 'short' | 'long' = 'long'): string[] {
    const config = LOCALE_CONFIGS[locale];
    const months: string[] = [];

    for (let i = 0; i < 12; i++) {
        const date = new Date(2024, i, 1);
        months.push(date.toLocaleDateString(`${locale}-${config.country}`, { month: format }));
    }

    return months;
}
