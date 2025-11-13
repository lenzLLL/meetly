'use client'

import { Button } from '@/components/ui/button'
import { Subaccount } from '@prisma/client'
import { UserPlus } from 'lucide-react'
import { useModal } from './modal_provider'
import CustomModal from './custom_modal'
import MeetingPermissionList from './guess_details'
import { useTranslations } from 'next-intl'

type Props = {
  subaccounts: Subaccount[]
  meetingId: string
  initialAllowed: Subaccount[]
}

const AddGuestButton = ({ subaccounts, meetingId, initialAllowed }: Props) => {
  const { setOpen } = useModal()
  const t = useTranslations("Meetings") // 🈯️ Section pour les textes de réunions

  return (
    <Button
      onClick={() => {
        setOpen(
          <CustomModal
            title={t("MeetingPermissionsTitle")}
            subheading={t("MeetingPermissionsSubheading")}
          >
            <MeetingPermissionList />
          </CustomModal>,
          async () => {
            const res = await fetch(`/api/meetings/${meetingId}`)
            const data = await res.json()
            return { meeting: data }
          }
        )
      }}
      className="mt-3 w-auto text-xs h-7 cursor-pointer"
    >
      <UserPlus />
    </Button>
  )
}

export default AddGuestButton
