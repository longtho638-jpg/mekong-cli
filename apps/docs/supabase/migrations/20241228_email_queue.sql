-- =============================================
-- EMAIL QUEUE SYSTEM
-- For scheduled onboarding emails
-- Created: 2024-12-26
-- =============================================

-- ===================
-- TABLE: email_queue
-- ===================
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    template TEXT NOT NULL,
    data JSONB DEFAULT '{}' NOT NULL,
    send_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT FALSE NOT NULL,
    sent_at TIMESTAMPTZ,
    error TEXT,
    order_id TEXT,
    retry_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_template CHECK (template <> ''),
    CONSTRAINT retry_limit CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Add comment for documentation
COMMENT ON TABLE email_queue IS 'Queue for scheduled emails (onboarding, notifications)';
COMMENT ON COLUMN email_queue.template IS 'Email template name: onboardingDay1, onboardingDay3, onboardingDay7';
COMMENT ON COLUMN email_queue.data IS 'JSON data passed to email template';
COMMENT ON COLUMN email_queue.retry_count IS 'Number of send attempts (max 5)';

-- ===================
-- INDEXES
-- ===================

-- Primary query: find unsent emails ready to send
CREATE INDEX IF NOT EXISTS idx_email_queue_pending 
    ON email_queue (send_at) 
    WHERE sent = FALSE;

-- Lookup by email for user email history
CREATE INDEX IF NOT EXISTS idx_email_queue_email 
    ON email_queue (email);

-- Lookup by order for order-related emails
CREATE INDEX IF NOT EXISTS idx_email_queue_order 
    ON email_queue (order_id) 
    WHERE order_id IS NOT NULL;

-- ===================
-- FUNCTIONS
-- ===================

-- Queue all onboarding emails for a new customer
CREATE OR REPLACE FUNCTION queue_onboarding_emails(
    p_email TEXT,
    p_name TEXT,
    p_order_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data JSONB;
BEGIN
    -- Build common data object once
    v_data := jsonb_build_object('name', COALESCE(p_name, 'there'));
    
    -- Insert all emails in a single statement (better performance)
    INSERT INTO email_queue (email, template, data, send_at, order_id)
    VALUES
        (p_email, 'onboardingDay1', v_data, NOW() + INTERVAL '1 day', p_order_id),
        (p_email, 'onboardingDay3', v_data, NOW() + INTERVAL '3 days', p_order_id),
        (p_email, 'onboardingDay7', v_data, NOW() + INTERVAL '7 days', p_order_id);
END;
$$;

COMMENT ON FUNCTION queue_onboarding_emails IS 'Queues Day 1, 3, 7 onboarding emails for new customers';

-- Mark email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(p_email_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE email_queue
    SET sent = TRUE, sent_at = NOW()
    WHERE id = p_email_id AND sent = FALSE;
END;
$$;

-- Mark email as failed (with retry logic)
CREATE OR REPLACE FUNCTION mark_email_failed(p_email_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE email_queue
    SET 
        error = p_error,
        retry_count = retry_count + 1,
        -- Schedule retry: 5min, 30min, 2hr, 12hr, 24hr
        send_at = CASE retry_count
            WHEN 0 THEN NOW() + INTERVAL '5 minutes'
            WHEN 1 THEN NOW() + INTERVAL '30 minutes'
            WHEN 2 THEN NOW() + INTERVAL '2 hours'
            WHEN 3 THEN NOW() + INTERVAL '12 hours'
            WHEN 4 THEN NOW() + INTERVAL '24 hours'
            ELSE send_at -- Max retries reached
        END
    WHERE id = p_email_id AND sent = FALSE;
END;
$$;

-- Get pending emails ready to send (with limit for batch processing)
CREATE OR REPLACE FUNCTION get_pending_emails(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    email TEXT,
    template TEXT,
    data JSONB,
    order_id TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT id, email, template, data, order_id
    FROM email_queue
    WHERE sent = FALSE 
      AND send_at <= NOW()
      AND retry_count < 5
    ORDER BY send_at ASC
    LIMIT p_limit;
$$;

-- ===================
-- ROW LEVEL SECURITY
-- ===================
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Service role only - no direct access from client
CREATE POLICY "Service role only" 
    ON email_queue
    FOR ALL 
    USING (auth.role() = 'service_role');

-- ===================
-- GRANTS
-- ===================
-- Functions are SECURITY DEFINER, so they run as owner
-- Service role can call them via RPC
