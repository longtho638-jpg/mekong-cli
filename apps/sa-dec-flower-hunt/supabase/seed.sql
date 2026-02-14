-- SEED DATA (Run in Supabase Dashboard SQL Editor)
-- This script populates the database with the initial "WOW" content from the Business Plan.

-- 1. Create Hacky Helper to create users (Since we can't hash passwords easily in pure SQL without pgcrypto)
-- NOTE: This assumes 'pgcrypto' extension is enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert Users (Farmers)
-- We use fixed UUIDs to make relationships easy
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin, aud)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000000', 'farmer1@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chú Nguyễn Văn Thanh"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', '00000000-0000-0000-0000-000000000000', 'farmer2@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anh Hoàng Văn Nam"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '00000000-0000-0000-0000-000000000000', 'farmer3@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Cô Nguyễn Thị Lan"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '00000000-0000-0000-0000-000000000000', 'farmer4@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chị Trần Thị Nga"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '00000000-0000-0000-0000-000000000000', 'farmer5@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anh Lê Văn Tuấn"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '00000000-0000-0000-0000-000000000000', 'farmer5@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anh Lê Văn Tuấn"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '00000000-0000-0000-0000-000000000000', 'farmer6@sadec.local', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bác Ba Đời"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),

    -- Demo Accounts (Official) - Password '123456'
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', '00000000-0000-0000-0000-000000000000', 'admin@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Executive Admin"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', '00000000-0000-0000-0000-000000000000', 'farmer@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nông Dân Demo"}', NOW(), NOW(), 'authenticated', false, 'authenticated'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', '00000000-0000-0000-0000-000000000000', 'customer@demo.com', crypt('123456', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Khách Hàng Demo"}', NOW(), NOW(), 'authenticated', false, 'authenticated')
ON CONFLICT (id) DO UPDATE SET 
    aud = EXCLUDED.aud,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

-- 3. Insert Profiles (Linked to Users)
INSERT INTO public.profiles (id, role, full_name, address, avatar_url)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'farmer', 'Chú Nguyễn Văn Thanh', 'Ấp Tân Quy Đông, Sa Đéc', 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'farmer', 'Anh Hoàng Văn Nam', 'Phường 1, Sa Đéc', 'https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'farmer', 'Cô Nguyễn Thị Lan', 'Xã Tân Khánh Đông', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'farmer', 'Chị Trần Thị Nga', 'Làng hoa Sa Đéc', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'farmer', 'Anh Lê Văn Tuấn', 'Xã An Hòa', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'farmer', 'Bác Ba Đời', 'Vùng lõi Làng hoa', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200'),
    
    -- Demo Accounts (Official)
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'admin', 'Executive Admin', 'HQ Agri-OS, Sa Đéc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'farmer', 'Nông Dân Demo', 'Vườn Mẫu, Sa Đéc', 'https://api.dicebear.com/7.x/avataaars/svg?seed=farmer'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'customer', 'Khách Hàng Demo', 'TP. Hồ Chí Minh', 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 4. Insert Products (Linked to Farmers)
-- Note: 'images' is an array TEXT[]
INSERT INTO public.products (farmer_id, name, description, price, category, status, stock_level, images, metadata)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Cúc Mâm Xôi', 'Form to, chưng được 2 tuần không héo. Đăng ký nhận báo giá sỉ 2026!', 150000, 'flower', 'active', 100, ARRAY['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=600'], '{"vibe": "Tiền Vô Như Nước 💰", "origin": "Sa Đéc, Đồng Tháp", "sizes": ["S", "M", "L", "XL"]}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Hoa Hồng Sa Đéc', 'Giống hồng độc quyền Sa Đéc, cánh dày, thơm lâu. HOT Tết 2026!', 80000, 'flower', 'active', 50, ARRAY['https://images.unsplash.com/photo-1548586196-aa5803b77379?q=80&w=600'], '{"vibe": "Tình Duyên Phơi Phới 💕", "origin": "Làng hoa Sa Đéc", "sizes": ["S", "M", "L"]}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Vạn Thọ Pháp', 'Màu cam rực rỡ, ý nghĩa trường thọ. Quà Tết cho bố mẹ!', 50000, 'flower', 'active', 200, ARRAY['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600'], '{"vibe": "Sống Lâu Trăm Tuổi 🐢", "origin": "Sa Đéc, Đồng Tháp", "sizes": ["S", "M", "L", "XL"]}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Hoa Giấy Đỏ', 'Dễ chăm, nở quanh năm. Phong thủy cực tốt cho nhà mới!', 120000, 'flower', 'active', 30, ARRAY['https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=600'], '{"vibe": "Rực Rỡ Quanh Năm 🌈", "origin": "Làng hoa Sa Đéc", "sizes": ["M", "L", "XL"]}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Cát Tường', 'Tên Cát Tường = Điềm Lành. Ai cũng cần một chậu trong nhà!', 70000, 'flower', 'active', 80, ARRAY['https://images.unsplash.com/photo-1494972308805-463bc619d34e?q=80&w=600'], '{"vibe": "May Mắn Tràn Trề ✨", "origin": "Sa Đéc, Đồng Tháp", "sizes": ["S", "M", "L"]}'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Mai Vàng', 'Mai Vàng chính gốc miền Tây. Nở đúng Mùng 1 Tết!', 200000, 'flower', 'active', 10, ARRAY['https://images.unsplash.com/photo-1455659817273-f96807779a8a?q=80&w=600'], '{"vibe": "Xuân Về Ngập Tràn 🌼", "origin": "Làng hoa Sa Đéc", "sizes": ["S", "M", "L", "XL"]}');

-- 5. Confirmation
SELECT count(*) as products_created FROM products;
