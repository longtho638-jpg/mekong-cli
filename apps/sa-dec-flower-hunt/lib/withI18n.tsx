"use client";

import React from 'react';
import { useLanguage } from './i18n';
import { getPageTexts } from './i18n-config';

export interface WithI18nProps {
    texts: Record<string, string>;
    language: "vi" | "en";
}

// HOC to inject specific translations for a page
export function withI18n<P extends WithI18nProps>(
    Component: React.ComponentType<P>,
    pageKey: string
) {
    return function WithI18nComponent(props: Omit<P, keyof WithI18nProps>) {
        const { t, language } = useLanguage();

        // Get only the texts needed for this page
        // This makes the component props cleaner and allows for potential optimization
        const pageTexts = getPageTexts(pageKey, t);

        // We cast props to P because we know we are supplying the missing WithI18nProps
        return (
            <Component
                {...(props as P)}
                texts={pageTexts}
                language={language}
            />
        );
    };
}
