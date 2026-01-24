import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/index.js'; // Use internal export or absolute path

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LOCALES = ['vi', 'ja', 'ko', 'th', 'id'];
const BASE_LOCALE = 'en';

function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el) => {
    const value = obj[el];
    if (Array.isArray(value)) {
      return res;
    } else if (typeof value === 'object' && value !== null) {
      return [...res, ...getKeys(value as Record<string, unknown>, prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

function validate() {
  const baseFile = path.join(LOCALES_DIR, `${BASE_LOCALE}.json`);
  if (!fs.existsSync(baseFile)) {
    logger.error(`Base locale file ${BASE_LOCALE}.json not found!`);
    process.exit(1);
  }

  const baseContent = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const baseKeys = getKeys(baseContent);

  logger.info(`🔍 Validating ${SUPPORTED_LOCALES.length} locales against base (${BASE_LOCALE})...`, {
    baseKeys: baseKeys.length
  });

  let totalErrors = 0;

  SUPPORTED_LOCALES.forEach(locale => {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`);
    if (!fs.existsSync(localeFile)) {
      logger.warn(`⚠️  Locale file ${locale}.json not found!`);
      return;
    }

    const content = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    const keys = getKeys(content);
    const missingKeys = baseKeys.filter(key => !keys.includes(key));

    if (missingKeys.length > 0) {
      logger.error(`❌ [${locale}] Missing ${missingKeys.length} keys`, {
        missingCount: missingKeys.length,
        keys: missingKeys
      });
      totalErrors += missingKeys.length;
    } else {
      logger.info(`✅ [${locale}] All keys present.`);
    }
  });

  if (totalErrors > 0) {
    logger.error(`\nFound ${totalErrors} total missing keys.`);
    process.exit(1);
  } else {
    logger.info(`\n✨ All locales are synchronized!`);
  }
}

validate();
