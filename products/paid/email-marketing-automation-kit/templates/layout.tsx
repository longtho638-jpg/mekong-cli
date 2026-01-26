import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Link,
  Hr,
  Preview,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
  preview?: string;
  children: React.ReactNode;
  footerText?: string;
}

export const BaseLayout = ({
  preview = "Antigravity Email Kit",
  children,
  footerText = "© 2026 Antigravity. All rights reserved.",
}: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#007291",
                offwhite: "#fafafa",
              },
            },
          },
        }}
      >
        <Body className="bg-offwhite my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
            <Section className="mt-[32px]">
              <Img
                src="https://react-email-demo-ijnnx5hu2-resend.vercel.app/static/vercel-logo.png"
                width="40"
                height="37"
                alt="Logo"
                className="my-0 mx-auto"
              />
            </Section>
            {children}
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              {footerText}
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              <Link href="#" className="text-[#666666] underline">
                Unsubscribe
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BaseLayout;
