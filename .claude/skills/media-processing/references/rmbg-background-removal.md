# Background Removal with RMBG

Complete guide to removing backgrounds from images using RMBG - a privacy-focused, local AI-powered background removal tool.

## What is RMBG?

RMBG is an open-source background removal tool that processes images locally using ONNX Runtime and AI models. All processing happens on your machine without uploading files to external servers.

**Key Features:**
- Local processing (privacy-first)
- Multiple deployment options (SDK, CLI, API, Desktop)
- 6+ AI models with different quality/speed tradeoffs
- Cross-platform (Windows, macOS, Linux)
- Full TypeScript support
- Model caching for performance

**Repository:** https://github.com/mrgoonie/rmbg

## Installation Options

### Node.js SDK (Recommended for Integration)
```bash
npm install rmbg
# or
bun add rmbg
```

### CLI Tool (For Command-Line Usage)
```bash
npm install -g rmbg-cli
# or
pnpm install -g rmbg-cli
```

### Browser SDK (For Web Applications)
```bash
npm install @rmbg/browser
```

### REST API (Docker)
```bash
git clone https://github.com/mrgoonie/rmbg.git
cd rmbg
docker compose up -d
```

## Quick Start

### CLI Usage

```bash
# Basic usage (uses modnet model by default)
rmbg input.jpg

# Specify output path
rmbg input.jpg -o output.png

# Use specific model
rmbg input.jpg -m briaai -o high-quality.png

# Fast processing with u2netp
rmbg input.jpg -m u2netp -o fast-output.png

# High resolution output (4K)
rmbg image.jpg -r 4096 -o image-4k.png
```

**CLI Options:**
- `-o, --output <path>` - Output path (default: `input-no-bg.png`)
- `-m, --model <model>` - Model: `briaai`, `modnet`, `u2netp`, `isnet-anime`, `silueta`, `u2net-cloth` (default: `modnet`)
- `-r, --max-resolution <n>` - Max resolution in pixels (default: `2048`)

### Node.js SDK Usage

```typescript
import { rmbg } from 'rmbg'

// Simple usage - returns Buffer
const output = await rmbg('input.jpg')

// Save directly to file
await rmbg('input.jpg', { output: 'output.png' })

// From URL
const output = await rmbg('https://example.com/image.jpg')

// From Buffer
import { readFileSync } from 'fs'
const buffer = readFileSync('./input.jpg')
const output = await rmbg(buffer)

// From Stream
import { createReadStream } from 'fs'
const stream = createReadStream('input.jpg')
const output = await rmbg(stream)
```

## Available Models

| Model | Resolution | Size | Quality | Speed | Best For |
|-------|-----------|------|---------|-------|----------|
| **u2netp** | 320px | 4.5MB | Fair | ⚡⚡⚡ Fastest | Real-time, batch processing |
| **modnet** | 512px | 25MB | Good | ⚡⚡ Fast | **Default**, balanced |
| **briaai** | 1024px | 44MB | Excellent | ⚡ Slower | High-quality outputs |
| **isnet-anime** | 1024px | 168MB | Anime-optimized | ⚡ Slower | Anime/manga characters |
| **silueta** | 320px | 43MB | Portrait-focused | ⚡⚡⚡ Fast | Portrait photography |
| **u2net-cloth** | 768px | 170MB | Clothing-optimized | ⚡ Slower | Fashion/clothing items |

### Model Selection Guide

**Speed Priority:**
```typescript
import { rmbg, createU2netpModel } from 'rmbg'

const output = await rmbg('input.jpg', {
  model: createU2netpModel()
})
```

**Quality Priority:**
```typescript
import { rmbg, createBriaaiModel } from 'rmbg'

const output = await rmbg('input.jpg', {
  model: createBriaaiModel(),
  maxResolution: 4096
})
```

**Balanced (Default):**
```typescript
import { rmbg, createModnetModel } from 'rmbg'

const output = await rmbg('input.jpg', {
  model: createModnetModel()
})
```

**Specialized Use Cases:**
```typescript
import {
  rmbg,
  createIsnetAnimeModel,
  createSiluetaModel,
  createU2netClothModel
} from 'rmbg'

// Anime/manga characters
const anime = await rmbg('anime.jpg', {
  model: createIsnetAnimeModel()
})

// Portrait photography
const portrait = await rmbg('portrait.jpg', {
  model: createSiluetaModel()
})

// Fashion/clothing items
const clothing = await rmbg('product.jpg', {
  model: createU2netClothModel()
})
```

## Advanced Usage

### Progress Tracking

```typescript
await rmbg('input.jpg', {
  onProgress: (progress, download, process) => {
    console.log(`Overall: ${Math.round(progress * 100)}%`)
    console.log(`Download: ${Math.round(download * 100)}%`)
    console.log(`Process: ${Math.round(process * 100)}%`)
  }
})
```

### Cancellation Support

```typescript
const abortController = new AbortController()

const promise = rmbg('large-image.jpg', {
  abortController
})

// Cancel operation
setTimeout(() => {
  abortController.abort()
}, 5000)

try {
  await promise
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Operation cancelled')
  }
}
```

### Custom Cache Directory

```typescript
await rmbg('input.jpg', {
  cacheDir: '/custom/cache/path',
  enableCache: true
})
```

### Streaming Output

```typescript
import { createWriteStream } from 'fs'

const output = createWriteStream('output.png')
await rmbg('input.jpg', { output })
```

## Integration Examples

### Express.js Server

```typescript
import express from 'express'
import multer from 'multer'
import { rmbg } from 'rmbg'

const app = express()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })

app.post('/remove-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const output = await rmbg(req.file.buffer)

    res.contentType('image/png')
    res.send(output)
  } catch (error) {
    console.error('Background removal failed:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

### Next.js API Route

```typescript
// pages/api/remove-bg.ts
import { rmbg } from 'rmbg'
import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const imageBuffer = Buffer.from(req.body, 'base64')
    const output = await rmbg(imageBuffer)

    res.setHeader('Content-Type', 'image/png')
    res.send(output)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

### Serverless/Lambda Function

```typescript
import { rmbg } from 'rmbg'

export const handler = async (event) => {
  try {
    const imageBuffer = Buffer.from(event.body, 'base64')
    const output = await rmbg(imageBuffer, {
      model: createU2netpModel(), // Use faster model for serverless
      maxResolution: 2048
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000'
      },
      body: output.toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

### Browser Integration

```typescript
import { rmbg } from '@rmbg/browser'
import { createU2netpModel } from '@rmbg/browser/models'

async function removeBackground(file: File) {
  const model = createU2netpModel()

  const blob = await rmbg(file, {
    model,
    onProgress: (progress) => {
      console.log(`Progress: ${Math.round(progress * 100)}%`)
    }
  })

  const url = URL.createObjectURL(blob)
  return url
}

// Usage in React
function BackgroundRemover() {
  const [result, setResult] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await removeBackground(file)
    setResult(url)
  }

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {result && <img src={result} alt="Result" />}
    </div>
  )
}
```

### Batch Processing

```typescript
import { rmbg } from 'rmbg'
import { readdir } from 'fs/promises'
import { join } from 'path'

async function batchRemoveBackground(inputDir: string, outputDir: string) {
  const files = await readdir(inputDir)
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png|webp)$/i.test(f)
  )

  console.log(`Processing ${imageFiles.length} images...`)

  for (const file of imageFiles) {
    const inputPath = join(inputDir, file)
    const outputPath = join(outputDir, file.replace(/\.[^.]+$/, '.png'))

    try {
      await rmbg(inputPath, {
        output: outputPath,
        onProgress: (progress) => {
          console.log(`${file}: ${Math.round(progress * 100)}%`)
        }
      })
      console.log(`✓ ${file} -> ${outputPath}`)
    } catch (error) {
      console.error(`✗ ${file}: ${error.message}`)
    }
  }
}

// Usage
await batchRemoveBackground('./input', './output')
```

## REST API Usage

### Start API Server

```bash
# Using Docker
docker compose up -d

# Or manually
pnpm install
pnpm --filter rmbg-api build
pnpm --filter rmbg-api start
```

### API Endpoints

#### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### List Models
```bash
GET /models
```

Response:
```json
{
  "models": [
    {
      "name": "u2netp",
      "resolution": 320,
      "size": 4574861
    },
    {
      "name": "modnet",
      "resolution": 512,
      "size": 25042965
    }
  ]
}
```

#### Remove Background
```bash
POST /remove-background
Content-Type: multipart/form-data

Parameters:
  image (required): Image file (JPEG, PNG, WebP; max 10MB)
  model (optional): Model name (default: modnet)
  maxResolution (optional): Max output resolution (default: 2048)
```

### cURL Examples

```bash
# Basic usage
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  --output output.png

# With specific model
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  -F "model=briaai" \
  --output output.png

# With custom resolution
curl -X POST http://localhost:3000/remove-background \
  -F "image=@input.jpg" \
  -F "model=briaai" \
  -F "maxResolution=4096" \
  --output output.png
```

### Python Client

```python
import requests

def remove_background(image_path, model='modnet', max_resolution=2048):
    url = 'http://localhost:3000/remove-background'

    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {
            'model': model,
            'maxResolution': max_resolution
        }

        response = requests.post(url, files=files, data=data)

        if response.status_code == 200:
            with open('output.png', 'wb') as out:
                out.write(response.content)
            return True
        else:
            print(f"Error: {response.json()}")
            return False

# Usage
remove_background('input.jpg', model='briaai', max_resolution=4096)
```

## Configuration

### SDK Options

```typescript
interface RMBGOptions {
  // AI model to use (default: u2netp)
  model?: RMBGModel

  // Maximum output resolution (default: 2048)
  maxResolution?: number

  // Output destination (default: Buffer)
  output?: string | Writable

  // Progress tracking callback
  onProgress?: (progress: number, download: number, process: number) => void

  // For cancellation
  abortController?: AbortController

  // Model cache directory (default: os.tmpdir())
  cacheDir?: string

  // Enable model caching (default: true)
  enableCache?: boolean
}
```

### Environment Variables

**Node.js SDK:**
- `RMBG_CACHE_DIR` - Custom cache directory for models
- `RMBG_ENABLE_CACHE` - Set to `false` to disable caching

**API Server:**
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (production/development)

## Performance Optimization

### Model Caching

Models are automatically cached on first use:

```bash
# Default cache location
macOS: /var/folders/.../T/rmbg-cache/
Linux: /tmp/rmbg-cache/
Windows: %TEMP%\rmbg-cache\
```

### Performance Characteristics

| Model | First Use | Cached | Memory |
|-------|-----------|--------|--------|
| u2netp | 2-3s | 1-2s | ~500MB |
| modnet | 3-5s | 2-4s | ~700MB |
| briaai | 5-10s | 4-8s | ~1GB |

**Notes:**
- First use downloads models (4-170MB depending on model)
- Subsequent uses load from cache (much faster)
- Performance depends on image size and CPU

### Production Optimization

```typescript
// 1. Use faster model for real-time processing
const output = await rmbg(input, {
  model: createU2netpModel(),
  maxResolution: 1024
})

// 2. Limit resolution for faster processing
const output = await rmbg(input, {
  maxResolution: 1024 // Instead of 4096
})

// 3. Pre-warm cache on server startup
import { createModnetModel } from 'rmbg'
const model = createModnetModel()
// Model will be downloaded and cached

// 4. Use streaming for large files
await rmbg(createReadStream(input), {
  output: createWriteStream(output)
})
```

## Security Considerations

### Built-in Security Features

1. **SSRF Prevention**
   - Blocked hosts: localhost, 127.0.0.1, AWS/GCP metadata
   - Private IP ranges blocked
   - Only HTTP/HTTPS protocols allowed

2. **Path Traversal Prevention**
   - File paths validated and normalized
   - System directories blocked

3. **Input Validation**
   - Max file size: 50MB (SDK), 10MB (API)
   - Supported formats: JPEG, PNG, WebP
   - Image metadata validation

### Production Security Recommendations

```typescript
// 1. Add rate limiting (Express)
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/remove-bg', limiter)

// 2. Add authentication
app.use('/remove-bg', (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  next()
})

// 3. Configure CORS
import cors from 'cors'

app.use(cors({
  origin: 'https://yourdomain.com',
  methods: ['POST']
}))

// 4. Use HTTPS
import https from 'https'
import fs from 'fs'

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
}

https.createServer(options, app).listen(443)
```

## Error Handling

```typescript
try {
  const output = await rmbg('input.jpg')
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Operation was cancelled')
  } else if (error.message.includes('SSRF')) {
    console.error('Invalid URL (SSRF protection)')
  } else if (error.message.includes('File size')) {
    console.error('File too large')
  } else if (error.message.includes('Unsupported format')) {
    console.error('Invalid image format')
  } else {
    console.error('Background removal failed:', error)
  }
}
```

## Troubleshooting

**Model download fails:**
```bash
# Check network connection
curl https://unpkg.com/@rmbg/model-modnet/modnet-256.onnx

# Try manual cache directory
RMBG_CACHE_DIR=/tmp/rmbg-cache node app.js
```

**Memory errors:**
```typescript
// Reduce resolution
await rmbg('input.jpg', {
  maxResolution: 1024 // Instead of 4096
})

// Use faster/smaller model
await rmbg('input.jpg', {
  model: createU2netpModel() // Only 4.5MB
})
```

**Slow processing:**
```typescript
// 1. Use faster model
const output = await rmbg(input, {
  model: createU2netpModel()
})

// 2. Reduce resolution
const output = await rmbg(input, {
  maxResolution: 1024
})

// 3. Pre-download models
import { createModnetModel } from 'rmbg'
await createModnetModel() // Downloads on startup
```

## Resources

- GitHub Repository: https://github.com/mrgoonie/rmbg
- npm Package: https://www.npmjs.com/package/rmbg
- CLI Package: https://www.npmjs.com/package/rmbg-cli
- Browser Package: https://www.npmjs.com/package/@rmbg/browser
- ONNX Runtime: https://onnxruntime.ai/
