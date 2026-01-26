import {
  Section,
  Text,
  Button,
  Heading,
  Img,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface MonthlyNewsletterProps {
  month?: string;
  year?: string;
  articles?: { title: string; excerpt: string; link: string; image?: string }[];
}

export const MonthlyNewsletter = ({
  month = "January",
  year = "2026",
  articles = [
    {
      title: "The Future of SaaS in 2026",
      excerpt: "AI agents are changing how we build software. Here is what you need to know to stay ahead of the curve.",
      link: "#",
      image: "https://react-email-demo-ijnnx5hu2-resend.vercel.app/static/vercel-logo.png"
    },
    {
      title: "5 Tips for Better Email Deliverability",
      excerpt: "Stop landing in spam. We analyzed 1 million emails and found these common mistakes.",
      link: "#",
      image: "https://react-email-demo-ijnnx5hu2-resend.vercel.app/static/vercel-logo.png"
    }
  ],
}: MonthlyNewsletterProps) => {
  return (
    <BaseLayout preview={`${month} ${year} Digest`}>
      <Section className="text-center mt-[20px] mb-[30px]">
        <Heading className="text-[#007291] text-[12px] uppercase tracking-widest font-bold m-0">
          The Antigravity Dispatch
        </Heading>
        <Heading className="text-black text-[28px] font-normal m-0 mt-[10px]">
          {month} {year} Edition
        </Heading>
      </Section>

      <Text className="text-black text-[14px] leading-[24px]">
        Welcome back! This month we're diving deep into AI automation and how it's reshaping the indie hacker landscape.
      </Text>

      {articles.map((article, index) => (
        <Section key={index} className="my-[30px] border-b border-[#eaeaea] pb-[30px] last:border-0">
          {article.image && (
            <Img
              src={article.image}
              width="100%"
              height="auto"
              alt={article.title}
              className="rounded mb-[15px] object-cover h-[150px]"
            />
          )}
          <Heading as="h3" className="text-[18px] font-bold m-0 mb-[10px]">
            <a href={article.link} className="text-black no-underline hover:underline">
              {article.title}
            </a>
          </Heading>
          <Text className="text-[#555] text-[14px] m-0 mb-[15px]">
            {article.excerpt}
          </Text>
          <Button
            href={article.link}
            className="text-[#007291] text-[14px] font-semibold no-underline"
          >
            Read more →
          </Button>
        </Section>
      ))}

      <Section className="bg-[#f0f9ff] p-[20px] rounded text-center">
        <Heading as="h4" className="m-0 mb-[10px]">Community Spotlight</Heading>
        <Text className="text-[14px] m-0">
          Join 5,000+ builders in our Discord server. Share your wins and get feedback.
        </Text>
        <Button
          href="#"
          className="mt-[15px] bg-white text-[#007291] border border-[#007291] px-4 py-2 rounded text-[12px] font-bold"
        >
          Join Discord
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default MonthlyNewsletter;
