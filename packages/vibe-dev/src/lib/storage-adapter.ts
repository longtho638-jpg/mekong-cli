import fs from 'fs/promises';
import path from 'path';

export class JsonStorageAdapter {
  /**
   * Reads a JSON file and returns the parsed content.
   * Returns null if file does not exist.
   */
  public async read<T>(filePath: string): Promise<T | null> {
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Writes data to a JSON file atomically.
   * Writes to a temp file first, then renames it to the target file.
   */
  public async write<T>(filePath: string, data: T): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const tempPath = `${filePath}.tmp.${Date.now()}`;
    const content = JSON.stringify(data, null, 2);

    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if something went wrong
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        // Ignore unlink error
      }
      throw error;
    }
  }

  /**
   * Checks if a file exists.
   */
  public async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
