-- Rate limit configurations
CREATE TABLE IF NOT EXISTS rate_limit_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL UNIQUE,
    algorithm VARCHAR(20) DEFAULT 'sliding_window', -- sliding_window, token_bucket, fixed_window
    per_user_limit INT DEFAULT 1000,
    per_ip_limit INT DEFAULT 100,
    window_seconds INT DEFAULT 3600,
    refill_rate FLOAT, -- For token bucket
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit violations log
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL, -- user:{id}:{endpoint} or ip:{ip}:{endpoint}
    endpoint VARCHAR(255),
    user_id UUID REFERENCES users(id),
    ip_address INET,
    attempted_requests INT,
    limit_exceeded INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_key ON rate_limit_violations(key);
CREATE INDEX IF NOT EXISTS idx_violations_user ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_violations_created ON rate_limit_violations(created_at);
