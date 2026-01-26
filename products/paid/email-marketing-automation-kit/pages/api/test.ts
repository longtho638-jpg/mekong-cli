import { NextApiRequest, NextApiResponse } from 'next';
import { checkSpamScore } from '../../utils/spam-checker';
import { validateEmailHtml } from '../../utils/mjml-validator';
import { checkLinks } from '../../utils/link-checker';
import { renderTemplate } from '../../services/preview/renderer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { template, subject, type } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Template is required' });
    }

    try {
      const html = await renderTemplate(template);

      if (type === 'spam-score') {
        const result = await checkSpamScore(subject || 'Test Subject', html);
        return res.status(200).json(result);
      }

      if (type === 'validate') {
        const result = validateEmailHtml(html);
        return res.status(200).json(result);
      }

      if (type === 'links') {
        const result = await checkLinks(html);
        return res.status(200).json(result);
      }

      return res.status(400).json({ error: 'Invalid test type' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
