import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "fr"],
  defaultLocale: "en",
});

export default clerkMiddleware((auth, req) => {
  // Appliquer Next-Intl seulement sur les pages, pas sur les API
  if (!req.nextUrl.pathname.startsWith("/api")) {
    return intlMiddleware(req);
  }
  // Pour les API, Clerk s'applique et Next-Intl est ignoré
});

export const config = {
  matcher: [
    // Appliquer sur toutes les pages et API
    '/((?!_next/|.*\\..*).*)',
  ],
};
