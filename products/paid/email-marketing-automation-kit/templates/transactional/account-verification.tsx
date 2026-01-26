import {
  Section,
  Text,
  Button,
  Heading,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface AccountVerificationProps {
  verifyLink?: string;
  customerName?: string;
}

export const AccountVerification = ({
  verifyLink = "https://yourdomain.com/verify?token=abc-123",
  customerName = "User",
}: AccountVerificationProps) => {
  return (
    <BaseLayout preview="Verify your email address">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Verify your email
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hi {customerName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Thanks for creating an account with Antigravity. Please verify your email address to complete your registration.
      </Text>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={verifyLink}
        >
          Verify Email Address
        </Button>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        If you didn't create an account, you can safely ignore this email.
      </Text>
    </BaseLayout>
  );
};

export default AccountVerification;
