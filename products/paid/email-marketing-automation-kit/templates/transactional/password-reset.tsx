import {
  Section,
  Text,
  Button,
  Heading,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface PasswordResetProps {
  resetLink?: string;
  customerName?: string;
}

export const PasswordReset = ({
  resetLink = "https://yourdomain.com/reset-password?token=123",
  customerName = "User",
}: PasswordResetProps) => {
  return (
    <BaseLayout preview="Reset your password">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Reset Password
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hi {customerName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Someone recently requested a password change for your account. If this was you, you can set a new password here:
      </Text>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={resetLink}
        >
          Reset password
        </Button>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        If you don't want to change your password or didn't request this, just ignore and delete this message.
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        This link will expire in 24 hours.
      </Text>
    </BaseLayout>
  );
};

export default PasswordReset;
