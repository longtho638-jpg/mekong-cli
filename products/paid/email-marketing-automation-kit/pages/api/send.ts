import { NextApiRequest, NextApiResponse } from 'next';
import { sendEmail } from '../../services/email';
import { renderTemplate } from '../../services/preview/renderer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { to, template, data, subject } = req.body;

    if (!to || !template || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const html = await renderTemplate(template, data);
      const result = await sendEmail({
        to,
        subject,
        html,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to send email'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
