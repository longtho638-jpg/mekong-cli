import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export async function POST(req: Request) {
  if (!apiKey || !model) {
    return NextResponse.json(
        { error: "API Key missing" },
        { status: 500 }
    );
  }

  try {
    const { flower_name } = await req.json();

    const prompt = `
      Bạn là thầy bói hoa vui tính "Thầy Bói Sa Đéc" chuyên gieo quẻ ngày Tết.
      Người dùng vừa chọn trúng loài hoa: "${flower_name}".
      
      Hãy viết một lời bói vui (fortune) cho năm mới 2026:
      - Ngắn gọn (dưới 30 từ).
      - Hài hước, bắt trend Gen Z hoặc chơi chữ.
      - Liên quan đến đặc tính của loài hoa đó.
      - Kết thúc bằng một con số may mắn.
      
      Ví dụ với hoa Cúc Mâm Xôi: "Năm nay tiền vào như nước, tình đầy như mâm xôi. Số may mắn: 88"
      
      Chỉ trả về nội dung lời bói.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fortune_text = response.text();

    return NextResponse.json({ fortune_text });
  } catch (error) {
    console.error("Fortune API Error:", error);
    return NextResponse.json(
      { fortune_text: "Năm nay hoa nở tưng bừng, tiền vô như nước chớ đừng âu lo! Số may mắn: 99" }, // Fallback
      { status: 200 } // Soft fail
    );
  }
}
