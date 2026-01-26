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

interface OrderConfirmationProps {
  orderId?: string;
  items?: { name: string; price: string }[];
  total?: string;
  customerName?: string;
}

export const OrderConfirmation = ({
  orderId = "ORD-123456",
  items = [
    { name: "Antigravity SaaS Kit", price: "$299.00" },
    { name: "Email Automation Add-on", price: "$57.00" },
  ],
  total = "$356.00",
  customerName = "Founder",
}: OrderConfirmationProps) => {
  return (
    <BaseLayout preview={`Order Confirmation #${orderId}`}>
      <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
        Thanks for your order, {customerName}!
      </Heading>
      <Text className="text-black text-[14px] leading-[24px]">
        We've received your order and are processing it now. Here are the details:
      </Text>
      <Section className="border border-solid border-[#eaeaea] rounded p-[20px] my-[20px]">
        <Text className="mt-0 font-bold">Order ID: {orderId}</Text>
        {items.map((item, index) => (
          <Row key={index} className="mb-[10px]">
            <Column>
              <Text className="m-0 text-[14px]">{item.name}</Text>
            </Column>
            <Column align="right">
              <Text className="m-0 text-[14px] font-semibold">{item.price}</Text>
            </Column>
          </Row>
        ))}
        <Row className="mt-[10px] border-t border-solid border-[#eaeaea] pt-[10px]">
          <Column>
            <Text className="m-0 text-[14px] font-bold">Total</Text>
          </Column>
          <Column align="right">
            <Text className="m-0 text-[14px] font-bold">{total}</Text>
          </Column>
        </Row>
      </Section>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
          href="https://yourdomain.com/orders"
        >
          View Order Status
        </Button>
      </Section>
    </BaseLayout>
  );
};

export default OrderConfirmation;
