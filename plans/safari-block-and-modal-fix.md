# 🎯 MISSION: Fix ANIMA 119 Modal + Cross-Project Safari Block

## Context

- **Date**: 2026-02-08
- **Priority**: HIGH - Blocks production readiness
- **Delegated to**: CC CLI

---

## BUG 1: ANIMA 119 Persistent Login Modal

### Symptom

Login modal auto-opens on every page load. Cannot be closed with Escape. Blocking all user interaction.

### Root Cause Analysis (Antigravity Investigation)

**Key Finding**: The `Dialog` component (`src/components/ui/dialog.tsx`) uses the native HTML `<dialog>` element with `dialog.showModal()`.

```typescript
// dialog.tsx lines 35-44
React.useEffect(() => {
  const dialog = dialogRef.current;
  if (!dialog) return;
  if (isOpen) {
    dialog.showModal();
  } else {
    dialog.close();
  }
}, [isOpen]);
```

**The `<dialog>` element is ALWAYS mounted in the DOM** even when `isOpen=false`, because `AuthButton` renders `<AuthModal>` unconditionally in the Fragment:

```tsx
// auth-button.tsx lines 109-136 (when user is NOT logged in)
return (
  <>
    {/* Button here */}
    <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
  </>
);
```

**There are TWO `AuthButton` instances** rendering simultaneously:

1. `TopAppBar` → `<AuthButton />` (icon variant)
2. `NavigationDrawer` → `<AuthButton variant="full" />`

**Suspected trigger**: React hydration mismatch or SSR-to-CSR state desync. When Next.js hydrates the page, the `<dialog>` element may be auto-shown by the browser's native behavior, OR the `useEffect` for `isOpen` may fire incorrectly during the hydration cycle causing `showModal()` to be called even when `isOpen` is `false`.

### Fix Plan

#### Option A: Conditional Render (RECOMMENDED - fastest)

Don't mount `<AuthModal>` until it's needed:

```tsx
// auth-button.tsx - change the Fragment at bottom
return (
  <>
    {/* Button here */}
    {isModalOpen && (
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    )}
  </>
);
```

#### Option B: Fix Dialog component

Add a guard to prevent `showModal()` during SSR/hydration:

```tsx
// dialog.tsx
const [mounted, setMounted] = React.useState(false);

React.useEffect(() => {
  setMounted(true);
}, []);

React.useEffect(() => {
  if (!mounted) return;
  const dialog = dialogRef.current;
  if (!dialog) return;
  if (isOpen) {
    dialog.showModal();
  } else {
    dialog.close();
  }
}, [isOpen, mounted]);
```

#### Option C: Both A + B for defense-in-depth

### Verification

1. `npm run dev` on port 3001
2. Visit http://localhost:3001/vi/
3. Confirm: NO modal auto-appears
4. Click person icon → modal DOES open
5. Close modal → modal STAYS closed
6. Navigate to other pages → NO modal auto-appears

---

## BUG 2: Safari Blocking All Projects Except AgencyOS

### Symptom

All projects (Well/84tea/Apex-OS/ANIMA 119) are blocked on Safari, but `agencyos-landing` works fine.

### Cross-Project Security Header Comparison

| Project                 | CSP Location             | `upgrade-insecure-requests` | `form-action`             | `frame-ancestors` |
| ----------------------- | ------------------------ | --------------------------- | ------------------------- | ----------------- |
| **agencyos-landing** ✅ | `next.config.ts` inline  | YES                         | `'self' https://polar.sh` | `'none'`          |
| **84tea** ❌            | `security-headers.ts`    | YES                         | `'self'`                  | `'none'`          |
| **anima119** ❌         | `security-headers.ts`    | YES                         | `'self'`                  | `'none'`          |
| **apex-os** ❌          | `next.config.mjs` inline | NO                          | `'self'`                  | `'self' telegram` |

### Key Difference: `upgrade-insecure-requests`

**The `upgrade-insecure-requests` CSP directive forces ALL HTTP requests to be upgraded to HTTPS.** On localhost (which is HTTP), Safari strictly enforces this and **blocks the page entirely** because it cannot upgrade `http://localhost:3000` to `https://localhost:3000`.

**AgencyOS also has `upgrade-insecure-requests` but may be working due to**:

1. Different Safari version behavior
2. Being accessed via a different URL
3. OR Safari may be blocking it too (user should confirm)

### Root Cause

**`upgrade-insecure-requests` in CSP breaks localhost on Safari.** Chrome is more lenient with localhost, but Safari treats it as a real insecure origin and blocks mixed content.

### Fix Plan

#### For ALL projects with `security-headers.ts`:

Make `upgrade-insecure-requests` production-only:

```typescript
// security-headers.ts
const cspDirectives = [
  "default-src 'self'",
  // ... other directives ...
  "frame-ancestors 'none'",
  // Only upgrade in production
  ...(process.env.NODE_ENV === "production"
    ? ["upgrade-insecure-requests"]
    : []),
].join("; ");
```

#### Affected files:

- `/apps/84tea/src/lib/security-headers.ts`
- `/apps/anima119/src/lib/security-headers.ts`
- `/apps/agencyos-landing/next.config.ts`

### Verification

1. After fix, open each project in Safari
2. Confirm pages load without blocking
3. Verify production build still includes `upgrade-insecure-requests`

---

## Execution Order

1. **Fix ANIMA 119 Modal** (Option A - conditional render) → 2 minutes
2. **Fix Safari CSP** across all projects → 5 minutes
3. **Verify** both fixes in browser → 3 minutes

Total estimated: **10 minutes**

---

## Reference: AgencyOS Working Pattern

AgencyOS (`apps/agencyos-landing`) works because:

1. CSP is inline in `next.config.ts` (simpler, fewer indirections)
2. No `<dialog>` based auth modals that could hydration-mismatch
3. Uses Polar.sh for payments rather than Supabase Auth + custom modals

## CC CLI Task Command

```
Fix the persistent login modal in apps/anima119 and the Safari CSP blocking issue across all projects.

For the modal: In src/components/auth/auth-button.tsx, wrap the <AuthModal> in a conditional: {isModalOpen && <AuthModal ... />}

For Safari CSP: In apps/84tea/src/lib/security-headers.ts and apps/anima119/src/lib/security-headers.ts, make "upgrade-insecure-requests" conditional on NODE_ENV === 'production'. Same for apps/agencyos-landing/next.config.ts.

Verify the ANIMA119 fix by running dev server and confirming no auto-modal on page load.
```
