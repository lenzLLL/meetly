"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import ReactCountryFlag from "react-country-flag";

const languages = [
  { code: "en", label: "English", countryCode: "GB" },
  { code: "fr", label: "Français", countryCode: "FR" },
];

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const currentLang = languages.find(lang => pathname.startsWith(`/${lang.code}`)) || languages[0];

  const switchLanguage = (locale: string) => {
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/"));
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-28 px-3 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <ReactCountryFlag countryCode={currentLang.countryCode} svg className="mr-2" />
        {currentLang.label}
        <svg
          className="w-4 h-4 ml-auto -mr-1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ReactCountryFlag countryCode={lang.countryCode} svg className="mr-2" />
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
