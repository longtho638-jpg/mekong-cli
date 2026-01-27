import { NextApiRequest, NextApiResponse } from 'next';
import { optimizeImage } from '../../lib/image-optimizer';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable built-in parsing to handle file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = await fs.promises.readFile(file.filepath);

    // Get options from query or body
    const width = fields.width?.[0] ? parseInt(fields.width[0]) : undefined;
    const height = fields.height?.[0] ? parseInt(fields.height[0]) : undefined;
    const quality = fields.quality?.[0] ? parseInt(fields.quality[0]) : 80;
    const format = (fields.format?.[0] as any) || 'webp';

    const optimizedBuffer = await optimizeImage(buffer, {
      width,
      height,
      quality,
      format,
    });

    res.setHeader('Content-Type', `image/${format}`);
    res.send(optimizedBuffer);

  } catch (error: any) {
    console.error('Error optimizing image:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
