import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme_provider";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { UsageProvider } from "@/context/UsageContext";
import { ConditionalLayout } from "@/components/conditional-layout";
import ModalProvider from "./subaccounts/components/modal_provider";
import { Toaster } from "@/components/ui/toaster";
// ✅ Chargement des polices Google (pas besoin d'installer @geist/font)
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
  export const metadata: Metadata = {
  title: 'Synopsia — Smart Meeting Assistant',
  description: 'AI-powered meeting management and summaries',
  manifest: '/manifest.json',
  // themeColor: '#1a0033',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-512x512.png',
  },
}
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >  <NextIntlClientProvider locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >  <ModalProvider>
            <Toaster/>
          
              <UsageProvider>
                <ConditionalLayout>{children}</ConditionalLayout>
              </UsageProvider>
            </ModalProvider>
          </ThemeProvider>
            </NextIntlClientProvider>

        </body>
      </html>
    </ClerkProvider>
  );
}
