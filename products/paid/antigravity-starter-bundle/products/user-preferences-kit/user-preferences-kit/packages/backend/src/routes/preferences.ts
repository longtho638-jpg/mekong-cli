
import { Router, Request, Response } from 'express';
import { PreferenceService } from '../services/preferenceService';
import { Server } from 'socket.io';

const router = Router();
const preferenceService = new PreferenceService();

// We need to inject io instance or use a singleton for socket.io
// For simplicity, we'll attach it to req in middleware or export a function to create router
export const createPreferenceRouter = (io: Server) => {

  // GET /api/preferences
  router.get('/', async (req: Request, res: Response) => {
    // In a real app, userId would come from authentication middleware (req.user.id)
    const userId = (req.query.userId as string) || 'default-user';

    try {
      const preferences = await preferenceService.getUserPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  });

  // GET /api/preferences/schema
  router.get('/schema', (req: Request, res: Response) => {
    res.json(preferenceService.getSchema());
  });

  // PATCH /api/preferences/:key
  router.patch('/:key', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'default-user';
    const key = req.params.key;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: 'Value is required' });
      return;
    }

    try {
      await preferenceService.updateUserPreference(userId, key, value);

      // Emit socket event for real-time sync
      io.to(userId).emit('preference:updated', { key, value });

      res.json({ success: true, key, value });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update preference' });
    }
  });

  // PUT /api/preferences (Bulk update)
  router.put('/', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'default-user';
    const preferences = req.body;

    try {
      await preferenceService.updateBulkPreferences(userId, preferences);

      // Emit socket event
      io.to(userId).emit('preferences:bulk_updated', preferences);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to update preferences' });
    }
  });

  // GET /api/preferences/export
  router.get('/export', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'default-user';
    try {
      const json = await preferenceService.exportPreferences(userId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="preferences.json"');
      res.send(json);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to export preferences' });
    }
  });

  // POST /api/preferences/import
  router.post('/import', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'default-user';
    const { data } = req.body; // Expecting { data: JSON_STRING or OBJECT }

    // Support both raw object or stringified JSON
    let jsonString = typeof data === 'string' ? data : JSON.stringify(data);

    try {
      await preferenceService.importPreferences(userId, jsonString);

      // Notify client to reload
      const newPrefs = await preferenceService.getUserPreferences(userId);
      io.to(userId).emit('preferences:bulk_updated', newPrefs);

      res.json({ success: true, message: 'Preferences imported successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to import preferences' });
    }
  });

  return router;
};
