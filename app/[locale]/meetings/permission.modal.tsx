// components/meetings/permissions-modal.tsx
"use client"

import CustomModal from "../subaccounts/components/custom_modal"
import MeetingPermissionList from "../subaccounts/components/guess_details"
import { useModal } from "../subaccounts/components/modal_provider"

export default function PermissionsModal({ meetingId }: { meetingId: string }) {
  const { data } = useModal()

  const meeting = data.meeting
  if (!meeting) return null

  const subaccounts = meeting.subaccounts || []
  const initialAllowed = meeting.permissions || []

  return (
    <CustomModal
      title={meeting.title ?? "Manage Permissions"}
      subheading="Select which subaccounts can view this meeting's information."
    >
      <MeetingPermissionList
        
   
      />
    </CustomModal>
  )
}
