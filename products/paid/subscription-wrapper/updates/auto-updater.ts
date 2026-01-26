import * as fs from 'fs';
import * as crypto from 'crypto';
import axios from 'axios';
import * as path from 'path';

export class AutoUpdater {
  private readonly DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');
  private readonly PUBLIC_KEY: string; // Public key for signature verification

  constructor(publicKey: string) {
    this.PUBLIC_KEY = publicKey;
    if (!fs.existsSync(this.DOWNLOAD_DIR)) {
      fs.mkdirSync(this.DOWNLOAD_DIR, { recursive: true });
    }
  }

  async downloadUpdate(url: string, version: string): Promise<string> {
    const fileName = `update-${version}.zip`;
    const destination = path.join(this.DOWNLOAD_DIR, fileName);

    console.log(`Downloading update from ${url} to ${destination}...`);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(destination);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(destination));
      writer.on('error', reject);
    });
  }

  async verifySignature(filePath: string, signature: string): Promise<boolean> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const verifier = crypto.createVerify('SHA256');
      verifier.update(fileBuffer);

      return verifier.verify(this.PUBLIC_KEY, signature, 'hex');
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  async installUpdate(filePath: string): Promise<boolean> {
    console.log(`Installing update from ${filePath}...`);
    // In a real scenario, this would unzip and replace files,
    // potentially requiring a restart.
    // For this wrapper, we'll simulate success.
    return true;
  }
}
