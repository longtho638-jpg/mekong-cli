import {
  Section,
  Text,
  Button,
  Heading,
  Img,
  Container,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../../layout";

interface Day7SuccessStoriesProps {
  firstName?: string;
  upgradeLink?: string;
}

export const Day7SuccessStories = ({
  firstName = "Builder",
  upgradeLink = "https://yourdomain.com/pricing",
}: Day7SuccessStoriesProps) => {
  return (
    <BaseLayout preview="See what others are building">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        From Zero to Hero 🏆
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hey {firstName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        It's been a week since you joined! We've seen some incredible companies built on our platform. Here's a quick story to inspire you:
      </Text>

      <Section className="my-[20px] p-[20px] bg-[#fff5eb] rounded border border-[#ffdcb5]">
        <Text className="text-[16px] italic m-0 mb-[10px]">
          "We scaled from 100 to 10,000 users in 3 months. The automation tools saved us hiring 2 full-time support staff."
        </Text>
        <Text className="text-[14px] font-bold m-0">
          — Sarah Jenkins, CEO of TechFlow
        </Text>
      </Section>

      <Text className="text-black text-[14px] leading-[24px]">
        Ready to write your own success story?
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Upgrade to our Pro plan today and unlock unlimited workflows, advanced analytics, and priority support.
      </Text>

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#007291] rounded text-white text-[16px] font-bold no-underline text-center px-8 py-4"
          href={upgradeLink}
        >
          Upgrade to Pro - 20% Off Today
        </Button>
      </Section>
      <Text className="text-center text-[12px] text-gray-500">
        Use code <strong>WELCOME20</strong> at checkout.
      </Text>
    </BaseLayout>
  );
};

export default Day7SuccessStories;
