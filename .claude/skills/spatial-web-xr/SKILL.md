# Spatial Web & XR — WebXR, AR Commerce, Immersive Experiences

Build immersive web experiences with WebXR, AR commerce, and spatial computing. $52B market by 2027, 30% CAGR.

## When to Use
- Building WebXR experiences (AR/VR in browser)
- Implementing AR product try-on for e-commerce
- Creating spatial UI for Apple Vision Pro / Meta Quest
- Building 3D collaborative workspaces

## Key Concepts
| Term | Meaning |
|------|---------|
| WebXR | Web API for AR/VR experiences in browser |
| SLAM | Simultaneous Localization and Mapping — spatial awareness |
| Spatial Anchor | Fixed point in real-world for AR content placement |
| Passthrough | See-through view mixing real + virtual in VR headsets |
| Hand Tracking | Controller-free input via hand gesture recognition |
| Scene Understanding | AI parsing of physical environment (planes, objects) |

## Core Modules
```
WebXR Runtime
  ├── Session management (immersive-ar, immersive-vr)
  ├── Input sources (controllers, hands, gaze)
  ├── Reference spaces (local, bounded, unbounded)
  └── Hit testing + ray casting

AR Commerce
  ├── Product 3D model viewer
  ├── AR try-on (furniture, fashion, cosmetics)
  ├── Spatial product catalog
  └── AR measurement tools

Spatial UI
  ├── 3D UI components (panels, menus, buttons)
  ├── Eye tracking + gaze input
  ├── Hand gesture vocabulary
  └── Spatial audio integration

Scene Management
  ├── glTF/USDZ model loading
  ├── Environment mapping
  ├── Occlusion handling
  └── Multi-user synchronization
```

## Key Integrations
| Category | Services |
|----------|---------|
| Rendering | Three.js, Babylon.js, A-Frame, PlayCanvas |
| Platforms | Apple Vision Pro (visionOS), Meta Quest, Magic Leap |
| 3D Models | Sketchfab, glTF, USDZ, Reality Composer |
| Cloud | 8th Wall, Niantic Lightship, Google ARCore |
| Commerce | Shopify AR, IKEA Place SDK |

## Implementation Patterns
```typescript
interface WebXRConfig {
  mode: 'immersive-ar' | 'immersive-vr' | 'inline';
  features: ('hit-test' | 'hand-tracking' | 'anchors' | 'plane-detection')[];
  renderer: 'three' | 'babylon' | 'aframe';
  fallback: 'model-viewer' | '3d-canvas' | 'none';
}

interface ARProduct {
  id: string;
  modelUrl: string; // glTF or USDZ
  scale: [number, number, number];
  placement: 'floor' | 'wall' | 'face' | 'hand';
  animations?: string[];
  variants?: { name: string; textureUrl: string }[];
}

interface SpatialAnchor {
  id: string;
  position: [number, number, number];
  orientation: [number, number, number, number]; // quaternion
  persistentId?: string;
  content: { type: string; data: unknown };
}
```

## SDK
`@agencyos/vibe-spatial-xr` — WebXR session management, AR commerce, spatial UI, 3D model loading
