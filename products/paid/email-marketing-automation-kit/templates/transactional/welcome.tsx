import {
  Section,
  Text,
  Button,
  Heading,
  Img,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface WelcomeProps {
  customerName?: string;
  loginLink?: string;
}

export const Welcome = ({
  customerName = "Friend",
  loginLink = "https://yourdomain.com/login",
}: WelcomeProps) => {
  return (
    <BaseLayout preview="Welcome to Antigravity!">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Welcome to Antigravity!
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hello {customerName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        We're excited to have you on board. Antigravity is designed to help you build and scale your SaaS faster than ever.
      </Text>
      <Section className="text-center my-[32px]">
        <Img
          src="https://react-email-demo-ijnnx5hu2-resend.vercel.app/static/vercel-user.png"
          width="100"
          height="100"
          alt="Welcome"
          className="mx-auto"
        />
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        To get started, simply log in to your account and explore the dashboard.
      </Text>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={loginLink}
        >
          Go to Dashboard
        </Button>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        If you have any questions, feel free to reply to this email. We're here to help!
      </Text>
    </BaseLayout>
  );
};

export default Welcome;
