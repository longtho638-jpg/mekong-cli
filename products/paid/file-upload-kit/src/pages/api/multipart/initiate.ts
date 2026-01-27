import { NextApiRequest, NextApiResponse } from 'next';
import { initiateMultipartUpload } from '../../lib/multipart-upload';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType, provider = 's3' } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Missing filename or contentType' });
    }

    const result = await initiateMultipartUpload(filename, contentType, provider);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error initiating multipart upload:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
