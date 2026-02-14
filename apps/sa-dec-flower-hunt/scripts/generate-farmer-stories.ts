/**
 * Farmer Story Generator
 * Uses Gemini AI to create authentic, compelling farmer profiles
 * Standalone script - no external dependencies
 */

const FARMER_PROFILES = [
    {
        id: 'nguyen-van-thanh',
        name: 'Nguyễn Văn Thanh',
        age: 52,
        specialty: 'Cúc mâm xôi vàng',
        experience: '30 years',
        location: 'Ấp Tân Quy Đông, Sa Đéc'
    },
    {
        id: 'le-thi-mai',
        name: 'Lê Thị Mai',
        age: 45,
        specialty: 'Hồng môn',
        experience: '25 years',
        location: 'Phường 3, Sa Đéc'
    },
    {
        id: 'tran-minh-hieu',
        name: 'Trần Minh Hiếu',
        age: 38,
        specialty: 'Lan hồ điệp',
        experience: '15 years',
        location: 'Xã Tân Phú Đông'
    },
    {
        id: 'pham-thi-hong',
        name: 'Phạm Thị Hồng',
        age: 58,
        specialty: 'Cúc calimero',
        experience: '35 years',
        location: 'Ấp Thạnh Trị'
    },
    {
        id: 'hoang-van-nam',
        name: 'Hoàng Văn Nam',
        age: 41,
        specialty: 'Hoa hồng cổ',
        experience: '20 years',
        location: 'Phường 1, Sa Đéc'
    },
    {
        id: 'nguyen-thi-lan',
        name: 'Nguyễn Thị Lan',
        age: 49,
        specialty: 'Đồng tiền vàng',
        experience: '28 years',
        location: 'Xã Tân Khánh Đông'
    },
    {
        id: 'vo-thanh-son',
        name: 'Võ Thanh Sơn',
        age: 35,
        specialty: 'Hoa cúc lưới',
        experience: '12 years',
        location: 'Phường 2, Sa Đéc'
    },
    {
        id: 'tran-thi-nga',
        name: 'Trần Thị Nga',
        age: 55,
        specialty: 'Hoa hướng dương',
        experience: '32 years',
        location: 'Ấp Bình Hòa'
    },
    {
        id: 'le-van-tuan',
        name: 'Lê Văn Tuấn',
        age: 44,
        specialty: 'Cẩm chướng',
        experience: '22 years',
        location: 'Xã An Hoà'
    },
    {
        id: 'phan-thi-thao',
        name: 'Phan Thị Thảo',
        age: 37,
        specialty: 'Cúc lá nho',
        experience: '18 years',
        location: 'Phường 4, Sa Đéc'
    }
];

async function generateFarmerStory(farmer: typeof FARMER_PROFILES[0]) {
    console.log(`\n🌸 Generating story for ${farmer.name}...`);

    const prompt = `You are a Vietnamese storytelling expert. Write an authentic, heartwarming farmer profile for Sa Dec Flower Hunt platform.

Farmer Details:
- Name: ${farmer.name}
- Age: ${farmer.age}
- Specialty: ${farmer.specialty}
- Experience: ${farmer.experience}
- Location: ${farmer.location}

Create a compelling story (400-500 words in Vietnamese) that includes:
1. **Journey**: How they started flower farming
2. **Passion**: Why they love what they do
3. **Challenges**: Real struggles they've overcome
4. **Pride**: Their signature flower and cultivation secret
5. **Dream**: What this platform means for their future

Write in first-person ("Tôi..."), informal, warm tone. Make it authentic and emotional - readers should FEEL the connection.

Format as JSON:
{
  "title": "Câu chuyện của [Tên]",
  "subtitle": "[Specialty] - [Years] năm kinh nghiệm",
  "story": "full story here in Vietnamese",
  "quote": "one memorable quote from the farmer",
  "fun_fact": "một điều thú vị về người này"
}`;

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY || ''
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const storyData = JSON.parse(jsonMatch[0]);
            return {
                id: farmer.id,
                farmer: farmer,
                ...storyData,
                generated_at: new Date().toISOString()
            };
        }

        throw new Error('Could not parse JSON from Gemini response');

    } catch (error) {
        console.error(`Error generating story for ${farmer.name}:`, error);
        return {
            id: farmer.id,
            farmer: farmer,
            title: `Câu chuyện của ${farmer.name}`,
            subtitle: `${farmer.specialty} - ${farmer.experience} kinh nghiệm`,
            story: `[Story generation failed - manual editing required]`,
            quote: `"Hoa là niềm đam mê cả đời tôi" - ${farmer.name}`,
            fun_fact: `Đã trồng hoa được ${farmer.experience}`,
            generated_at: new Date().toISOString(),
            error: true
        };
    }
}

async function generateAllStories() {
    console.log('🚀 Starting Farmer Story Generation...\n');
    console.log(`Total farmers: ${FARMER_PROFILES.length}\n`);

    const stories = [];

    for (const farmer of FARMER_PROFILES) {
        const story = await generateFarmerStory(farmer);
        stories.push(story);

        // Save individual story
        const fs = require('fs');
        const path = require('path');
        const filepath = path.join(__dirname, '../content/farmer-stories', `${farmer.id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(story, null, 2), 'utf-8');
        console.log(`✅ Saved: ${filepath}`);

        // Rate limit: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Save consolidated file
    const fs = require('fs');
    const path = require('path');
    const consolidatedPath = path.join(__dirname, '../content/farmer-stories', 'all-stories.json');
    fs.writeFileSync(consolidatedPath, JSON.stringify(stories, null, 2), 'utf-8');
    console.log(`\n✅ All stories saved to: ${consolidatedPath}`);

    console.log(`\n🎉 Generation complete! ${stories.length} farmer stories created.`);
}

// Run if called directly
if (require.main === module) {
    generateAllStories().catch(console.error);
}

export { generateFarmerStory, generateAllStories, FARMER_PROFILES };
