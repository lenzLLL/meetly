import "./globals.css";

import { ThemeProvider } from "@/components/theme_provider";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { UsageProvider } from "@/context/UsageContext";
import { ConditionalLayout } from "@/components/conditional-layout";
import { Toaster } from "@/components/ui/toaster";
import { LocaleHtmlWrapper } from "./locale-html-wrapper";
import ModalProvider from "@/components/modal_provider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
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
    <LocaleHtmlWrapper locale={locale}>
      <NextIntlClientProvider locale={locale}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            <Toaster />
            <UsageProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </UsageProvider>
          </ModalProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </LocaleHtmlWrapper>
  );
}
