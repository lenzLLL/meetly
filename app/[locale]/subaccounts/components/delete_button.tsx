'use client'

import { deleteSubAccount } from '@/lib/action'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  subaccountId: string
}

const DeleteButton = ({ subaccountId }: Props) => {
  const router = useRouter()
  const t = useTranslations('Subaccounts') // Section pour toutes les actions liées aux sous-comptes

  const handleDelete = async () => {
    await deleteSubAccount({ id: subaccountId })
    router.refresh()
  }

  return (
    <div
      onClick={handleDelete}
      className="text-red-500 hover:text-red-600 cursor-pointer text-sm font-medium"
    >
      {t('DeleteSubaccountButton')}
    </div>
  )
}

export default DeleteButton
