import {
  Section,
  Text,
  Button,
  Heading,
  Img,
  Link,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../../layout";

interface Day0WelcomeProps {
  firstName?: string;
  dashboardLink?: string;
}

export const Day0Welcome = ({
  firstName = "Builder",
  dashboardLink = "https://yourdomain.com/dashboard",
}: Day0WelcomeProps) => {
  return (
    <BaseLayout preview="You're in! Here's how to get started">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Welcome to the Family! 🚀
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hey {firstName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        I'm thrilled you've decided to join us. You're now part of a community of builders who are shipping faster than ever.
      </Text>
      <Section className="my-[20px] p-[20px] bg-[#f9f9f9] rounded border border-[#eaeaea]">
        <Heading as="h3" className="text-[18px] mt-0 mb-[10px]">
          Your 3-Step Quick Start:
        </Heading>
        <Text className="text-[14px] m-0 mb-[10px]">
          1. <strong>Complete your profile</strong> - Let us know what you're building.
        </Text>
        <Text className="text-[14px] m-0 mb-[10px]">
          2. <strong>Create your first project</strong> - Use our templates to jumpstart.
        </Text>
        <Text className="text-[14px] m-0">
          3. <strong>Join the Discord</strong> - Meet fellow founders.
        </Text>
      </Section>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#007291] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-4"
          href={dashboardLink}
        >
          Start Building Now
        </Button>
      </Section>
      <Text className="text-black text-[14px] leading-[24px]">
        Over the next week, I'll send you a few tips to help you get the most out of the platform. Stay tuned!
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Cheers,<br />
        The Antigravity Team
      </Text>
    </BaseLayout>
  );
};

export default Day0Welcome;
