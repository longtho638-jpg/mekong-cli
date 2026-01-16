import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

// POST /api/ai/write - Generate newsletter content with AI
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { topic, tone = 'professional', length = 'medium' } = body

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
        }

        // TODO: Integrate with OpenAI/Gemini
        // For now, return a structured demo response

        const lengthGuide = {
            short: '2-3 sections, ~300 words',
            medium: '4-5 sections, ~600 words',
            long: '6-8 sections, ~1000 words'
        }

        const toneGuide = {
            professional: 'formal but accessible',
            casual: 'friendly and conversational',
            friendly: 'warm and engaging',
            formal: 'business formal'
        }

        // Simulated AI response
        const response = {
            subject_lines: [
                `🚀 ${topic}: What You Need to Know`,
                `The Essential Guide to ${topic}`,
                `${topic} - This Week's Key Insights`
            ],
            preview_text: `Discover the latest insights on ${topic.toLowerCase()} and how it affects you.`,
            content: {
                opening: `The landscape of ${topic.toLowerCase()} is evolving rapidly. Here's your essential update on what's changing and why it matters.`,
                sections: [
                    {
                        heading: 'The Big Picture',
                        content: `[AI-generated overview of ${topic.toLowerCase()} with current trends, market data, and key developments that your audience needs to know about.]`
                    },
                    {
                        heading: 'Key Insights',
                        content: `• **Trend 1**: First major trend in ${topic.toLowerCase()}\n• **Trend 2**: Second key development\n• **Trend 3**: Third important insight`
                    },
                    {
                        heading: 'What This Means For You',
                        content: `[Practical implications and actionable takeaways tailored to your audience. Focus on what they can do today.]`
                    },
                    {
                        heading: 'Looking Ahead',
                        content: `[Future outlook and predictions for ${topic.toLowerCase()}. What to watch for in the coming weeks and months.]`
                    }
                ],
                cta: `Have questions about ${topic.toLowerCase()}? Reply to this email - I read every response.`,
                closing: 'Until next time,'
            },
            metadata: {
                topic,
                tone: toneGuide[tone as keyof typeof toneGuide] || toneGuide.professional,
                length: lengthGuide[length as keyof typeof lengthGuide] || lengthGuide.medium,
                generated_at: new Date().toISOString(),
                model: 'demo' // Will be 'gpt-4' or 'gemini-pro' in production
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error generating content:', error)
        return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
