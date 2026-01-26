import {
  Section,
  Text,
  Button,
  Heading,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface PaymentFailedProps {
  invoiceId?: string;
  amount?: string;
  cardLast4?: string;
  updateLink?: string;
  customerName?: string;
}

export const PaymentFailed = ({
  invoiceId = "INV-2026-001",
  amount = "$49.00",
  cardLast4 = "4242",
  updateLink = "https://yourdomain.com/billing",
  customerName = "Client",
}: PaymentFailedProps) => {
  return (
    <BaseLayout preview="Action Required: Payment Failed">
      <Heading className="text-[#ef4444] text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Payment Failed ⚠️
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hi {customerName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        We attempted to charge your card ending in <strong>{cardLast4}</strong> for invoice <strong>{invoiceId}</strong> amounting to <strong>{amount}</strong>, but the transaction failed.
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        This usually happens due to an expired card or insufficient funds. Please update your payment method to ensure uninterrupted service.
      </Text>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#ef4444] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={updateLink}
        >
          Update Payment Method
        </Button>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        We will attempt to charge your card again in 24 hours.
      </Text>
    </BaseLayout>
  );
};

export default PaymentFailed;
