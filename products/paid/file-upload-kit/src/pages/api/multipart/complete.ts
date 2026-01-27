import { NextApiRequest, NextApiResponse } from 'next';
import { completeMultipartUpload } from '../../lib/multipart-upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, uploadId, parts, provider = 's3' } = req.body;

    if (!key || !uploadId || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await completeMultipartUpload(key, uploadId, parts, provider);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error completing multipart upload:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
