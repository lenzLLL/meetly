// next-intl.config.js
/** @type {import('next-intl').NextIntlConfig} */
module.exports = {
  locales: ["en", "fr", "es", "de", "pt", "it"],   // langues supportées
  defaultLocale: "en",     // langue par défaut
  // Optionnel : si tu veux détecter automatiquement la langue du navigateur
  localeDetection: true
};
