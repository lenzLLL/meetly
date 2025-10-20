"use client"
import { useEffect,useState } from "react";
import CTASection from "@/components/landing/CTASection";
import FeaturesSection from "@/components/landing/featuresSection";
import Footer from "@/components/landing/Footer";
import Herosection from "@/components/landing/herosection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import IntegrationSection from "@/components/landing/integrationSection";
import MoreFeaturesSection from "@/components/landing/MoreFeaturesSection";
import StatsSection from "@/components/landing/StatsSection";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@/hooks/use-user";

export default function Home() {
  const {isSignedIn,isLoaded} = useAuth()
  const {saveUser} = useUser()
  const SaveUser = async () =>{
        await SaveUser()
  }
  useEffect(
    ()=>{
        if(isSignedIn){
              saveUser()
        }
          
    },[isSignedIn,isLoaded]
  )
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
// https://trello.com/power-ups/68ec54cf4d728c8db60b1236/edit/api-key
// atlassian
// https://developer.atlassian.com/console/myapps/4b5813b9-af13-40c2-bade-d51cb2229fa9/permissions