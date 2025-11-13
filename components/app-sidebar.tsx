"use client"

import { Bot, DollarSign, Home, Layers3, Settings, Users, Video } from "lucide-react"
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
    { title: t("Integrations"), url: "/integrations", icon: Layers3 },
    { title: t("Settings"), url: "/settings", icon: Settings },
    { title: t("ChatWithAI"), url: "/chat", icon: Bot },
    { title: t("Subaccounts"), url: "/subaccounts", icon: Users },
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
      className="border-r border-sidebar-border h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-600 text-sidebar-primary-foreground">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Synopsia</span>
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
                      w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                      hover:bg-purple-700/70 hover:text-sidebar-accent-foreground
                      data-[active=true]:bg-gradient-to-r data-[active=true]:from-purple-500 data-[active=true]:to-purple-700
                      data-[active=true]:text-sidebar-primary-foreground
                      active:bg-purple-800/70 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-0
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
      <SidebarFooter className="p-4 mt-auto">
        {usage && (
          <div className="rounded-lg bg-[#1a0b2e]/70 backdrop-blur-md border border-[#3b186b]/40 p-3 mb-3">
            <p className="text-xs font-medium text-sidebar-accent-foreground mb-3">
              {t("CurrentPlan")}: {usage.currentPlan.toUpperCase()}
            </p>

            {/* Meetings */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-sidebar-accent-foreground/70">
                  {t("Meetings")}
                </span>
                <span className="text-xs text-sidebar-accent-foreground/50">
                  {usage.meetingsThisMonth}/
                  {limits.meetings === -1 ? t("Unlimited") : limits.meetings}
                </span>
              </div>
              {limits.meetings !== -1 ? (
                <div className="w-full bg-sidebar-accent/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#6a0dad] to-[#5f24e7] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${meetingProgress}%` }}
                  />
                </div>
              ) : (
                <div className="text-xs text-sidebar-accent-foreground/50 italic">
                  {t("Unlimited")}
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-sidebar-accent-foreground/70">
                  {t("ChatMessages")}
                </span>
                <span className="text-xs text-sidebar-accent-foreground/70">
                  {usage.chatMessagesToday}/
                  {limits.chatMessages === -1 ? t("Unlimited") : limits.chatMessages}
                </span>
              </div>
              {limits.chatMessages !== -1 ? (
                <div className="w-full bg-sidebar-accent/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#6a0dad] to-[#5f24e7] h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${chatProgress}%` }}
                  />
                </div>
              ) : (
                <div className="text-xs text-sidebar-accent-foreground/50 italic">
                  {t("Unlimited")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Info */}
        {upgradeInfo && (
          <div className="rounded-lg bg-[#1a0b2e]/70 backdrop-blur-md border border-[#3b186b]/40 p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-sidebar-accent-foreground">
                  {upgradeInfo.title}
                </p>
                <p className="text-xs text-sidebar-accent-foreground/70">
                  {upgradeInfo.description}
                </p>
              </div>
              {upgradeInfo.showButton ? (
                <Link href="/pricing">
                  <Button className="w-full rounded-md bg-gradient-to-r from-[#6a0dad] to-[#5f24e7] px-3 py-2 text-xs font-medium text-sidebar-primary-foreground transition-colors hover:opacity-90 cursor-pointer">
                    {upgradeInfo.title}
                  </Button>
                </Link>
              ) : (
                <div className="text-center py-2">
                  <span className="text-xs text-sidebar-accent-foreground/60">
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
