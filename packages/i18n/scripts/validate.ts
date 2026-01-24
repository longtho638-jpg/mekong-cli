import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LOCALES = ['vi', 'ja', 'ko', 'th', 'id'];
const BASE_LOCALE = 'en';

function getKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el) => {
    if (Array.isArray(obj[el])) {
      return res;
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, ...getKeys(obj[el], prefix + el + '.')];
    }
    return [...res, prefix + el];
  }, []);
}

function validate() {
  const baseFile = path.join(LOCALES_DIR, `${BASE_LOCALE}.json`);
  if (!fs.existsSync(baseFile)) {
    console.error(`Base locale file ${BASE_LOCALE}.json not found!`);
    process.exit(1);
  }

  const baseContent = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
  const baseKeys = getKeys(baseContent);

  console.log(`🔍 Validating ${SUPPORTED_LOCALES.length} locales against base (${BASE_LOCALE})...`);
  console.log(`Base has ${baseKeys.length} keys.\n`);

  let totalErrors = 0;

  SUPPORTED_LOCALES.forEach(locale => {
    const localeFile = path.join(LOCALES_DIR, `${locale}.json`);
    if (!fs.existsSync(localeFile)) {
      console.warn(`⚠️  Locale file ${locale}.json not found!`);
      return;
    }

    const content = JSON.parse(fs.readFileSync(localeFile, 'utf8'));
    const keys = getKeys(content);
    const missingKeys = baseKeys.filter(key => !keys.includes(key));

    if (missingKeys.length > 0) {
      console.error(`❌ [${locale}] Missing ${missingKeys.length} keys:`);
      missingKeys.forEach(key => console.error(`   - ${key}`));
      totalErrors += missingKeys.length;
    } else {
      console.log(`✅ [${locale}] All keys present.`);
    }
  });

  if (totalErrors > 0) {
    console.error(`\nFound ${totalErrors} total missing keys.`);
    process.exit(1);
  } else {
    console.log('\n✨ All locales are synchronized!');
  }
}

validate();
