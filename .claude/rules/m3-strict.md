---
title: "Rule: MD3 Strict Mode"
priority: P2
tags: [ui, design, material-design-3]
agents: [ui-ux-designer, frontend-developer]
---

# 🎨 Rule: MD3 Strict Mode

> **Reference:** https://m3.material.io/

All UI components MUST adhere to Material Design 3 guidelines.

## 1. Component Usage
*   ❌ `div className="card"`
*   ✅ `<MD3Card variant="elevated">`

*   ❌ `button className="btn-primary"`
*   ✅ `<MD3Button variant="filled">`

## 2. Design Tokens
*   ❌ `bg-white`, `text-black`
*   ✅ `bg-[var(--md-sys-color-surface)]`, `text-[var(--md-sys-color-on-surface)]`

*   ❌ `rounded-lg`
*   ✅ `rounded-[var(--md-sys-shape-corner-medium)]`

## 3. Typography
*   Use standard classes: `m3-display-large`, `m3-headline-large`, `m3-body-large`.

## 4. Icons
*   Use `lucide-react` but styled with `text-[var(--md-sys-color-primary)]`.
