import { render } from '@react-email/render';
import { OrderConfirmation } from '../../templates/transactional/order-confirmation';
import { PasswordReset } from '../../templates/transactional/password-reset';
import { Welcome } from '../../templates/transactional/welcome';
import { Invoice } from '../../templates/transactional/invoice';
import { AccountVerification } from '../../templates/transactional/account-verification';
import { PaymentFailed } from '../../templates/transactional/payment-failed';
import { Day0Welcome } from '../../templates/sequences/welcome-sequence/day-0-welcome';
import { Day2Feature1 } from '../../templates/sequences/welcome-sequence/day-2-feature-1';
import { Day4Feature2 } from '../../templates/sequences/welcome-sequence/day-4-feature-2';
import { Day7SuccessStories } from '../../templates/sequences/welcome-sequence/day-7-success-stories';
import { ProductUpdate } from '../../templates/newsletters/product-update';
import { MonthlyNewsletter } from '../../templates/newsletters/monthly-newsletter';
import { Promotional } from '../../templates/newsletters/promotional';
import * as React from 'react';

const templates: Record<string, React.FC<any>> = {
  'order-confirmation': OrderConfirmation,
  'password-reset': PasswordReset,
  'welcome': Welcome,
  'invoice': Invoice,
  'account-verification': AccountVerification,
  'payment-failed': PaymentFailed,
  'welcome-day-0': Day0Welcome,
  'welcome-day-2': Day2Feature1,
  'welcome-day-4': Day4Feature2,
  'welcome-day-7': Day7SuccessStories,
  'product-update': ProductUpdate,
  'monthly-newsletter': MonthlyNewsletter,
  'promotional': Promotional,
};

export async function renderTemplate(templateName: string, props: any = {}) {
  const Template = templates[templateName];

  if (!Template) {
    throw new Error(`Template ${templateName} not found`);
  }

  const html = await render(<Template {...props} />);
  return html;
}

export function getAvailableTemplates() {
  return Object.keys(templates);
}
