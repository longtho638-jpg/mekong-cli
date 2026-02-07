"use client";

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface CheckoutButtonProps {
  priceId: string;
  children: React.ReactNode;
}

export function CheckoutButton({ priceId, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations('errors');
  const locale = useLocale();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Polar.sh Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert(t('checkout'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={handleCheckout} className={loading ? 'pointer-events-none opacity-70' : ''}>
      {children}
    </div>
  );
}
