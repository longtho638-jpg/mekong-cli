
import * as astro from './packages/i18n/dist/astro/index.js';
console.log('Exports:', Object.keys(astro));
console.log('getLocaleFromUrl:', typeof astro.getLocaleFromUrl);
