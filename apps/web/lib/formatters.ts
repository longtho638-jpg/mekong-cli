export function formatCurrency(amount: number, locale: string, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  } catch (e) {
    // Fallback if locale/currency invalid
    return `${currency} ${amount}`;
  }
}

export function formatDate(date: Date | string | number, locale: string): string {
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch (e) {
    return new Date(date).toLocaleDateString();
  }
}

export function formatRelativeTime(date: Date | string | number, locale: string): string {
  try {
    const d = new Date(date);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diff = Date.now() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (Math.abs(hours) < 24) {
        if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute');
        return rtf.format(-hours, 'hour');
    }
    return rtf.format(-days, 'day');
  } catch (e) {
    return formatDate(date, locale);
  }
}
