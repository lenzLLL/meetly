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
  
  // Fonction pour générer un avatar avec initiales
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Fonction pour générer une couleur basée sur le nom
  const getAvatarColor = (name: string): string => {
    const colors = [
      'from-violet-600 to-purple-600',
      'from-blue-600 to-cyan-600',
      'from-pink-600 to-rose-600',
      'from-orange-600 to-red-600',
      'from-green-600 to-emerald-600',
      'from-indigo-600 to-purple-600'
    ]
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  if (!user) {
    return (
      <>
        <AppHeader/>
        <div className="space-y-4 p-10">
          {[1,2,3].map(i => (
            <div
              key={i}
              className="bg-gradient-to-br from-violet-900/10 to-purple-900/10 rounded-2xl p-5 border border-violet-500/20 animate-pulse backdrop-blur-md"
            >
              <div className="h-5 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-full w-48 mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full w-2/3 mb-3"></div>
              <div className="h-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full w-1/3"></div>
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
          <style>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-slide-in {
              animation: fade-in 0.5s ease-out;
            }
          `}</style>
          <div className="flex items-center justify-between mb-8 animate-slide-in">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">{t('SubaccountsCount', { count: user.subaccounts.length })}</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mt-2"></div>
            </div>
            <CreateSubaccountButton
              user={user}
              className="w-[200px] self-end cursor-pointer"
              id={""}
            />
          </div>

          <Command className="rounded-2xl bg-transparent border border-violet-500/20">
            <CommandInput placeholder={t('SearchPlaceholder')} className="placeholder:text-violet-400/50" />
            <CommandList>
              <CommandEmpty>{t('NoResults')}</CommandEmpty>
              <CommandGroup heading={t('SubAccountsGroup')}>
                {user.subaccounts.length ? (
                  user.subaccounts.map((sub: any) => (
                    <CommandItem
                      key={sub.id}
                      className="flex items-center py-10 h-32 !bg-gradient-to-br from-violet-600/20 to-purple-600/20 my-2 text-primary border border-violet-500/30 p-4 rounded-2xl hover:border-violet-500/50 hover:from-violet-600/30 hover:to-purple-600/30 cursor-pointer transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-violet-500/20 animate-slide-in"
                    >
                      <div className="flex items-center gap-4 w-full h-full">
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarColor(sub.name)} flex items-center justify-center shadow-lg`}>
                            <span className="text-2xl font-bold text-white">{getInitials(sub.name)}</span>
                          </div>
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
                          className="ml-2"
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
                          <AlertDialogAction className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 rounded-lg shadow-lg hover:shadow-violet-500/40 transition-all duration-300">
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
