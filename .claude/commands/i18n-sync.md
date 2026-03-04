---
description: 🌐 i18n Sync — Translation Key Sync, Missing Keys Detection, Locale Validation
argument-hint: [locales] [--fix] [--base=vi]
---

**Think harder** để i18n sync: <locales>$ARGUMENTS</locales>

**IMPORTANT:** Translation keys PHẢI đồng bộ giữa code và locale files — không hardcoded strings.

## i18n Tools

| Tool | Framework | Auto-Extract | CI Check | Best For |
|------|-----------|--------------|----------|----------|
| **i18next-parser** | React/Vue | ✅ | ✅ | JavaScript apps |
| **next-intl** | Next.js | ✅ | ✅ | Next.js projects |
| **vue-i18n** | Vue.js | ✅ | ✅ | Vue projects |
| **react-i18next** | React | ⚠️ Manual | ✅ | React apps |
| ** Lingui** | React/JS | ✅ | ✅ | Universal JS |

## i18next Parser

```bash
# === Install ===
npm install -D i18next-parser

# === Extract Keys from Code ===
npx i18next 'src/**/*.{ts,tsx}' --output 'src/locales/$LOCALE/$NAMESPACE.json'

# === Config File ===
npx i18next --config i18next-parser.config.js

# === Compare Keys ===
npx i18next-compare src/locales/vi.ts src/locales/en.ts

# === Find Missing Keys ===
npx i18next-missing src/locales/ --base vi
```

```javascript
// i18next-parser.config.js
module.exports = {
  contextSeparator: '_',
  createOldCatalogs: false,
  defaultNamespace: 'translation',
  defaultValue: (locale, namespace, key) => key,
  indentation: 2,
  keepRemoved: false,
  keySeparator: '.',
  lexers: {
    hbs: ['HandlebarsLexer'],
    handlebars: ['HandlebarsLexer'],
    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],
    mjs: ['JavascriptLexer'],
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    vue: ['VueLexer'],
  },
  lineEnding: 'auto',
  locales: ['vi', 'en'],
  namespaceSeparator: ':',
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  pluralSeparator: '_',
  input: 'src/**/*.{ts,tsx}',
  sort: true,
  verbose: true,
  failOnWarnings: true,
  failOnUpdate: true,
};
```

## Translation File Structure

```typescript
// src/locales/vi.ts
export default {
  common: {
    loading: 'Đang tải...',
    error: 'Đã xảy ra lỗi',
    success: 'Thành công',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    create: 'Tạo mới',
    update: 'Cập nhật',
  },
  navigation: {
    home: 'Trang chủ',
    products: 'Sản phẩm',
    pricing: 'Bảng giá',
    about: 'Giới thiệu',
    contact: 'Liên hệ',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    dashboard: 'Bảng điều khiển',
    settings: 'Cài đặt',
    profile: 'Hồ sơ',
    logout: 'Đăng xuất',
  },
  landing: {
    hero: {
      title: 'Hệ điều hành Agency RaaS',
      subtitle: 'Tăng doanh thu 10x với AI-powered platform',
      cta: 'Bắt đầu miễn phí',
    },
    features: {
      title: 'Tính năng',
      description: 'Everything you need to scale your agency',
    },
    pricing: {
      title: 'Bảng giá linh hoạt',
      description: 'Chọn gói phù hợp cho agency của bạn',
      tiers: {
        starter: {
          name: 'Starter',
          price: '99',
          description: 'Cho agency mới bắt đầu',
        },
        growth: {
          name: 'Growth',
          price: '299',
          description: 'Cho agency đang phát triển',
        },
        premium: {
          name: 'Premium',
          price: '999',
          description: 'Cho agency quy mô lớn',
        },
      },
    },
  },
  auth: {
    login: {
      title: 'Đăng nhập',
      email: 'Email',
      password: 'Mật khẩu',
      submit: 'Đăng nhập',
      forgot: 'Quên mật khẩu?',
      register: 'Chưa có tài khoản? Đăng ký',
    },
    register: {
      title: 'Đăng ký',
      name: 'Họ và tên',
      email: 'Email',
      password: 'Mật khẩu',
      confirmPassword: 'Xác nhận mật khẩu',
      submit: 'Đăng ký',
      login: 'Đã có tài khoản? Đăng nhập',
    },
  },
  errors: {
    required: 'Trường này là bắt buộc',
    invalid_email: 'Email không hợp lệ',
    min_length: 'Độ dài tối thiểu là {{min}} ký tự',
    max_length: 'Độ dài tối đa là {{max}} ký tự',
    password_mismatch: 'Mật khẩu không khớp',
    network_error: 'Lỗi kết nối mạng',
    unauthorized: 'Không có quyền truy cập',
    not_found: 'Không tìm thấy',
  },
} as const;
```

```typescript
// src/locales/en.ts
export default {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
  },
  navigation: {
    home: 'Home',
    products: 'Products',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
  },
  landing: {
    hero: {
      title: 'RaaS Agency Operating System',
      subtitle: '10x Revenue with AI-powered platform',
      cta: 'Get Started Free',
    },
    features: {
      title: 'Features',
      description: 'Everything you need to scale your agency',
    },
    pricing: {
      title: 'Flexible Pricing',
      description: 'Choose the plan for your agency',
      tiers: {
        starter: {
          name: 'Starter',
          price: '99',
          description: 'For new agencies',
        },
        growth: {
          name: 'Growth',
          price: '299',
          description: 'For growing agencies',
        },
        premium: {
          name: 'Premium',
          price: '999',
          description: 'For large agencies',
        },
      },
    },
  },
  auth: {
    login: {
      title: 'Login',
      email: 'Email',
      password: 'Password',
      submit: 'Login',
      forgot: 'Forgot password?',
      register: "Don't have an account? Register",
    },
    register: {
      title: 'Register',
      name: 'Full Name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      submit: 'Register',
      login: 'Already have an account? Login',
    },
  },
  errors: {
    required: 'This field is required',
    invalid_email: 'Invalid email address',
    min_length: 'Minimum length is {{min}} characters',
    max_length: 'Maximum length is {{max}} characters',
    password_mismatch: 'Passwords do not match',
    network_error: 'Network error',
    unauthorized: 'Unauthorized access',
    not_found: 'Not found',
  },
} as const;
```

## Sync Script

```bash
#!/bin/bash
# scripts/i18n-sync.sh

BASE_LOCALE="vi"
LOCALES_DIR="src/locales"

echo "🌐 i18n Sync Script"
echo "Base locale: $BASE_LOCALE"
echo "Locales dir: $LOCALES_DIR"

# Extract keys from code
echo ""
echo "=== Extracting keys from code ==="
npx i18next 'src/**/*.{ts,tsx}' --output "$LOCALES_DIR/\$LOCALE/translation.json"

# Compare locales
echo ""
echo "=== Comparing locales ==="
for locale in $(ls $LOCALES_DIR/*.ts | grep -v index); do
  LOCALE_NAME=$(basename "$locale" .ts)
  if [ "$LOCALE_NAME" != "$BASE_LOCALE" ]; then
    echo "Comparing $BASE_LOCALE vs $LOCALE_NAME:"
    npx i18next-compare "$LOCALES_DIR/$BASE_LOCALE.ts" "$LOCALES_DIR/$LOCALE_NAME.ts"
  fi
done

# Find missing keys
echo ""
echo "=== Finding missing keys ==="
npx i18next-missing "$LOCALES_DIR/" --base "$BASE_LOCALE"

echo ""
echo "✅ i18n sync complete!"
```

## TypeScript Type Safety

```typescript
// src/i18n/types.ts
import vi from '@/locales/vi';

export type Locale = typeof vi;
export type TranslationKey<
  T extends Record<string, any> = Locale,
  Prefix extends string = ''
> = {
  [K in keyof T]: T[K] extends Record<string, any>
    ? TranslationKey<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T];

// Usage: Type-safe t() function
export function t<Key extends TranslationKey>(
  key: Key,
  params?: Record<string, string | number>
): string {
  // Implementation
}
```

## CI/CD Check

```yaml
# .github/workflows/i18n-check.yml
name: i18n Sync Check

on:
  pull_request:
    branches: [main]

jobs:
  i18n:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Extract i18n keys
      run: npx i18next 'src/**/*.{ts,tsx}' --output 'src/locales/$LOCALE/translation.json'

    - name: Check for missing keys
      run: npx i18next-missing src/locales/ --base vi

    - name: Validate JSON files
      run: |
        for file in src/locales/*.json; do
          jq . "$file" > /dev/null || exit 1
        done
```

## Related Commands

- `/test` — Unit & integration tests
- `/review` — Code quality review
- `/docs:update` — Documentation updates
- `/build` — Build project
