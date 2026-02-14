import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Vietnamese flower farmer names
const FARMER_NAMES = [
    'Nguyễn Văn Hoa',
    'Trần Thị Lan',
    'Lê Văn Phúc',
    'Phạm Thị Mai',
    'Hoàng Văn Tùng',
    'Võ Thị Hồng',
    'Đặng Văn Bình',
    'Ngô Thị Xuân',
    'Bùi Văn Đức',
    'Phan Thị Thu',
];

// Sa Dec addresses
const SA_DEC_ADDRESSES = [
    'Ấp Tân Khánh, Xã Tân Khánh Đông, Sa Đéc',
    'Khu phố 3, Phường 3, Sa Đéc',
    'Ấp Mỹ Hòa, X nga An Hòa, Sa Đéc',
    'Khu phố 1, Phường 1, Sa Đéc',
    'Ấp Tân Quy Đông, Xã Tân Quy Đông, Sa Đéc',
    'Khu phố 2, Phường 2, Sa Đéc',
    'Ấp Thới Xuân, Xã Thới Xuân, Sa Đéc',
    'Số 123 Đường Hùng Vương, Sa Đéc',
    'Số 456 Đường Trần Hưng Đạo, Sa Đéc',
    'Số 789 Đường Nguyễn Huệ, Sa Đéc',
];

// Flower specialties
const SPECIALTIES = [
    ['rose', 'lily'],
    ['orchid', 'sunflower'],
    ['rose', 'carnation'],
    ['lily', 'tulip'],
    ['orchid', 'rose'],
    ['sunflower', 'daisy'],
    ['rose', 'peony'],
    ['lily', 'orchid'],
    ['carnation', 'rose'],
    ['tulip', 'lily'],
];

// Product data
const FLOWER_PRODUCTS = [
    { name: 'Hoa Hồng Đỏ', category: 'rose', price: 150000, unit: 'bó 10 cành' },
    { name: 'Hoa Hồng Vàng', category: 'rose', price: 180000, unit: 'bó 10 cành' },
    { name: 'Hoa Hồng Trắng', category: 'rose', price: 160000, unit: 'bó 10 cành' },
    { name: 'Hoa Lan Hồ Điệp', category: 'orchid', price: 450000, unit: 'chậu' },
    { name: 'Hoa Lan Denrobium', category: 'orchid', price: 350000, unit: 'chậu' },
    { name: 'Hoa Huệ Trắng', category: 'lily', price: 200000, unit: 'bó 5 cành' },
    { name: 'Hoa Huệ Vàng', category: 'lily', price: 220000, unit: 'bó 5 cành' },
    { name: 'Hoa Cúc Vàng', category: 'daisy', price: 100000, unit: 'bó 20 cành' },
    { name: 'Hoa Cúc Trắng', category: 'daisy', price: 90000, unit: 'bó 20 cành' },
    { name: 'Hoa Hướng Dương', category: 'sunflower', price: 120000, unit: 'bó 5 cành' },
    { name: 'Hoa Tulip Đỏ', category: 'tulip', price: 250000, unit: 'bó 10 cành' },
    { name: 'Hoa Tulip Vàng', category: 'tulip', price: 260000, unit: 'bó 10 cành' },
    { name: 'Hoa Cẩm Chướng Hồng', category: 'carnation', price: 80000, unit: 'bó 15 cành' },
    { name: 'Hoa Cẩm Chướng Trắng', category: 'carnation', price: 75000, unit: 'bó 15 cành' },
    { name: 'Hoa Hồng Môn', category: 'rose', price: 300000, unit: 'chậu' },
    { name: 'Hoa Sen Đá', category: 'succulent', price: 50000, unit: 'chậu nhỏ' },
    { name: 'Hoa Thủy Tiên', category: 'narcissus', price: 150000, unit: 'bó 10 cành' },
    { name: 'Hoa Đồng Tiền', category: 'coin', price: 110000, unit: 'bó 15 cành' },
    { name: 'Hoa Hồng Sa Đéc Đỏ', category: 'rose', price: 200000, unit: 'bó 10 cành' },
    { name: 'Hoa Hồng Sa Đéc Vàng', category: 'rose', price: 220000, unit: 'bó 10 cành' },
    { name: 'Hoa Lan Mokara', category: 'orchid', price: 280000, unit: 'bó 7 cành' },
    { name: 'Hoa Baby Trắng', category: 'baby', price: 60000, unit: 'bó 10 cành' },
    { name: 'Hoa Cát Tường Tím', category: 'lisianthus', price: 130000, unit: 'bó 10 cành' },
    { name: 'Hoa Ly Ly Hồng', category: 'lily', price: 240000, unit: 'bó 5 cành' },
    { name: 'Hoa Hồng Phấn', category: 'rose', price: 170000, unit: 'bó 10 cành' },
    { name: 'Hoa Cúc Lưới', category: 'daisy', price: 95000, unit: 'bó 15 cành' },
    { name: 'Hoa Mẫu Đơn', category: 'peony', price: 400000, unit: 'bó 5 cành' },
    { name: 'Hoa Đào Ngày Tết', category: 'peach', price: 500000, unit: 'cành lớn' },
    { name: 'Hoa Mai Vàng', category: 'apricot', price: 480000, unit: 'chậu' },
    { name: 'Hoa Lavender', category: 'lavender', price: 140000, unit: 'bó 10 cành' },
];

// Vietnamese review templates
const REVIEW_TEMPLATES = [
    'Hoa rất tươi và đẹp! Giao hàng nhanh chóng.',
    'Chất lượng hoa tuyệt vời, đúng như mô tả!',
    'Rất hài lòng với sản phẩm. Sẽ ủng hộ lần sau.',
    'Hoa đẹp, giá cả hợp lý. Giao đúng hẹn.',
    'Tuyệt vời! Hoa tươi lâu hơn mong đợi.',
    'Đóng gói cẩn thận, hoa không bị hư hại.',
    'Chất lượng tốt, giá rẻ hơn shop.',
    'Hoa đẹp, ship nhanh, 5 sao!',
    'Rất đáng tiền! Sẽ giới thiệu cho bạn bè.',
    'Hoa Sa Đéc chất lượng thật sự khác biệt!',
    'Nông dân rất nhiệt tình và chu đáo.',
    'Lần đầu mua hoa online, rất ưng ý!',
    'Cảm ơn shop, hoa đẹp lắm!',
    'Hoa tươi, thơm, đẹp quá!',
    'Giá tốt, chất lượng cao. Ủng hộ nhiệt tình!',
    'Mua tặng người yêu, rất vui lòng!',
    'Đóng gói đẹp, ship cẩn thận.',
    'Hoa đúng như hình, rất hài lòng.',
    'Sẽ mua thường xuyên ở đây.',
    'Giá siêu rẻ so với thị trường!',
];

async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Create farmers
        console.log('👨‍🌾 Creating farmers...');
        const farmers = [];

        for (let i = 0; i < 10; i++) {
            const farmerData = {
                id: faker.string.uuid(),
                email: `farmer${i + 1}@sadec.vn`,
                name: FARMER_NAMES[i],
                phone: `0${faker.string.numeric(9)}`,
                address: SA_DEC_ADDRESSES[i],
                role: 'farmer',
                created_at: faker.date.past({ years: 2 }).toISOString(),
            };

            const { data, error } = await supabase
                .from('profiles')
                .upsert(farmerData, { onConflict: 'email' })
                .select()
                .single();

            if (error) {
                console.error(`Error creating farmer ${i + 1}:`, error);
            } else {
                farmers.push(data);
                console.log(`✅ Created: ${data.name}`);

                // Create farmer wallet
                await supabase.from('farmer_wallets').upsert({
                    farmer_id: data.id,
                    balance: faker.number.int({ min: 0, max: 5000000 }),
                    total_earned: faker.number.int({ min: 1000000, max: 20000000 }),
                });

                // Set specialties
                for (const specialty of SPECIALTIES[i]) {
                    await supabase.from('farmer_specialties').upsert({
                        farmer_id: data.id,
                        specialty,
                    });
                }
            }
        }

        console.log(`\n✅ Created ${farmers.length} farmers\n`);

        // 2. Create products
        console.log('🌸 Creating products...');
        const products = [];

        for (let i = 0; i < FLOWER_PRODUCTS.length; i++) {
            const product = FLOWER_PRODUCTS[i];
            const farmer = farmers[i % farmers.length]; // Distribute products across farmers

            const productData = {
                farmer_id: farmer.id,
                name: product.name,
                description: `${product.name} tươi, trồng và chăm sóc tại Sa Đéc. ${product.unit}.`,
                price: product.price,
                unit: product.unit,
                stock: faker.number.int({ min: 10, max: 100 }),
                image_url: `https://source.unsplash.com/400x400/?${product.category},flower`,
                category: product.category,
                featured: i < 6, // First 6 products are featured
                created_at: faker.date.past({ years: 1 }).toISOString(),
            };

            const { data, error } = await supabase
                .from('products')
                .insert(productData)
                .select()
                .single();

            if (error) {
                console.error(`Error creating product ${i + 1}:`, error);
            } else {
                products.push(data);
                console.log(`✅ ${data.name} - ${data.price.toLocaleString('vi-VN')}đ`);
            }
        }

        console.log(`\n✅ Created ${products.length} products\n`);

        // 3. Create sample buyers
        console.log('👥 Creating sample buyers...');
        const buyers = [];

        for (let i = 0; i < 5; i++) {
            const buyerData = {
                id: faker.string.uuid(),
                email: `buyer${i + 1}@example.com`,
                name: faker.person.fullName(),
                phone: `0${faker.string.numeric(9)}`,
                address: faker.location.streetAddress({ useFullAddress: true }) + ', TP.HCM',
                role: 'buyer',
                created_at: faker.date.past({ years: 1 }).toISOString(),
            };

            const { data, error } = await supabase
                .from('profiles')
                .upsert(buyerData, { onConflict: 'email' })
                .select()
                .single();

            if (error) {
                console.error(`Error creating buyer ${i + 1}:`, error);
            } else {
                buyers.push(data);
                console.log(`✅ ${data.name}`);
            }
        }

        console.log(`\n✅ Created ${buyers.length} buyers\n`);

        // 4. Create orders and reviews
        console.log('📦 Creating orders and reviews...');

        for (let i = 0; i < 15; i++) {
            const buyer = buyers[i % buyers.length];
            const product = products[faker.number.int({ min: 0, max: products.length - 1 })];
            const quantity = faker.number.int({ min: 1, max: 5 });
            const totalAmount = product.price * quantity;

            // Create order
            const orderData = {
                buyer_id: buyer.id,
                farmer_id: product.farmer_id,
                total_amount: totalAmount,
                status: faker.helpers.arrayElement(['completed', 'delivered', 'shipped']),
                delivery_address: buyer.address,
                delivery_phone: buyer.phone,
                created_at: faker.date.past({ years: 0.25 }).toISOString(), // Last 3 months
            };

            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();

            if (orderError) {
                console.error(`Error creating order ${i + 1}:`, orderError);
                continue;
            }

            // Create order items
            await supabase.from('order_items').insert({
                order_id: order.id,
                product_id: product.id,
                farmer_id: product.farmer_id,
                quantity,
                price: product.price,
            });

            console.log(`✅ Order #${i + 1}: ${quantity}x ${product.name}`);

            // Create review (80% chance)
            if (Math.random() > 0.2) {
                const rating = faker.number.int({ min: 4, max: 5 });
                const review = REVIEW_TEMPLATES[i % REVIEW_TEMPLATES.length];

                await supabase.from('reviews').insert({
                    order_id: order.id,
                    buyer_id: buyer.id,
                    farmer_id: product.farmer_id,
                    rating,
                    comment: review,
                    created_at: faker.date.between({
                        from: order.created_at,
                        to: new Date()
                    }).toISOString(),
                });

                console.log(`  ⭐ Review: ${rating} stars`);
            }
        }

        console.log('\n🎉 Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`✅ ${farmers.length} farmers`);
        console.log(`✅ ${products.length} products`);
        console.log(`✅ ${buyers.length} buyers`);
        console.log(`✅ 15 orders with reviews`);

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seed
seedDatabase();
