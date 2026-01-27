import React from 'react';

interface LanguageSelectorProps {
  language: string;
  onLanguageChange: (language: string) => void;
  availableLanguages?: { code: string; name: string }[];
}

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'vi', name: 'Vietnamese' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onLanguageChange,
  availableLanguages = DEFAULT_LANGUAGES,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="language-select" className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Language
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
