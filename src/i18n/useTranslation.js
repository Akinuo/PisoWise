// src/i18n/useTranslation.js
import useStore from '../store/useStore';
import { TRANSLATIONS } from './translations';

const getPath = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);

/**
 * t('namespace.key', { placeholder: value }) — looks up the current
 * language's dictionary, falling back to Filipino if the key is missing
 * there (English is intentionally allowed to be incomplete — see
 * translations.js header), and finally to the raw key itself so a
 * genuinely missing key is visible/debuggable instead of silently
 * rendering nothing. Supports simple {placeholder} interpolation.
 */
export const useTranslation = () => {
  const language = useStore((s) => s.language);

  const t = (path, params) => {
    const value = getPath(TRANSLATIONS[language], path) ?? getPath(TRANSLATIONS.fil, path);
    let result = value ?? path;
    if (params && typeof result === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return result;
  };

  return { t, language };
};
