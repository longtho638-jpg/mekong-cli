import { NextApiRequest, NextApiResponse } from 'next';
import { abortMultipartUpload } from '../../lib/multipart-upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { key, uploadId, provider = 's3' } = req.body;

    if (!key || !uploadId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await abortMultipartUpload(key, uploadId, provider);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error aborting multipart upload:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
