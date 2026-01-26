import { NextApiRequest, NextApiResponse } from 'next';
import { renderTemplate, getAvailableTemplates } from '../../services/preview/renderer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { template, list } = req.query;

    if (list === 'true') {
      return res.status(200).json({ templates: getAvailableTemplates() });
    }

    if (!template || typeof template !== 'string') {
      return res.status(400).json({ error: 'Template name is required' });
    }

    try {
      const html = await renderTemplate(template);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to render template' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
