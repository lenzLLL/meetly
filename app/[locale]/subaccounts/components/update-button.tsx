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
      className="mr-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300"
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
