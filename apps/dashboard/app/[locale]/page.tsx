'use client';

import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';

// Root locale page - redirect to landing
export default function LocaleHomePage() {
    const params = useParams();
    const locale = params?.locale || 'vi';

    // Redirect to landing page
    redirect(`/${locale}/landing`);
}
