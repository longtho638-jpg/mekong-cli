import {
  Section,
  Text,
  Button,
  Heading,
  Hr,
  Badge,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface ProductUpdateProps {
  version?: string;
  changes?: { type: "NEW" | "FIX" | "IMPROVEMENT"; description: string }[];
  releaseNoteLink?: string;
}

export const ProductUpdate = ({
  version = "v2.4.0",
  changes = [
    { type: "NEW", description: "Added Dark Mode support for all dashboard pages" },
    { type: "IMPROVEMENT", description: "API response time reduced by 40%" },
    { type: "FIX", description: "Fixed issue with invoice PDF generation" },
  ],
  releaseNoteLink = "https://yourdomain.com/changelog",
}: ProductUpdateProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "NEW": return "#10b981"; // green
      case "FIX": return "#ef4444"; // red
      case "IMPROVEMENT": return "#3b82f6"; // blue
      default: return "#6b7280"; // gray
    }
  };

  return (
    <BaseLayout preview={`What's new in ${version}`}>
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Product Update {version} 🚀
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        We've just shipped a fresh update with some highly requested features and improvements. Here's what's new:
      </Text>

      <Section className="my-[20px]">
        {changes.map((change, index) => (
          <div key={index} className="mb-[15px] flex flex-row items-start">
            <span
              style={{
                backgroundColor: getTypeColor(change.type),
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                marginRight: '10px',
                display: 'inline-block',
                minWidth: '60px',
                textAlign: 'center'
              }}
            >
              {change.type}
            </span>
            <span className="text-[14px] text-black">{change.description}</span>
          </div>
        ))}
      </Section>

      <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={releaseNoteLink}
        >
          Read Full Changelog
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default ProductUpdate;
