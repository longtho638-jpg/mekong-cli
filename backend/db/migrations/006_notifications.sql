-- Migration 006: Notification System
-- Description: Create tables for notifications, preferences, deliveries, and templates
-- Author: Antigravity
-- Date: 2026-01-28

-- 1. User Notification Preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    channels JSONB DEFAULT '{"system_updates": ["email", "push"], "payment_alerts": ["email", "sms", "push"], "audit_logs": ["email"]}'::jsonb,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start VARCHAR(5) DEFAULT '22:00',
    quiet_hours_end VARCHAR(5) DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_notification_prefs_user_id ON user_notification_preferences(user_id);

-- 2. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 4. Notification Deliveries (Logs)
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    provider VARCHAR(50),
    provider_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX idx_notification_deliveries_created_at ON notification_deliveries(created_at DESC);

-- 5. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_name ON notification_templates(name);
CREATE INDEX idx_notification_templates_type ON notification_templates(type);

-- Triggers for updated_at
CREATE TRIGGER update_user_notification_prefs_updated_at BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for inbox/bell icon';
COMMENT ON TABLE user_notification_preferences IS 'User settings for notification channels and quiet hours';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions';
COMMENT ON TABLE notification_deliveries IS 'Audit log of notification dispatch attempts';
COMMENT ON TABLE notification_templates IS 'Email and message templates';
