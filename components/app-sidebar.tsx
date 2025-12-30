"use client"

import { Bot, DollarSign, Home, Layers3, Settings, Users, Video, Mic } from "lucide-react"
import { usePathname } from "next/navigation"
import { useUsage } from "../context/UsageContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function AppSidebar() {
  const t = useTranslations("Sidebar") // ✅ Hook de traduction
  const pathname = usePathname()
  const { usage, limits } = useUsage()
  const locale = pathname.split("/")[1]

  const items = [
    { title: t("Home"), url: "/home", icon: Home },
    { title: t("Recording"), url: "/recording", icon: Mic },
    { title: t("Integrations"), url: "/integrations", icon: Layers3 },
    { title: t("Settings"), url: "/settings", icon: Settings },
    { title: t("ChatWithAI"), url: "/chat", icon: Bot },
    // Subaccounts removed
    { title: t("Meetings"), url: "/meetings", icon: Video },
    { title: t("Pricing"), url: "/pricing", icon: DollarSign },
  ]

  const meetingProgress =
    usage && limits.meetings !== -1
      ? Math.min((usage.meetingsThisMonth / limits.meetings) * 100, 100)
      : 0

  const chatProgress =
    usage && limits.chatMessages !== -1
      ? Math.min((usage.chatMessagesToday / limits.chatMessages) * 100, 100)
      : 0

  const getUpgradeInfo = () => {
    if (!usage) return null

    switch (usage.currentPlan) {
      case "free":
        return {
          title: t("UpgradeToStarter"),
          description: t("StarterDescription"),
          showButton: true,
        }
      case "starter":
        return {
          title: t("UpgradeToPro"),
          description: t("ProDescription"),
          showButton: true,
        }
      case "pro":
        return {
          title: t("UpgradeToPremium"),
          description: t("PremiumDescription"),
          showButton: true,
        }
      case "premium":
        return {
          title: t("OnPremium"),
          description: t("PremiumEnjoy"),
          showButton: false,
        }
      default:
        return {
          title: t("UpgradeYourPlan"),
          description: t("GetMoreFeatures"),
          showButton: true,
        }
    }
  }

  const upgradeInfo = getUpgradeInfo()

  return (
    <Sidebar
      collapsible="none"
      className="border-r border-violet-500/20 h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]"
    >
      <style>{`
        @keyframes subtle-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.2); }
        }
        .sidebar-card {
          animation: subtle-glow 3s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <SidebarHeader className="border-b border-violet-500/20 p-4">
        <div className="flex items-center gap-2">
            <img src={"/c.png"} className='w-[100px]'/>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="flex-1 p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/${locale}` + item.url}
                    className="
                      w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-all
                      text-gray-300 hover:text-white
                      hover:bg-gradient-to-r hover:from-violet-600/40 hover:to-purple-600/40 hover:border hover:border-violet-500/30
                      data-[active=true]:bg-gradient-to-r data-[active=true]:from-violet-600 data-[active=true]:to-purple-600
                      data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-violet-500/30
                      focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-0
                    "
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 mt-auto space-y-3">
        {usage && (
          <div className="sidebar-card rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/30 backdrop-blur-md border border-violet-500/30 p-4">
            <p className="text-xs font-semibold text-violet-300 mb-4 tracking-wide">
              {t("CurrentPlan")}: <span className="text-violet-200">{usage.currentPlan.toUpperCase()}</span>
            </p>

            {/* Meetings */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-violet-300/80">
                  {t("Meetings")}
                </span>
                <span className="text-xs text-violet-300/50">
                  {usage.meetingsThisMonth}/
                  {limits.meetings === -1 ? t("Unlimited") : limits.meetings}
                </span>
              </div>
              {limits.meetings !== -1 ? (
                <div className="w-full bg-violet-500/20 rounded-full h-2.5 overflow-hidden border border-violet-500/10">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-violet-500/50"
                    style={{ width: `${meetingProgress}%` }}
                  />
                </div>
              ) : (
                <div className="text-xs text-violet-300/50 italic">
                  {t("Unlimited")}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-violet-300/80">
                  {t("ChatMessages")}
                </span>
                <span className="text-xs text-violet-300/50">
                  {usage.chatMessagesToday}/
                  {limits.chatMessages === -1 ? t("Unlimited") : limits.chatMessages}
                </span>
              </div>
              {limits.chatMessages !== -1 ? (
                <div className="w-full bg-violet-500/20 rounded-full h-2.5 overflow-hidden border border-violet-500/10">
                  <div
                    className="bg-gradient-to-r from-violet-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out shadow-lg shadow-violet-500/50"
                    style={{ width: `${chatProgress}%` }}
                  />
                </div>
              ) : (
                <div className="text-xs text-violet-300/50 italic">
                  {t("Unlimited")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Info */}
        {upgradeInfo && (
          <div className="sidebar-card rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/30 backdrop-blur-md border border-violet-500/30 p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-violet-200">
                  {upgradeInfo.title}
                </p>
                <p className="text-xs text-violet-300/70">
                  {upgradeInfo.description}
                </p>
              </div>
              {upgradeInfo.showButton ? (
                <Link href="/pricing">
                  <Button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 px-3 py-2.5 text-xs font-semibold text-white transition-all shadow-lg hover:shadow-violet-500/40 hover:scale-105 cursor-pointer">
                    {upgradeInfo.title}
                  </Button>
                </Link>
              ) : (
                <div className="text-center py-3 bg-gradient-to-r from-violet-600/20 to-purple-600/20 rounded-lg border border-violet-500/20">
                  <span className="text-xs text-violet-300 font-medium">
                    🎉 {t("ThankYou")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
