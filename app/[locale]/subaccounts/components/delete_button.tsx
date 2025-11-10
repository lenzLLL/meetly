'use client'
import {
  deleteSubAccount,
} from '@/lib/action'
import { useRouter } from 'next/navigation'
import React from 'react'

type Props = {
  subaccountId: string
}

const DeleteButton = ({ subaccountId }: Props) => {
  const router = useRouter()

  return (
    <div
      className="text-white"
      onClick={async () => {
        await deleteSubAccount({id:subaccountId})
        router.refresh()
      }}
    >
      Delete Sub Account
    </div>
  )
}

export default DeleteButton