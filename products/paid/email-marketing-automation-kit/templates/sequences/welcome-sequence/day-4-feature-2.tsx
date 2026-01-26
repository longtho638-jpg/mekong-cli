import {
  Section,
  Text,
  Button,
  Heading,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../../layout";

interface Day4Feature2Props {
  firstName?: string;
  automationLink?: string;
}

export const Day4Feature2 = ({
  firstName = "Builder",
  automationLink = "https://yourdomain.com/features/automation",
}: Day4Feature2Props) => {
  return (
    <BaseLayout preview="Put your growth on autopilot">
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Sleep While Your App Grows 💤
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hey {firstName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Manual work kills momentum. Today, I want to show you how to automate the tedious parts of your business using our <strong>Workflows</strong> feature.
      </Text>

      <Section className="my-[20px]">
        <Row>
          <Column className="w-1/2 p-[10px] border border-[#eaeaea] rounded">
            <Heading as="h4" className="m-0 mb-[5px]">Trigger</Heading>
            <Text className="m-0 text-[12px]">New User Signup</Text>
          </Column>
          <Column className="w-[20px] text-center">➡️</Column>
          <Column className="w-1/2 p-[10px] border border-[#eaeaea] rounded bg-[#f0f9ff]">
            <Heading as="h4" className="m-0 mb-[5px]">Action</Heading>
            <Text className="m-0 text-[12px]">Send Welcome Email</Text>
          </Column>
        </Row>
      </Section>

      <Text className="text-black text-[14px] leading-[24px]">
        You can set up automations for:
      </Text>
      <ul className="text-[14px] leading-[24px]">
        <li>Onboarding emails (like this one!)</li>
        <li>Failed payment recovery</li>
        <li>Slack notifications for new sales</li>
        <li>Customer success check-ins</li>
      </ul>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-4"
          href={automationLink}
        >
          Setup Your First Workflow
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default Day4Feature2;
