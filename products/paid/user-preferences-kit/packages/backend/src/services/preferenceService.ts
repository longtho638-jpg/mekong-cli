
import { query } from '../db';
import { PreferenceValue, PreferenceSchema, DEFAULT_PREFERENCE_SCHEMA } from '@antigravity/preferences-types';

export class PreferenceService {
  private schema: PreferenceSchema[];

  constructor(customSchema?: PreferenceSchema[]) {
    this.schema = customSchema || DEFAULT_PREFERENCE_SCHEMA;
  }

  getSchema() {
    return this.schema;
  }

  async getUserPreferences(userId: string): Promise<Record<string, PreferenceValue>> {
    const result = await query(
      'SELECT key, value FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    const userPrefs: Record<string, PreferenceValue> = {};
    result.rows.forEach((row: any) => {
      userPrefs[row.key] = row.value;
    });

    // Merge with defaults
    const mergedPrefs: Record<string, PreferenceValue> = {};

    this.schema.forEach((pref) => {
      if (userPrefs[pref.key] !== undefined) {
        mergedPrefs[pref.key] = userPrefs[pref.key];
      } else {
        mergedPrefs[pref.key] = pref.defaultValue;
      }
    });

    return mergedPrefs;
  }

  async updateUserPreference(userId: string, key: string, value: PreferenceValue): Promise<void> {
    // Validate key against schema
    const prefDef = this.schema.find((p) => p.key === key);
    if (!prefDef) {
      throw new Error(`Invalid preference key: ${key}`);
    }

    // Basic type validation (could be enhanced with Zod or full JSON schema validation)
    if (prefDef.type === 'enum' && prefDef.options) {
      const validValues = prefDef.options.map(o => o.value);
      if (!validValues.includes(value as any)) {
        throw new Error(`Invalid value for ${key}. Expected one of: ${validValues.join(', ')}`);
      }
    }
    // Add more type checks here...

    await query(
      `INSERT INTO user_preferences (user_id, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = $3, updated_at = NOW()`,
      [userId, key, value]
    );
  }

  async updateBulkPreferences(userId: string, preferences: Record<string, PreferenceValue>): Promise<void> {
    const client = await import('../db').then(m => m.getClient());
    try {
      await client.query('BEGIN');

      for (const [key, value] of Object.entries(preferences)) {
        await this.updateUserPreference(userId, key, value); // This re-uses logic but creates multiple queries. Optimized approach would use batch insert/upsert.
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async exportPreferences(userId: string): Promise<string> {
    const prefs = await this.getUserPreferences(userId);
    return JSON.stringify(prefs, null, 2);
  }

  async importPreferences(userId: string, jsonString: string): Promise<void> {
    try {
      const preferences = JSON.parse(jsonString);
      if (typeof preferences !== 'object' || preferences === null) {
        throw new Error('Invalid JSON format: root must be an object');
      }

      // Filter out keys not in schema to prevent pollution, or allow dynamic keys if desired.
      // We will stick to schema keys for now.
      const validPreferences: Record<string, PreferenceValue> = {};

      this.schema.forEach(schemaItem => {
        if (preferences[schemaItem.key] !== undefined) {
          validPreferences[schemaItem.key] = preferences[schemaItem.key];
        }
      });

      if (Object.keys(validPreferences).length === 0) {
        throw new Error('No valid preferences found in import');
      }

      await this.updateBulkPreferences(userId, validPreferences);
    } catch (error) {
       throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
