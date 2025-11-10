'use client'
import { Button } from '@/components/ui/button'

import {Subaccount, User } from '@prisma/client'
import { PlusCircleIcon } from 'lucide-react'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import CustomModal from './custom_modal'
import SubAccountDetails from './subaccountDetails'
import { useModal } from './modal_provider'

type Props = {
  user: User 
  id: string
  className: string
}

const CreateSubaccountButton = ({ className, id, user }: Props) => {
  const { setOpen } = useModal()


  return (
    <Button
      className={twMerge('w-full flex gap-4', className)}
      onClick={() => {
        setOpen(
          <CustomModal
            title="Create a Subaccount"
            subheading="enter name and email to save subaccount"
          >
            <SubAccountDetails
              userId={user.id} userName={''}            />
          </CustomModal>
        )
      }}
    >
      <PlusCircleIcon size={15} />
      Create Sub Account
    </Button>
  )
}

export default CreateSubaccountButton