"use client";
import { Download, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React from "react";

function MoreFeaturesSection() {
  const t = useTranslations("Home");
  const params = useParams();
  const locale = params?.locale || "en";
  const isEnglish = locale === "en";

  return (
    <section className="pb-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("MoreTitle")}{" "}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {t("MoreTitle2")}
            </span>
          </h2>
          <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
            {t("MoreDescription")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isEnglish ? "Complete Meeting Exports" : "Export Complet des Réunions"}
            </h3>
            <p className="text-gray-400">
              {isEnglish
                ? "Download audio MP3, transcripts, summaries, and action items."
                : "Téléchargez l'audio MP3, les transcriptions, résumés et actions à suivre."}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isEnglish ? "Full Customization" : "Personnalisation Complète"}
            </h3>
            <p className="text-gray-400">
              {isEnglish
                ? "Customize bot name, image and toggle bot participation."
                : "Personnalisez le nom du bot, son image et activez/désactivez sa participation."}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isEnglish ? "Meeting Analytics" : "Analyses des Réunions"}
            </h3>
            <p className="text-gray-400">
              {isEnglish
                ? "Track meeting patterns, participation rates, and productivity."
                : "Suivez les modèles de réunion, les taux de participation et la productivité."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MoreFeaturesSection;
