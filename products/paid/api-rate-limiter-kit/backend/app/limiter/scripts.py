# Fixed Window Counter
# KEYS[1]: The rate limit key (e.g., "rate_limit:ip:127.0.0.1")
# ARGV[1]: Window size in seconds (ttl)
# ARGV[2]: Limit count
# Returns: {allowed (1/0), current_count, ttl}

FIXED_WINDOW_SCRIPT = """
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])

local current = redis.call("INCR", key)

if current == 1 then
    redis.call("EXPIRE", key, window)
end

local ttl = redis.call("TTL", key)

if current > limit then
    return {0, current, ttl}
else
    return {1, current, ttl}
end
"""

# Sliding Window Log (ZSET)
# KEYS[1]: The rate limit key
# ARGV[1]: Current timestamp (score)
# ARGV[2]: Window size in seconds
# ARGV[3]: Limit count
# ARGV[4]: Unique member identifier (usually timestamp + random)
# Returns: {allowed (1/0), current_count, ttl}

SLIDING_WINDOW_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local clear_before = now - window

-- Remove old entries
redis.call("ZREMRANGEBYSCORE", key, "-inf", clear_before)

-- Count current
local count = redis.call("ZCARD", key)

if count < limit then
    -- Add new request
    redis.call("ZADD", key, now, member)
    redis.call("EXPIRE", key, window)
    return {1, count + 1, window}
else
    -- Blocked
    local ttl = redis.call("TTL", key)
    return {0, count, ttl}
end
"""
