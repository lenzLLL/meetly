// components/meetings/permissions-modal.tsx
"use client"

import CustomModal from "../subaccounts/components/custom_modal"
import MeetingPermissionList from "../subaccounts/components/guess_details"
import { useModal } from "../subaccounts/components/modal_provider"
import { useTranslations } from "next-intl"

export default function PermissionsModal({ meetingId }: { meetingId: string }) {
  const { data } = useModal()
  const t = useTranslations("Meetings") // 🈯️ Section des traductions

  const meeting = data.meeting
  if (!meeting) return null

  const subaccounts = meeting.subaccounts || []
  const initialAllowed = meeting.permissions || []

  return (
    <CustomModal
      title={meeting.title ?? t("ManagePermissions")}
      subheading={t("SelectSubaccounts")}
    >
      <MeetingPermissionList
      />
    </CustomModal>
  )
}
