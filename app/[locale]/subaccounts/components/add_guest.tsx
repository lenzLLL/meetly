'use client'
import { Button } from '@/components/ui/button'

import {Subaccount, User } from '@prisma/client'
import { PlusCircleIcon, UserPlus } from 'lucide-react'
import React,{useEffect} from 'react'
import { twMerge } from 'tailwind-merge'
import CustomModal from './custom_modal'
import SubAccountDetails from './subaccountDetails'
import { useModal } from './modal_provider'
import MeetingPermissionList from './guess_details'

type Props = {
  subaccounts:Subaccount[],
  meetingId:string,
  initialAllowed:Subaccount[]
}

const AddGuestButton = ({ subaccounts,meetingId,initialAllowed }: Props) => {
  const { setOpen } = useModal()

  
  return (
      <Button 
            onClick={() => {
        setOpen(
          <CustomModal
            title="Meeting Permissions"
            subheading="Select the participants who will be able to view this meeting’s information."
          >
            <MeetingPermissionList  />
          </CustomModal>,    async () => {
              // ✅ On récupère tout : meeting + user + subaccounts + permissions
              const res = await fetch(`/api/meetings/${meetingId}`)
              const data = await res.json()

              // ✅ Doit retourner { meeting: {...} }
              return { meeting: data }
            }
        )
      }}
      className="mt-3 w-auto  text-xs h-7 cursor-pointer">
                                       <UserPlus/>  
      </Button>

  )
}

export default AddGuestButton