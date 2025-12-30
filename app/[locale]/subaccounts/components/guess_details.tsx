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

    return null
}
