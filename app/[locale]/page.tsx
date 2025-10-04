import CTASection from "@/components/landing/CTASection";
import FeaturesSection from "@/components/landing/featuresSection";
import Footer from "@/components/landing/Footer";
import Herosection from "@/components/landing/herosection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import IntegrationSection from "@/components/landing/integrationSection";
import MoreFeaturesSection from "@/components/landing/MoreFeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import Image from "next/image";

export default function Home() {
  return (
      <div className="bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] min-h-screen ">
          <Herosection/>
          <FeaturesSection/>
          <IntegrationSection/>
          <HowItWorksSection/>
          <StatsSection/>
          <MoreFeaturesSection/>
          <CTASection/>
          <Footer/>
      </div>
  );
}
