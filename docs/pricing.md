# Pricing & Licensing

Mekong CLI offers three distinct pricing tiers designed to meet the needs of individuals, professionals, and enterprise teams.

## Pricing Tiers

| Feature | FREE | PRO ($49/mo) | ENTERPRISE ($499/mo) |
|---------|------|-------------|---------------------|
| Trades/day | 5 | Unlimited | Unlimited |
| Signals/day | 3 | Unlimited | Unlimited |
| API calls/day | 100 | 10,000 | 100,000 |
| Strategies | Basic RSI+SMA | All built-in | Custom + private |
| Self-healing | — | Standard | Priority + SLA |
| Support | Community | Email | Dedicated |
| Max Concurrent Steps | 1 | 4 | 16 |
| Parallel Execution | No | Yes | Yes |
| DAG Scheduling | No | Yes | Yes |
| Custom Agents | No | No | Yes |
| Priority Queue | No | No | Yes |
| Task Profiles | Simple only | All profiles | All profiles + custom |

## Feature Comparison Matrix

### Execution Capabilities
| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Parallel Execution | ❌ | ✅ | ✅ |
| DAG Scheduling | ❌ | ✅ | ✅ |
| Max Concurrent Steps | 1 | 4 | 16 |
| Task Profiles Supported | Simple only | All profiles | All profiles + custom |
| Custom Task Profiles | ❌ | ❌ | ✅ |

### Agent Capabilities
| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Custom Agents | ❌ | ❌ | ✅ |
| Priority Queue | ❌ | ❌ | ✅ |
| Swarm Mode | ❌ | ❌ | ✅ |
| Custom Agent Development | ❌ | ❌ | ✅ |

### Development Features
| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Self-Healing | ❌ | ✅ | ✅ |
| All Built-in Strategies | ❌ | ✅ | ✅ |
| Custom/Private Strategies | ❌ | ❌ | ✅ |
| Advanced Debugging | ❌ | ❌ | ✅ |
| Performance Profiling | ❌ | ❌ | ✅ |

### Support & SLA
| Feature | FREE | PRO | ENTERPRISE |
|---------|------|-----|------------|
| Response Time | Community | <24h | <4h |
| Dedicated Support | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | ✅ |
| Technical Account Manager | ❌ | ❌ | ✅ |
| Priority Issue Resolution | ❌ | ❌ | ✅ |

## License Management

### Activation
To activate a paid tier, set the `RAAS_LICENSE_KEY` environment variable:

```bash
export RAAS_LICENSE_KEY=your-license-key
mekong cook "Deploy production API"
```

### Validation
You can validate your license using the CLI:

```bash
mekong license validate
mekong license status
mekong license tiers
```

### Usage Tracking
Each tier includes usage tracking capabilities:

```bash
# Check current usage
mekong license usage

# Reset usage counters (admin only)
mekong license usage --reset
```

## API Access

License keys provide API access to various services:

- **Gateway Access**: RaaS Gateway integration for remote execution
- **Feature Gates**: Tier-based feature access control
- **Usage Metering**: Real-time usage tracking and billing
- **Entitlement Checks**: Permission verification for restricted features

## Billing Information

### Payment Processing
- Payments are processed through Polar.sh
- Recurring billing based on monthly cycle
- Usage-based billing for enterprise accounts
- VAT/sales tax calculated at checkout

### Cancellation Policy
- Cancel anytime, no penalty
- Access continues until end of billing period
- No refunds for partial months
- Enterprise contracts may have different terms

### Enterprise Customization
Enterprise accounts can request custom features:
- Private agent deployment
- On-premise infrastructure
- Custom SLA agreements
- Dedicated support channels
- API rate limit increases

## Free Tier Limitations

The free tier is designed for individual developers and testing:

- Limited concurrent execution
- Basic feature access
- Community support only
- Reduced API rate limits
- No premium features

For production use, we recommend upgrading to PRO or ENTERPRISE tier to access all features and receive proper support.