import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 24,
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981', // Emerald 500
                    borderRadius: '20%',
                }}
            >
                {/* Digital Lotus Node from AgriosLogo.tsx */}
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M50 20 C50 20 70 35 70 50 C70 65 50 80 50 80 C50 80 30 65 30 50 C30 35 50 20 50 20 Z"
                        stroke="#10B981"
                        strokeWidth="8"
                        fill="none"
                    />
                    <circle cx="50" cy="50" r="4" fill="#fff" />
                    <path d="M50 20 L50 10" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                    <path d="M50 80 L50 90" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                    <path d="M70 50 L80 50" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                    <path d="M30 50 L20 50" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />
                </svg>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
