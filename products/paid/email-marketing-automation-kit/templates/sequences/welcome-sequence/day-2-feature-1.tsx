import {
  Section,
  Text,
  Button,
  Heading,
  Img,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../../layout";

interface Day2Feature1Props {
  firstName?: string;
  featureLink?: string;
}

export const Day2Feature1 = ({
  firstName = "Builder",
  featureLink = "https://yourdomain.com/features/analytics",
}: Day2Feature1Props) => {
  return (
    <BaseLayout preview="Did you know you can do this?">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Unlock the Power of Analytics 📊
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hey {firstName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Data is your best friend when you're growing a SaaS. That's why we built a powerful Analytics engine right into the core platform.
      </Text>
      <Section className="my-[20px]">
        <Img
          src="https://react-email-demo-ijnnx5hu2-resend.vercel.app/static/vercel-logo.png"
          width="100%"
          height="auto"
          alt="Analytics Dashboard"
          className="rounded border border-[#eaeaea]"
        />
        <Text className="text-[12px] text-center text-gray-500 mt-[5px]">
          Your new command center
        </Text>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        With our Analytics, you can track:
      </Text>
      <ul className="text-[14px] leading-[24px]">
        <li>Real-time user activity</li>
        <li>Conversion rates per funnel step</li>
        <li>Retention cohorts</li>
        <li>Revenue attribution</li>
      </ul>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-4"
          href={featureLink}
        >
          Explore Analytics
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default Day2Feature1;
