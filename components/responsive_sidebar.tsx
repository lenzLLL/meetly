"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"

export function ResponsiveSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bouton menu mobile */}
      <div className="sm:hidden fixed top-3 left-3 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[80%] sm:w-64 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] border-none"
          >
            <AppSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden sm:block">
        <AppSidebar />
      </div>
    </>
  )
}
