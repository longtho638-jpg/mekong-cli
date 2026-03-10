# Neuroscience BCI — Skill

> Build brain-computer interface systems: EEG pipelines, neurofeedback apps, and cognitive tracking platforms.

## When to Activate
- Working with EEG/MEG/fNIRS hardware SDKs or raw neural data files
- Building neurofeedback or cognitive state monitoring applications
- Designing data pipelines for brain signal acquisition and classification
- Integrating BCI devices (Emotiv, Muse, OpenBCI, Neurosity) into software

## Core Capabilities
| Area | Description |
|------|-------------|
| Signal Acquisition | Stream raw EEG from hardware via LSL, BLE, or USB SDK |
| Preprocessing | Bandpass filtering, ICA artifact removal, epoch segmentation |
| Feature Extraction | Power spectral density, ERPs, coherence, connectivity matrices |
| Classification | Mental state detection (focus, fatigue, stress) via ML models |
| Neurofeedback Loop | Real-time feedback rendering based on classified brain state |
| Cognitive Tracking | Session analytics, longitudinal trend reports, baseline calibration |

## Architecture Patterns
- **Stream-Process-Classify**: LSL inlet → MNE/EEGLAB preprocessing → scikit-learn/ONNX classifier → feedback output
- **Microservice BCI**: separate acquisition, processing, and visualization services connected via WebSocket or gRPC
- **Edge-First**: run lightweight classifiers on-device (Raspberry Pi, mobile) to reduce latency below 50ms
- **Session Store**: persist epochs and events in HDF5 or Parquet for offline reanalysis

## Key Technologies
- Python: MNE-Python, NumPy, SciPy, scikit-learn, PyTorch
- Streaming: Lab Streaming Layer (LSL / pylsl), asyncio
- Visualization: Matplotlib, Plotly Dash, Unity (for VR neurofeedback)
- Hardware SDKs: Emotiv Cortex API, Muse SDK, OpenBCI Cyton, Neurosity Crown SDK
- Storage: HDF5 (h5py), Parquet, InfluxDB for time-series metrics

## Implementation Checklist
- [ ] Confirm device connection and raw signal quality (check impedance, SNR)
- [ ] Apply bandpass filter (e.g., 1–40 Hz), notch at 50/60 Hz, ICA for eye blink removal
- [ ] Segment epochs around events or in fixed windows (e.g., 1s, 250ms step)
- [ ] Extract frequency band powers (delta, theta, alpha, beta, gamma)
- [ ] Train/load classifier, validate with cross-session leave-one-out
- [ ] Build feedback loop with latency budget < 100ms end-to-end
- [ ] Log all sessions with timestamps and metadata for reproducibility

## Best Practices
- Always record a 3–5 min eyes-open/eyes-closed baseline per session for normalization
- Use z-score normalization per channel to handle inter-session electrode drift
- Store raw + processed data separately — never overwrite raw signals
- Validate classifier on held-out subjects, not just held-out trials
- Expose signal quality metrics in the UI so users know when data is unreliable

## Anti-Patterns
- Skipping artifact rejection before feature extraction — corrupted epochs invalidate models
- Hardcoding sampling rates or channel counts — always read from device metadata at runtime
- Training and testing on the same session without temporal separation
- Sending continuous raw EEG over REST API — use streaming protocols (WebSocket, LSL, gRPC)
- Claiming clinical efficacy without peer-reviewed validation — regulatory risk (FDA 510k, CE)
