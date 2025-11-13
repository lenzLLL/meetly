'use client'

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import Image from "next/image"
import AppHeader from "@/components/Header"
import { useTranslations } from "next-intl"
import CreateSubaccountButton from "./create-button"
import UpdateSubaccountButton from "./update-button"
import DeleteButton from "./delete_button"

type Props = {
  user: any
}

const AllSubAccountsPage = ({ user }: Props) => {
  const t = useTranslations("Subaccounts") // 🔹 Hook client pour traduction
  const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAMAAABC4vDmAAA..."

  if (!user) {
    return (
      <>
        <AppHeader/>
        <div className="space-y-4 p-10">
          {[1,2,3].map(i => (
            <div
              key={i}
              className="bg-[#130a22]/70 rounded-xl p-5 border border-white/5 animate-pulse"
            >
              <div className="h-5 bg-white/10 rounded w-48 mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-2/3 mb-3"></div>
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <AlertDialog>
        <div className="flex flex-col p-10">
          <div className="flex items-center justify-between">
            <span>{t('SubaccountsCount', { count: user.subaccounts.length })}</span>
            <CreateSubaccountButton
              user={user}
              className="w-[200px] self-end m-6 cursor-pointer"
              id={""}
            />
          </div>

          <Command className="rounded-lg bg-transparent">
            <CommandInput placeholder={t('SearchPlaceholder')} />
            <CommandList>
              <CommandEmpty>{t('NoResults')}</CommandEmpty>
              <CommandGroup heading={t('SubAccountsGroup')}>
                {user.subaccounts.length ? (
                  user.subaccounts.map((sub: any) => (
                    <CommandItem
                      key={sub.id}
                      className="flex items-center py-10 h-32 !bg-[#1a0b2e]/70 my-2 text-primary border-[1px] border-border p-4 rounded-lg hover:!bg-[#1a0b2e]/80 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4 w-full h-full">
                        <div className="relative">
                          <Image
                            src={placeholderImage}
                            alt={t('SubaccountLogo')}
                            width={100}
                            height={100}
                            className="rounded-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-between">
                          <div className="flex flex-col">
                            {sub.name}
                            <span className="text-muted-foreground text-xs">
                              {sub.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <UpdateSubaccountButton data={sub} />
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-20 hover:bg-red-600 hover:text-white !text-white"
                        >
                          {t('DeleteButton')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-left">{t('DeleteTitle')}</AlertDialogTitle>
                          <AlertDialogDescription className="text-left">{t('DeleteDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex items-center">
                          <AlertDialogCancel className="mb-2">{t('Cancel')}</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive hover:bg-destructive">
                            <DeleteButton subaccountId={sub.id} />
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </CommandItem>
                  ))
                ) : (
                  <div className="text-muted-foreground text-center p-4">{t('NoSubaccounts')}</div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </AlertDialog>
    </>
  )
}

export default AllSubAccountsPage
