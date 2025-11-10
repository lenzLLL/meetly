"use client";
import { Download, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export default function MoreFeaturesSection() {
  const t = useTranslations("Home");

  const features = [
    {
      icon: Download,
      title: t("MoreFeature1Title"),
      description: t("MoreFeature1Description"),
    },
    {
      icon: Settings,
      title: t("MoreFeature2Title"),
      description: t("MoreFeature2Description"),
    },
    {
      icon: Download,
      title: t("MoreFeature3Title"),
      description: t("MoreFeature3Description"),
    },
  ];

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
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
