'use client'

import { UserButton } from '@clerk/nextjs'
import React from 'react'

function AppHeader() {
  return (
    <header className="border-b sticky z-1 top-0 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] backdrop-blur-xl px-6 py-4.5 flex justify-end items-center">
      {/* <h1 className="text-xl font-semibold text-foreground">
        MeetingBot
      </h1> */}

      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}

export default AppHeader
