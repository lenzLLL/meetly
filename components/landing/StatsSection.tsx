"use client";
import React from "react";
import { useParams } from "next/navigation";

function StatsSection() {
  const params = useParams();
  const locale = params?.locale || "en";
  const isEnglish = locale === "en";

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-20 pb-16">
          {/* Stat 1 */}
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
              2+
            </div>
            <p className="text-gray-400">
              {isEnglish ? "Happy Users" : "Utilisateurs Satisfaits"}
            </p>
          </div>

          {/* Stat 2 */}
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
              99.69%
            </div>
            <p className="text-gray-400">{isEnglish ? "Uptime" : "Disponibilité"}</p>
          </div>

          {/* Stat 3 */}
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
              2min
            </div>
            <p className="text-gray-400">{isEnglish ? "Setup Time" : "Temps d'Installation"}</p>
          </div>

          {/* Stat 4 */}
          <div className="text-center group">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
              50hrs
            </div>
            <p className="text-gray-400">{isEnglish ? "Saved Per Month" : "Heures Économisées Par Mois"}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
