import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', color: 'white' }}>
          AgencyOS
        </div>
        <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.9)', marginTop: 20, textAlign: 'center', padding: '0 40px' }}>
          {t('description')}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
