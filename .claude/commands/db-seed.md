---
description: 🌱 DB Seed — Database Seeding, Sample Data, Fixtures
argument-hint: [--env=development] [--truncate]
---

**Think harder** để db seed: <$ARGUMENTS>

**IMPORTANT:** Seed data PHẢI reproducible — idempotent, không duplicate.

## Prisma Seed

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Users
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: '$2b$10$...',
    },
  });

  // Products
  const products = [
    { name: 'Starter', price: 9900, slug: 'starter' },
    { name: 'Growth', price: 29900, slug: 'growth' },
    { name: 'Premium', price: 99900, slug: 'premium' },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log('✅ Database seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

```bash
# === Run Seed ===
npx prisma db seed

# === Reset & Seed ===
npx prisma migrate reset --seed
```

## Rails Seed

```ruby
# db/seeds.rb
User.find_or_create_by!(email: 'admin@example.com') do |user|
  user.name = 'Admin User'
  user.password = 'SecurePassword123'
  user.role = 'admin'
end

Product.find_or_create_by!(slug: 'starter') do |product|
  product.name = 'Starter'
  product.price = 9900
end

puts "✅ Database seeded!"
```

```bash
# === Run Seed ===
rails db:seed

# === Reset & Seed ===
rails db:reset
```

## Idempotent Seeds

```typescript
// Always use upsert pattern
await prisma.model.upsert({
  where: { uniqueKey: 'value' },
  update: { /* fields to update */ },
  create: { /* fields to create */ },
});

// Or check existence first
const exists = await prisma.model.findUnique({
  where: { email: 'test@example.com' },
});

if (!exists) {
  await prisma.model.create({ data: {...} });
}
```

## Related Commands

- `/db-migrate` — Database migrations
- `/db-backup` — Database backup
- `/test` — Run tests
