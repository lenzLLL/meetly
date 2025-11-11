// components/meetings/attendee-list.tsx
"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

interface AttendeeListProps {
  attendees: string[]
  meeting: { id: string; title?: string; description?: string | null }
}

export default function AttendeeList({ attendees, meeting }: AttendeeListProps) {
  return (
    <div className="space-y-4">

      <div className="mt-2 space-y-2">
        {attendees && attendees.length ? (
          attendees.map((email) => (
            <div key={email} className="flex items-center gap-2">
              <Badge className="bg-slate-600">{email}</Badge>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">No attendees</div>
        )}
      </div>
    </div>
  )
}
