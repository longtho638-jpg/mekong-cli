import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Hr,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from '@react-email/components';
import React from 'react';

interface WelcomeEmailProps {
    name?: string;
    discountCode?: string;
}

export const WelcomeEmail = ({
    name = 'Bạn mới',
    discountCode = 'CHAO10',
}: WelcomeEmailProps) => {
    const previewText = `Chào mừng ${name} đến với Sa Đéc Flower Hunt! Nhận ngay ưu đãi 10% tại đây.`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Section className="mt-[32px]">
                            <Img
                                src="https://sa-dec-flower-hunt.vercel.app/logo.png"
                                width="80"
                                height="80"
                                alt="Sa Đéc Flower Hunt"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Chào mừng bạn đến với <strong>Làng Hoa Sa Đéc Online</strong>
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Xin chào {name},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Cảm ơn bạn đã ghé thăm Sa Đéc Flower Hunt. Chúng tôi mang cả vườn hoa trăm tuổi đến tận cửa nhà bạn, tươi mới và rực rỡ nhất.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Text className="text-black text-[14px] leading-[24px] mb-4">
                                Dành tặng bạn mã giảm giá <strong>10%</strong> cho đơn hàng đầu tiên:
                            </Text>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block mb-6">
                                <Text className="text-green-700 text-[24px] font-bold m-0 tracking-widest">
                                    {discountCode}
                                </Text>
                            </div>
                            <br />
                            <Button
                                className="bg-[#16a34a] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href="https://sa-dec-flower-hunt.vercel.app"
                            >
                                Đặt Hoa Ngay
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Nếu có bất kỳ câu hỏi nào về cách chăm sóc hoa, đừng ngần ngại trả lời email này nhé. Út Men và đội ngũ luôn sẵn sàng hỗ trợ!
                        </Text>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Sa Đéc Flower Hunt - Từ vườn đến nhà.<br />
                            Sa Đéc, Đồng Tháp, Việt Nam.
                            <br />
                            <Link href="https://sa-dec-flower-hunt.vercel.app/blog" className="text-blue-600 no-underline">
                                Đọc Blog Chăm Sóc Hoa
                            </Link>
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
