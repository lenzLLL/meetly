'use client'

import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { ResponsiveSidebar } from "./responsive_sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { isSignedIn } = useAuth()

   const showSidebar =
  pathname !== "/fr" &&
  pathname !== "/en" &&
  !(pathname.startsWith("/meeting/") && !isSignedIn);
    if (!showSidebar) {
        return <div className="min-h-screen">{children}</div>
    }

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] h-screen w-full">
                 <ResponsiveSidebar /> 
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}