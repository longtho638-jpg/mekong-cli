"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div style={{ padding: 40, fontFamily: 'system-ui' }}>
                    <h1>Global Application Error</h1>
                    <pre style={{ background: '#f0f0f0', padding: 20, borderRadius: 8, color: 'red', overflow: 'auto' }}>
                        {error.message}
                        {error.stack && `\n\n${error.stack}`}
                    </pre>
                    <button
                        onClick={() => reset()}
                        style={{ marginTop: 20, padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: 4 }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
