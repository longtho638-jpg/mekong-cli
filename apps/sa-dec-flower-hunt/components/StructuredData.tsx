import React from 'react';
import { safeJsonLd } from "@/lib/utils-seo";

interface StructuredDataProps {
    data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        ...data
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
    );
}
