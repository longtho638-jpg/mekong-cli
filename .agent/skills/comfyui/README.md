# ComfyUI Skill

This skill integrates [ComfyUI](https://github.com/comfyanonymous/ComfyUI), a powerful node-based GUI for Stable Diffusion, into AgencyOS.

## Features

- **Visual Workflow**: Design complex image/video generation pipelines.
- **Model Support**: SDXL, Flux, Video models.
- **API Control**: Trigger workflows programmatically.

## Usage

ComfyUI is typically run as a local server.

### Installation

1. Clone ComfyUI: `git clone https://github.com/comfyanonymous/ComfyUI`
2. Install requirements: `pip install -r requirements.txt`
3. Run: `python main.py`

### API Integration

AgencyOS interacts with ComfyUI via its websocket API.

```python
import websocket
import json
import urllib.request
import urllib.parse

# Load workflow from JSON and send to ComfyUI
```

## Requirements

- Python 3.10+
- GPU (Recommended)
