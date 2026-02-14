-- Clean Reset for Farmer 1 (Cascade Delete Version)
-- Fixes foreign key constraint violations.

BEGIN;

    -- 1. Variables
    -- User ID for 'farmer1@sadec.local' is fixed in our seed:
    -- 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

    -- 2. Delete Child Records First (Reverse Dependency Order)

    -- 2.1 Delete Order Items linked to this Farmer's Products
    DELETE FROM public.order_items 
    WHERE product_id IN (
        SELECT id FROM public.products 
        WHERE farmer_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    );
    -- Also delete items if there's a direct seller_id link (if schema uses it)
    DELETE FROM public.order_items WHERE seller_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- 2.2 Delete Products owned by this Farmer
    DELETE FROM public.products 
    WHERE farmer_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- 2.3 Delete Orders made BY this user (as a buyer, if any)
    -- First delete items of those orders
    DELETE FROM public.order_items 
    WHERE order_id IN (
        SELECT id FROM public.orders WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    );
    DELETE FROM public.orders 
    WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- 2.4 Delete Profile ( The immediate blocker )
    DELETE FROM public.profiles 
    WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    -- 3. Delete the User from Auth
    DELETE FROM auth.users 
    WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    -- Fallback by email just in case ID didn't match somehow
    DELETE FROM auth.users WHERE email = 'farmer1@sadec.local';

    -- 4. Re-insert User
    INSERT INTO auth.users (
        id, 
        instance_id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        raw_app_meta_data, 
        raw_user_meta_data, 
        created_at, 
        updated_at, 
        role, 
        aud, 
        is_super_admin
    )
    VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        '00000000-0000-0000-0000-000000000000', 
        'farmer1@sadec.local', 
        crypt('password123', gen_salt('bf')), 
        NOW(), 
        '{"provider":"email","providers":["email"]}', 
        '{"full_name":"Chú Nguyễn Văn Thanh"}', 
        NOW(), 
        NOW(), 
        'authenticated', 
        'authenticated', 
        false
    );

    -- 5. Re-insert Profile
    INSERT INTO public.profiles (id, role, full_name, address, avatar_url)
    VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        'farmer', 
        'Chú Nguyễn Văn Thanh', 
        'Ấp Tân Quy Đông, Sa Đéc', 
        'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200'
    );

    -- 6. Re-insert a Sample Product (So dashboard isn't empty)
    INSERT INTO public.products (farmer_id, name, description, price, category, status, stock_level, images, metadata)
    VALUES (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
        'Cúc Mâm Xôi (Demo)', 
        'Sản phẩm demo sau khi reset.', 
        150000, 
        'flower', 
        'active', 
        100, 
        ARRAY['https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=600'], 
        '{"vibe": "Tiền Vô Như Nước 💰", "origin": "Sa Đéc"}'
    );

COMMIT;

SELECT 'Reset Successful' as status;
