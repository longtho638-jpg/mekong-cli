'use client'

import dynamic from 'next/dynamic'
import { MD3Text } from '@/components/md3-dna/MD3Text'
import { MD3Card } from '@/components/md3/MD3Card'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues (it uses window object)
// @ts-expect-error - SwaggerUI types are tricky with next/dynamic
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function DocsPage() {
    return (
        <div className="space-y-6">
            <div>
                <MD3Text variant="display-small">API Documentation</MD3Text>
                <MD3Text variant="body-large" className="text-[var(--md-sys-color-on-surface-variant)]">
                    Interactive API reference for the AgencyOS Public API (v1).
                </MD3Text>
            </div>

            <MD3Card variant="outlined" className="p-0 overflow-hidden bg-white">
                <div className="swagger-wrapper">
                    <SwaggerUI
                        url="http://localhost:8000/openapi.json"
                        docExpansion="list"
                        defaultModelsExpandDepth={-1} // Hide models section by default
                        filter={true} // Enable search/filtering
                    />
                </div>
            </MD3Card>

            {/* @ts-expect-error - Styled JSX types are not properly picked up in this setup */}
            <style jsx global>{`
                /* Custom styling to make Swagger UI fit better with Dark Mode/MD3 */
                .swagger-wrapper {
                    /* Swagger UI is strictly light mode usually, so we force a white background container */
                    background-color: white;
                    border-radius: 12px;
                }

                .swagger-ui .info {
                    margin-top: 20px;
                }

                .swagger-ui .scheme-container {
                    background: transparent;
                    box-shadow: none;
                }
            `}</style>
        </div>
    )
}
