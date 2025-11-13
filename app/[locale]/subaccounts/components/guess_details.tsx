"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use_toast"
import { Subaccount } from "@prisma/client"
import { useModal } from "./modal_provider"
import { useTranslations } from "next-intl"

export default function MeetingPermissionList() {
  const { data } = useModal()
  const { toast } = useToast()
  const t = useTranslations("Meetings") // 🈯️ Section des traductions

  const meeting = data.meeting

  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [allowed, setAllowed] = useState<Subaccount[]>([])

  // Charger les données du meeting
  useEffect(() => {
    if (meeting) {
      setSubaccounts(meeting.subaccounts || [])
      setAllowed(meeting.permissions || [])
    }
  }, [meeting])

  // Si pas de meeting
  if (!meeting) {
    return <p className="text-muted">{t("NoMeetingLoaded")}</p>
  }

  const meetingId = meeting.id

  const togglePermission = async (sub: Subaccount) => {
    const hasPermission = allowed.some(a => a.id === sub.id)

    setAllowed(prev =>
      hasPermission ? prev.filter(a => a.id !== sub.id) : [...prev, sub]
    )

    try {
      const res = await fetch(`/api/meetings/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subaccountId: sub.id,
          allowed: !hasPermission,
          meetingId
        }),
      })

      if (!res.ok) throw new Error()

      toast({ title: t("PermissionsUpdated") })
    } catch {
      setAllowed(prev =>
        hasPermission ? [...prev, sub] : prev.filter(a => a.id !== sub.id)
      )
      toast({
        title: t("Error"),
        description: t("PermissionUpdateFailed"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-2">
      {subaccounts.map(sub => {
        const isAllowed = allowed.some(a => a.id === sub.id)

        return (
          <div
            key={sub.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div>
              <p>{sub.name}</p>
              <p className="text-sm text-muted-foreground">{sub.email}</p>
            </div>
            <Switch
              checked={isAllowed}
              onCheckedChange={() => togglePermission(sub)}
            />
          </div>
        )
      })}
    </div>
  )
}
