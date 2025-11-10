"use client";
import React from "react";
import { useTranslations } from "next-intl";

export default function StatsSection() {
  const t = useTranslations("Home");

  const stats = [
    {
      value: "2+",
      label: t("StatUsers"),
    },
    {
      value: "99.69%",
      label: t("StatUptime"),
    },
    {
      value: "2min",
      label: t("StatSetupTime"),
    },
    {
      value: "50hrs",
      label: t("StatSavedPerMonth"),
    },
  ];

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-20 pb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
