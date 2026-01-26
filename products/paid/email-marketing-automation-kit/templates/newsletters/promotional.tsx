import {
  Section,
  Text,
  Button,
  Heading,
  Container,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface PromotionalProps {
  offerName?: string;
  discountCode?: string;
  discountAmount?: string;
  expiryDate?: string;
  ctaLink?: string;
}

export const Promotional = ({
  offerName = "Flash Sale",
  discountCode = "FLASH50",
  discountAmount = "50%",
  expiryDate = "24 hours",
  ctaLink = "https://yourdomain.com/pricing",
}: PromotionalProps) => {
  return (
    <BaseLayout preview={`Special Offer: ${discountAmount} Off!`}>
      <Section className="bg-[#007291] p-[30px] rounded-t text-center">
        <Heading className="text-white text-[32px] font-bold m-0">
          {discountAmount} OFF
        </Heading>
        <Text className="text-white opacity-90 text-[16px] m-0 mt-[10px] uppercase tracking-wider">
          {offerName}
        </Text>
      </Section>

      <Section className="p-[20px] text-center">
        <Text className="text-black text-[16px] leading-[24px]">
          We rarely do this, but we want to help you kickstart your growth this quarter.
        </Text>
        <Text className="text-black text-[16px] leading-[24px]">
          For the next <strong>{expiryDate}</strong>, you can get full access to our Pro Plan at half the price.
        </Text>

        <Section className="my-[30px] p-[20px] border-2 border-dashed border-[#007291] rounded bg-[#f0f9ff] inline-block">
          <Text className="text-[#555] text-[12px] uppercase m-0 mb-[5px]">Use Code</Text>
          <Heading className="text-[#007291] text-[24px] font-mono m-0 tracking-widest">
            {discountCode}
          </Heading>
        </Section>

        <Section>
          <Button
            className="bg-[#000000] rounded text-white text-[16px] font-bold no-underline text-center px-8 py-4 shadow-lg"
            href={ctaLink}
          >
            Claim Your Discount
          </Button>
        </Section>

        <Text className="text-[#888] text-[12px] mt-[20px]">
          Offer expires in {expiryDate}. Cannot be combined with other offers.
        </Text>
      </Section>
    </BaseLayout>
  );
};

export default Promotional;
