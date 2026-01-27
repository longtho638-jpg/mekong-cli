import { NextApiRequest, NextApiResponse } from 'next';
import { generatePresignedUrl } from '../lib/s3-client';
import { generateR2PresignedUrl } from '../lib/r2-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType, provider = 's3' } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Missing filename or contentType' });
    }

    const key = `uploads/${Date.now()}-${filename.replace(/\s+/g, '-')}`;

    let url: string;

    if (provider === 'r2') {
      url = await generateR2PresignedUrl(key, contentType);
    } else {
      // Default to S3
      url = await generatePresignedUrl(key, contentType);
    }

    return res.status(200).json({ url, key, provider });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
