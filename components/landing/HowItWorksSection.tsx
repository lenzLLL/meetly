"use client";
import { useTranslations } from "next-intl";
import React from "react";

export default function HowItWorksSection() {
  const t = useTranslations("Home");

  const steps = [
    {
      number: 1,
      title: t("Step1Title"),
      description: t("Step1Description"),
    },
    {
      number: 2,
      title: t("Step2Title"),
      description: t("Step2Description"),
    },
    {
      number: 3,
      title: t("Step3Title"),
      description: t("Step3Description"),
    },
  ];

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
          {steps.map((step) => (
            <div key={step.number} className="text-center group">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-purple-500 bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-all duration-300">
                {step.number}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
