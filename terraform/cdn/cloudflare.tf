terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain_name" {
  description = "Domain name"
  type        = string
  default     = "mekong-cli.com"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# DNS Records
resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  value   = var.domain_name
  type    = "CNAME"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  value   = "api-origin.${var.domain_name}" # Assuming origin setup elsewhere
  type    = "CNAME"
  proxied = true
}

# SSL/TLS Settings
resource "cloudflare_zone_settings_override" "main" {
  zone_id = var.zone_id
  settings {
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"
    ssl                      = "strict"
    min_tls_version          = "1.2"
    http3                    = "on"
    brotli                   = "on"
    always_use_https         = "on"
    # Optimization
    minify {
      css  = "on"
      js   = "on"
      html = "on"
    }
    rocket_loader = "on"
  }
}

# Cache Rules (Page Rules)
# 1. Cache Static Assets (Long TTL)
resource "cloudflare_page_rule" "static_assets" {
  zone_id  = var.zone_id
  target   = "*${var.domain_name}/static/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 31536000 # 1 year
    browser_cache_ttl = 31536000
  }
}

# 2. Cache Images (Long TTL)
resource "cloudflare_page_rule" "images" {
  zone_id  = var.zone_id
  target   = "*${var.domain_name}/images/*"
  priority = 2

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 31536000
    browser_cache_ttl = 31536000
  }
}

# 3. API - Respect Headers
resource "cloudflare_page_rule" "api" {
  zone_id  = var.zone_id
  target   = "*${var.domain_name}/api/*"
  priority = 3

  actions {
    cache_level = "bypass"
    # We will control API caching via Cache-Control headers from origin
  }
}

# 4. Next.js Data - Standard
resource "cloudflare_page_rule" "next_data" {
  zone_id = var.zone_id
  target  = "*${var.domain_name}/_next/data/*"
  priority = 4

  actions {
    cache_level = "standard"
  }
}
