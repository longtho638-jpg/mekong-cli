const fs = require('fs');
const chalk = require('chalk');

module.exports = {
  input: [
    'apps/web/app/**/*.{ts,tsx}',
    'apps/web/components/**/*.{ts,tsx}',
    'apps/web/lib/**/*.{ts,tsx}',
  ],
  output: './',
  options: {
    debug: true,
    func: {
      list: ['i18next.t', 'i18n.t', 't'],
      extensions: ['.ts', '.tsx']
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.ts', '.tsx'],
      fallbackKey: function(ns, value) {
        return value;
      },
      acorn: {
        ecmaVersion: 2020,
        sourceType: 'module', // defaults to 'module'
        // Check out https://github.com/acornjs/acorn/tree/master/acorn#interface for additional options
      }
    },
    lngs: ['en-US', 'vi-VN', 'ar-SA', 'he-IL', 'zh-CN', 'ja-JP', 'es-ES', 'fr-FR', 'de-DE'],
    ns: ['common', 'auth', 'dashboard', 'errors', 'validation'],
    defaultLng: 'en-US',
    defaultNs: 'common',
    defaultValue: function(lng, ns, key) {
        if (lng === 'en-US') {
            // Return key as default value for en-US if we want, or empty string
            return key;
        }
        return '';
    },
    resource: {
      loadPath: 'apps/web/public/locales/{{lng}}/{{ns}}.json',
      savePath: 'apps/web/public/locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n'
    },
    nsSeparator: ':', // namespace separator
    keySeparator: '.', // key separator
    interpolation: {
      prefix: '{{',
      suffix: '}}'
    }
  },
  transform: function customTransform(file, enc, done) {
    "use strict";
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    let count = 0;

    parser.parseFuncFromString(content, { list: ['i18next.t', 'i18n.t', 't'] }, (key, options) => {
      parser.set(key, Object.assign({}, options, {
        nsSeparator: ':',
        keySeparator: '.'
      }));
      ++count;
    });

    if (count > 0) {
      console.log(`i18next-scanner: count=${chalk.cyan(count)}, file=${chalk.yellow(JSON.stringify(file.relative))}`);
    }

    done();
  }
};
