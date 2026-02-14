import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 100,
                    background: 'linear-gradient(to bottom right, #050505, #111)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981', // Emerald 500
                    borderRadius: '18%', // iOS squircle approximation
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Digital Lotus Node (Scaled Up) */}
                    <svg
                        width="100"
                        height="100"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginBottom: 4 }}
                    >
                        <path
                            d="M50 20 C50 20 70 35 70 50 C70 65 50 80 50 80 C50 80 30 65 30 50 C30 35 50 20 50 20 Z"
                            stroke="#10B981"
                            strokeWidth="4"
                            fill="rgba(16, 185, 129, 0.2)"
                        />
                        <circle cx="50" cy="50" r="4" fill="#fff" />
                        <path d="M50 20 L50 10" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                        <path d="M50 80 L50 90" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                        <path d="M70 50 L80 50" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                        <path d="M30 50 L20 50" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.05em', display: 'flex' }}>
                        AGRIOS<span style={{ color: '#10B981' }}>.tech</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#10B981', letterSpacing: '0.2em', marginTop: 0 }}>GARDEN OS</div>
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
