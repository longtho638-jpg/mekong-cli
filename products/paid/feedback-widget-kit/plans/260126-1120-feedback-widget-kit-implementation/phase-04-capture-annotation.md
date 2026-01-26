# Phase 4: Screenshot & Annotation Engine

> **Priority**: Critical
> **Status**: Pending

## Objectives
Implement the "killer feature": capturing the user's screen and allowing them to annotate it (draw arrows, highlight bugs).

## Requirements

### Capture
- [ ] Use `html2canvas` to capture DOM
- [ ] Handle cross-origin images (proxy or CORS handling)
- [ ] Exclude widget UI from screenshot

### Annotation
- [ ] Canvas overlay on captured image
- [ ] Tools: Pen, Arrow, Rectangle, Text, Blur/Obfuscate
- [ ] Undo/Redo functionality

### Processing
- [ ] Convert canvas to Blob/File
- [ ] Compress image before upload

## Implementation Steps

1. **Capture Logic**
   - Implement `captureScreen()` function
   - Hide widget temporarily during capture
   - Handle high DPI displays

2. **Annotation Editor**
   - Integrate annotation library (Fabric.js, Konva, or custom canvas logic)
   - Create toolbar UI (Pen, Color, Shape)
   - Implement drawing logic

3. **Data Handling**
   - Merge drawing layer with screenshot layer
   - Export to `image/png` or `image/jpeg`
   - Attach to form submission

## Challenges
- **iFrames**: html2canvas struggles with iframes. Document limitations.
- **CSS Grid/Flex**: Ensure capture accuracy.
- **Performance**: Heavy DOMs might take time to capture. Add loading indicators.

## Todo List
- [ ] HTML2Canvas Integration
- [ ] Canvas Editor Component
- [ ] Drawing Tools Implementation
- [ ] Image Export Logic
- [ ] Cross-browser Testing

## Success Criteria
- Accurate screenshot capture
- Smooth drawing experience
- Correct image export and upload
