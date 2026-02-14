-- ============================================================================
-- AGRIOS: Adopt-a-Pot Subscription Table
-- IPO Revenue Stream: Monthly recurring revenue from virtual farming
-- ============================================================================

-- Create adoptions table
CREATE TABLE IF NOT EXISTS public.adoptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User info (can be linked to profiles or standalone)
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT,
    
    -- Plant info
    plant_id TEXT NOT NULL, -- 'cuc-mam-xoi', 'hong-sa-dec', 'mai-vang', 'lan-ho-diep'
    plant_name TEXT NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 4,
    
    -- Pricing
    monthly_price INTEGER NOT NULL, -- VND
    total_price INTEGER GENERATED ALWAYS AS (monthly_price * duration_months) STORED,
    
    -- Payment
    payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payos_order_id TEXT,
    paid_at TIMESTAMPTZ,
    
    -- Subscription status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    started_at TIMESTAMPTZ,
    expected_harvest_date DATE,
    
    -- Farmer assignment
    farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    garden_id UUID,
    
    -- Tracking
    message TEXT, -- Customer notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for common queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_adoptions_user_id ON public.adoptions(user_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_farmer_id ON public.adoptions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_status ON public.adoptions(status);
CREATE INDEX IF NOT EXISTS idx_adoptions_payment_status ON public.adoptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_adoptions_created_at ON public.adoptions(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own adoptions
CREATE POLICY "Users can view own adoptions"
    ON public.adoptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert new adoptions
CREATE POLICY "Users can create adoptions"
    ON public.adoptions
    FOR INSERT
    WITH CHECK (true); -- Allow anonymous adoptions

-- Farmers can view adoptions assigned to them
CREATE POLICY "Farmers can view assigned adoptions"
    ON public.adoptions
    FOR SELECT
    USING (auth.uid() = farmer_id);

-- Admins can do everything
CREATE POLICY "Admins full access to adoptions"
    ON public.adoptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_adoptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_adoptions_updated_at ON public.adoptions;
CREATE TRIGGER trigger_adoptions_updated_at
    BEFORE UPDATE ON public.adoptions
    FOR EACH ROW EXECUTE FUNCTION update_adoptions_updated_at();

-- ============================================================================
-- Sample data for testing
-- ============================================================================
-- INSERT INTO public.adoptions (customer_name, customer_phone, plant_id, plant_name, monthly_price, duration_months, status, payment_status)
-- VALUES
--     ('Nguyễn Văn A', '0901234567', 'cuc-mam-xoi', 'Cúc Mâm Xôi', 99000, 4, 'active', 'paid'),
--     ('Trần Thị B', '0912345678', 'hong-sa-dec', 'Hồng Sa Đéc', 149000, 6, 'pending', 'pending');

COMMENT ON TABLE public.adoptions IS 'Virtual farming subscriptions - Adopt-a-Pot feature for recurring revenue';
