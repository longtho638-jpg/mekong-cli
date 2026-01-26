import {
  Section,
  Text,
  Button,
  Row,
  Column,
  Heading,
} from "@react-email/components";
import * as React from "react";
import BaseLayout from "../layout";

interface InvoiceProps {
  invoiceId?: string;
  date?: string;
  items?: { description: string; amount: string }[];
  total?: string;
  customerName?: string;
  downloadLink?: string;
}

export const Invoice = ({
  invoiceId = "INV-2026-001",
  date = "Jan 26, 2026",
  items = [
    { description: "Pro Plan - Monthly", amount: "$49.00" },
    { description: "Additional Seat", amount: "$10.00" },
  ],
  total = "$59.00",
  customerName = "Client",
  downloadLink = "https://yourdomain.com/invoices/INV-2026-001.pdf",
}: InvoiceProps) => {
  return (
    <BaseLayout preview={`Invoice ${invoiceId}`}>
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Invoice {invoiceId}
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        Hi {customerName},
      </Text>
      <Text className="text-black text-[14px] leading-[24px]">
        Thank you for your business. Here is the invoice for your recent service.
      </Text>
      <Section className="bg-[#f9f9f9] border border-solid border-[#eaeaea] rounded p-[20px] my-[20px]">
        <Row className="mb-[10px]">
          <Column>
            <Text className="m-0 text-[14px] text-gray-500">Invoice ID</Text>
            <Text className="m-0 text-[14px] font-semibold">{invoiceId}</Text>
          </Column>
          <Column align="right">
            <Text className="m-0 text-[14px] text-gray-500">Date</Text>
            <Text className="m-0 text-[14px] font-semibold">{date}</Text>
          </Column>
        </Row>
        <div className="h-px bg-[#eaeaea] my-[15px]" />
        {items.map((item, index) => (
          <Row key={index} className="mb-[10px]">
            <Column>
              <Text className="m-0 text-[14px]">{item.description}</Text>
            </Column>
            <Column align="right">
              <Text className="m-0 text-[14px] font-semibold">{item.amount}</Text>
            </Column>
          </Row>
        ))}
        <div className="h-px bg-[#eaeaea] my-[15px]" />
        <Row>
          <Column>
            <Text className="m-0 text-[16px] font-bold">Total</Text>
          </Column>
          <Column align="right">
            <Text className="m-0 text-[16px] font-bold">{total}</Text>
          </Column>
        </Row>
      </Section>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href={downloadLink}
        >
          Download PDF
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default Invoice;
