'use client'
import { Button } from '@/components/ui/button'
import { Subaccount } from '@prisma/client'
import { PlusCircleIcon } from 'lucide-react'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import CustomModal from './custom_modal'
import SubAccountDetails from './subaccountDetails'
import { useModal } from './modal_provider'
import { useTranslations } from 'next-intl'

type Props = {
  data: Subaccount
}

const UpdateSubaccountButton = ({ data }: Props) => {
  const { setOpen } = useModal()
  const t = useTranslations('Subaccounts')

  return (
    <Button
      size="sm"
      className="mr-2"
      onClick={() => {
        setOpen(
          <CustomModal
            title={t('UpdateTitle')}
            subheading={t('UpdateSubtitle')}
          >
            <SubAccountDetails details={data} />
          </CustomModal>
        )
      }}
    >
      {t('UpdateButton')}
    </Button>
  )
}

export default UpdateSubaccountButton
