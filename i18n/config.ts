import { routing } from './routing';

// ⚠️ Next-Intl attend une exportation par défaut qui soit de type `NextIntlConfig`
const config = {
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix
};

export default config;
