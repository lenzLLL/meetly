"use client";

import { Bot } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

function Footer() {
  const params = useParams();
  const locale = params?.locale || "en";
  const t = useTranslations("Home");
  const isEnglish = locale === "en";

  return (
    <footer className="border-t border-gray-800 py-5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-300" />
            </div>
            <span className="text-xl font-bold text-white">Meetly</span>
          </div>
          <div className="text-gray-500 text-sm text-center md:text-right">
            {isEnglish
              ? `© ${new Date().getFullYear()} Meetly. Made with ❤️ for better meetings.`
              : `© ${new Date().getFullYear()} Meetly. Fait avec ❤️ pour de meilleures réunions.`}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
