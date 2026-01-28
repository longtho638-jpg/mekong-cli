'use client';

import '../lib/i18n';
import React, { PropsWithChildren } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

export function Providers({ children }: PropsWithChildren) {
  return (
    // @ts-ignore - React 19 type compatibility issue
    <I18nextProvider i18n={i18n}>
        {children as any}
    </I18nextProvider>
  );
}
