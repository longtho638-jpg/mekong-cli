# Spatial Computing & XR Platforms

AR/VR/MR enterprise tools, digital twin integration, spatial UX for Android XR and Apple Vision Pro.

## When to Use
- Building AR/VR/MR experiences for enterprise or consumer
- Digital twin synchronization with physical environments
- Spatial UI components for Android XR, visionOS
- Multi-device deployment and fleet management
- 3D asset pipeline and streaming optimization

## Key Patterns
- **Frameworks**: WebXR, ARKit, ARCore, Unity, Unreal, Three.js
- **Protocols**: OpenXR, glTF/GLB, USD, MPEG-I
- **Spatial UX**: gaze tracking, hand tracking, voice commands, spatial anchors
- **Digital Twins**: IoT sensor fusion, BIM integration, real-time sync

## Architecture
```
XR App → Spatial Scene Manager → Asset Streaming CDN
  ↓            ↓                      ↓
Hand/Gaze   Digital Twin Sync    3D Asset Pipeline
Tracking      (IoT ↔ Virtual)     (glTF optimization)
  ↓
Spatial Analytics → User Behavior Heatmaps
```

## SDK
`@agencyos/vibe-spatial` — spatial scene management, device fleet, digital twin sync hooks
