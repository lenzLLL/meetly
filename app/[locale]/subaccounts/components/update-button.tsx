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
  data:any
}

const UpdateSubaccountButton = ({data }: Props) => {
  const { setOpen } = useModal()


  return (
    <Button
    size={'sm'}
      className='mr-2'
      onClick={() => {
        setOpen(
          <CustomModal
            title="Update a Subaccount"
            subheading="Enter the new informations"
          >
            <SubAccountDetails
              details = {data}           />
          </CustomModal>
        )
      }}
    >
      Update
    </Button>
  )
}

export default UpdateSubaccountButton