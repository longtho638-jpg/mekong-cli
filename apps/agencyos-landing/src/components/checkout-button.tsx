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
      window.location.href = url;
    } catch (_error: unknown) {
      alert(t('checkout'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      aria-busy={loading}
      aria-label="Proceed to checkout"
      className={`w-full text-left ${loading ? 'pointer-events-none opacity-70' : ''}`}
    >
      {children}
    </button>
  );
}
