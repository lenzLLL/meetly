export const SUPPORTED_LOCALES = ["en","fr","es","de","pt","it"] as const;

export function buildLocalizedPath(currentHref: string | undefined, locale: string) {
  // If no href provided, just return root for locale
  if (!currentHref) return `/${locale}`;

  try {
    const url = new URL(currentHref, 'http://example.com');
    // split pathname into parts and remove empty items
    const parts = url.pathname.split('/').filter(Boolean);

    // if first part is a supported locale, remove it
    if (parts.length > 0 && SUPPORTED_LOCALES.includes(parts[0] as any)) {
      parts.shift();
    }

    const newPath = '/' + [locale, ...parts].join('/');
    return `${newPath}${url.search}${url.hash}`;
  } catch (e) {
    // fallback: naive replace first segment
    const p = (currentHref || '').split('/');
    if (p.length > 1) {
      p[1] = locale;
      return p.join('/');
    }
    return `/${locale}`;
  }
}

export default buildLocalizedPath;
