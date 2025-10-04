"use client";

import { Button } from "@/components/ui/button";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

function CTASection() {
  const { isSignedIn } = useUser();
  const params = useParams();
  const locale = params?.locale || "en";
  const t = useTranslations("Home");
  const isEnglish = locale === "en";

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t("CTATitle")}{" "}
          <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
            {t("CTATitle2")}
          </span>
        </h2>

        <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)] mb-8">
          {t("CTADescription")}
        </p>

        {isSignedIn ? (
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 px-8 py-4 cursor-pointer">
            <Link href="/home" className="group">
              <span>Dashboard</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        ) : (
          <SignUpButton>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 px-8 py-4 group">
              <span>{isEnglish ? "Start Your Free Trial" : "Essai Gratuit"}</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </SignUpButton>
        )}

        <div className="flex items-center justify-center space-x-1 mt-6">
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <Star className="w-5 h-5 text-yellow-400 fill-current" />
          <span className="ml-2 text-gray-500">
            {isEnglish ? "4.9/5 from 2+ reviews" : "4,9/5 d'après plus de 2 avis"}
          </span>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
