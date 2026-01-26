# Phase 3: Frontend Widget Core

> **Priority**: High
> **Status**: Pending

## Objectives
Build the user-facing widget that embeds on client websites, ensuring minimal performance impact and style isolation.

## Requirements

### Widget UI
- [ ] Floating trigger button (customizable position)
- [ ] Main modal/popover
- [ ] Feedback form (Email, Message, Type)
- [ ] Loading & Success states

### Architecture
- [ ] Web Component or Shadow DOM to prevent CSS bleeding
- [ ] State management (Zustand or Context)
- [ ] Configuration (API Key, Colors, Position) passed via init script

### Embed Script
- [ ] Lightweight loader script
- [ ] Async loading of main bundle

## Implementation Steps

1. **Embed Logic**
   - Create `loader.js` that inserts the widget into DOM
   - Expose global `window.FeedbackWidget` object with `init()` method

2. **UI Components**
   - `TriggerButton`: The floating action button
   - `WidgetWindow`: The main container
   - `FeedbackForm`: Inputs for user data

3. **Style Isolation**
   - Use `ShadowRoot` to encapsulate styles
   - Ensure Tailwind classes don't conflict with host site

4. **Configuration**
   - Accept config object in `init({ apiKey: '...', color: '...' })`
   - Store config in state

## Todo List
- [ ] Loader Script
- [ ] Shadow DOM Wrapper
- [ ] UI Components (Trigger, Modal, Form)
- [ ] Configuration Logic
- [ ] Mobile Responsiveness

## Success Criteria
- Widget renders correctly on external sites
- Styles are isolated (no conflicts)
- Configurable via JS parameters
- Smooth open/close animations
