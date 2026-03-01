---
name: brain-computer-interface
description: "Brain-computer interface development — neural signal processing, EEG/fNIRS, neurofeedback apps, prosthetics control, cognitive workload monitoring. Activate when building BCI applications, neural data pipelines, or neurofeedback platforms."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# Brain-Computer Interface — Skill

> BCI market reaches $6.2B by 2030; Neuralink's first human implant (2024) and non-invasive consumer EEG devices crossing 1M units sold in 2025 mark mainstream BCI emergence.

## When to Activate
- Processing raw EEG, fNIRS, or EMG neural signal streams
- Building neurofeedback training or meditation apps
- Implementing motor imagery classification for prosthetics or control
- Designing cognitive load or attention monitoring systems
- Creating SSVEP or P300 speller BCI paradigms
- Integrating OpenBCI, Emotiv, or Muse headset SDKs
- Building accessibility tools controlled by neural signals

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Signal Acquisition | EEG/fNIRS/EMG device streaming, electrode impedance checks | OpenBCI SDK, Emotiv API, Muse SDK |
| Signal Processing | Band-pass filtering, artifact removal (ICA), epoch extraction | MNE-Python, EEGLAB, SciPy |
| Feature Extraction | Power spectral density, ERPs, connectivity metrics | MNE-Python, PyEDFlib, Brainflow |
| Classification | Motor imagery, P300, SSVEP paradigm decoders | MOABB, scikit-learn, PyTorch EEGNet |
| Neurofeedback | Real-time band power feedback, protocol design | BrainBay, OpenViBE, custom WebSocket |
| Data Standards | EDF+/BDF file handling, BIDS-EEG format compliance | PyEDFlib, MNE-BIDS, xarray |

## Architecture Patterns
```python
# Real-time EEG motor imagery classification pipeline
import brainflow
from brainflow.board_shim import BoardShim, BrainFlowInputParams
from brainflow.data_filter import DataFilter, FilterTypes
import numpy as np

async def stream_and_classify(board_id: int, serial_port: str) -> AsyncIterator[MotorIntent]:
    params = BrainFlowInputParams()
    params.serial_port = serial_port
    board = BoardShim(board_id, params)
    board.prepare_session()
    board.start_stream()

    eeg_channels = BoardShim.get_eeg_channels(board_id)
    sample_rate = BoardShim.get_sampling_rate(board_id)
    epoch_samples = sample_rate * 2  # 2-second epochs

    while True:
        data = board.get_current_board_data(epoch_samples)
        eeg = data[eeg_channels]

        # Band-pass 8-30 Hz (mu + beta bands for motor imagery)
        for ch in range(eeg.shape[0]):
            DataFilter.perform_bandpass(eeg[ch], sample_rate, 8.0, 30.0, 4, FilterTypes.BUTTERWORTH.value, 0)

        # Extract log-band power features (C3, Cz, C4 channels)
        features = np.log(np.var(eeg[[1, 4, 7], :], axis=1))  # simplified

        intent = await motor_imagery_model.predict(features)  # LEFT / RIGHT / REST
        yield MotorIntent(label=intent.label, confidence=intent.confidence)

    board.stop_stream()
    board.release_session()
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| OpenBCI | Open-source EEG/EMG hardware + Brainflow SDK | Hardware ($500-2K) + free SDK |
| Emotiv | Consumer/research EEG headsets + EMOTIV API | Hardware + subscription |
| Kernel Flow | fNIRS neuroimaging platform | Research partnership |
| BrainCo | EMG prosthetics control, focus headband | Hardware + SDK |
| Neuralink | Invasive implant BCI (research/medical) | Clinical trial only |
| Muse (InteraXon) | Consumer meditation EEG, Muse SDK | Hardware + free SDK |

## Related Skills
- `wearable-health-iot` — Biometric streaming patterns, HealthKit integration
- `ai-drug-discovery-biotech` — Neuropharmacology trial monitoring, biomarker pipelines
- `voice-ai-development` — Multimodal control combining neural + voice signals
