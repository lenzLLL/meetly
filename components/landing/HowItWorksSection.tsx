"use client";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React from "react";

function HowItWorksSection() {
  const t = useTranslations("Home");
  const params = useParams();
  const locale = params?.locale || "en";

  const isEnglish = locale === "en";

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("HowTitle")}{" "}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {t("HowTitle2")}
            </span>
          </h2>
          <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
            {t("HowDescription")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-purple-500 bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 group-hover:bg-purple-500/10 transition-all duration-300">
              1
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              {isEnglish ? "Connect Calendar" : "Connectez Votre Calendrier"}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              {isEnglish
                ? "Link your Google Calendar and we'll automatically detect your meetings."
                : "Connectez votre Google Calendar et nous détecterons automatiquement vos réunions."}
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-purple-500 bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-300">
              2
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              {isEnglish ? "Bot Joins Meeting" : "Le Bot Rejoint La Réunion"}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              {isEnglish
                ? "Our AI bot automatically joins and records your meetings with full transcription."
                : "Notre bot IA rejoint automatiquement vos réunions et les enregistre avec une transcription complète."}
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-purple-500 bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 group-hover:bg-purple-500/10 transition-all duration-300">
              3
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              {isEnglish ? "Get Insights" : "Obtenez Des Informations"}
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              {isEnglish
                ? "Receive summaries, action items, and push them to your favourite tools instantly."
                : "Recevez des résumés, des points d’action et envoyez-les instantanément vers vos outils préférés."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
