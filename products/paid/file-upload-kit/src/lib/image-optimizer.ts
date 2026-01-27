import sharp from 'sharp';

export interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

export const optimizeImage = async (
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  let pipeline = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: 'inside', // Maintain aspect ratio, don't crop
      withoutEnlargement: true
    });
  }

  // Convert and compress
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality });
      break;
    case 'webp':
    default:
      pipeline = pipeline.webp({ quality });
      break;
  }

  // Strip metadata (EXIF) for privacy/size
  pipeline = pipeline.withMetadata(false);

  return await pipeline.toBuffer();
};
