import { NextApiRequest, NextApiResponse } from 'next';
import { generatePartPresignedUrl } from '../../lib/multipart-upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, uploadId, partNumber, provider = 's3' } = req.body;

    if (!key || !uploadId || !partNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const url = await generatePartPresignedUrl(key, uploadId, parseInt(partNumber), provider);
    return res.status(200).json({ url });
  } catch (error: any) {
    console.error('Error generating part presigned URL:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
