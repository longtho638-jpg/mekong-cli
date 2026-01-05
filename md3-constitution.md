# 🏛️ The Material Design 3 Constitution

> **Effective Date**: 2026-01-02
> **Mandate**: 100% Strict Adherence to Google Material Components
> **Scope**: All Front-End Development

---

## Article I: The Law of Tokens

**1.1 No Magic Numbers**
The use of raw values (e.g., `16px`, `#ffffff`, `0.2s`) is strictly prohibited in component styles. All values must reference a Design Token.
*   ❌ `padding: 16px;`
*   ✅ `padding: var(--md-sys-spacing-4);`

**1.2 The Token Hierarchy**
1.  **Reference Tokens** (`md.ref.*`): Base values (e.g., `Palette.Neutral.10`).
2.  **System Tokens** (`md.sys.*`): Semantic roles (e.g., `color-surface`, `shape-corner-l`).
3.  **Component Tokens** (`md.comp.*`): Specific component overrides.

---

## Article II: The Law of Composition

**2.1 The Slot Pattern**
All components must encapsulate their internal structure and expose **Slots** for content.
```tsx
<MD3Card>
  <div slot="headline">Title</div>
  <div slot="content">Body</div>
  <div slot="action">Button</div>
</MD3Card>
```

**2.2 The State Layer**
Interaction states (Hover, Focus, Press) must be handled by a dedicated `state-layer` element, strictly following the M3 Opacity scale.
*   Hover: `opacity: 0.08`
*   Focus: `opacity: 0.12`
*   Press: `opacity: 0.12`

---

## Article III: The Law of Motion

**3.1 Standard Easing**
All UI transitions must use the **Standard Easing** (`cubic-bezier(0.2, 0, 0, 1)`).

**3.2 Emphasized Easing**
All expressive interactions (Hovers, Dialogs) must use **Emphasized Easing** (`cubic-bezier(0.2, 0, 0, 1.0)`).

---

## Article IV: The "God Tier" Amendment

**4.1 Crystal Void Compatibility**
While adherence to M3 architecture is mandatory, the **Visual Output** must maintain the "Crystal Void" aesthetic (Dark/Neon).
*   **Surface Tokens** map to `rgba(3, 3, 3, 0.8)` (Glass).
*   **Primary Tokens** map to `Violet-500` / `Cyan-500`.

---

**Signed,**
*AgencyOS Architect*
