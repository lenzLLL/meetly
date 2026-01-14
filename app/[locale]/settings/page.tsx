'use client'

import AppHeader from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutButton, useAuth, useUser } from '@clerk/nextjs'
import { Bot, LogOut, Save, Upload, User, Bell, Lock, Zap, Database, Slack, Check, X, ChevronDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SUPPORTED_LOCALES } from '@/lib/buildLocalizedPath'
import { useUsers } from '@/hooks/use-user'
import { useToast } from '@/components/ui/use_toast'
import { Checkbox } from '@/components/ui/checkbox'

function Settings() {
  const t = useTranslations('Settings')
  const { toast } = useToast()
  const { user } = useUser()
  const { userId } = useAuth()
  const [botName, setBotName] = useState('Meeting Bot')
  const [value,setValue] = useState("")
  const [botImageUrl, setBotImageUrl] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState('free')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    notifications: true,
    integrations: false,
    storage: false,
    privacy: false,
  })
  const [notifications, setNotifications] = useState({
    emailAfterTranscription: true,
    emailWeeklySummary: true,
    emailMeetingReminders: false,
  })
  const [integrations, setIntegrations] = useState({
    slack: false,
  })
  
  useEffect(() => {
    if (userId) fetchBotSettings()
  }, [userId])
  const {lang,saveLang} = useUsers()
  const fetchBotSettings = async () => {
    try {
      const response = await fetch('/api/user/bot-settings')
      if (response.ok) {
          const data = await response.json()
          setBotName(data.botName || t('defaultBotName'))
          setBotImageUrl(data.botImageUrl || null)
          setUserPlan(data.plan || 'free')
          if (data.lang) setValue(data.lang)
      }
    } catch (error) {
      console.error('error fetching bot settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBotNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBotName(e.target.value)
    setHasChanges(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/upload/bot-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (response.ok) {
        setBotImageUrl(data.url)
        setHasChanges(true)
      } else {
        console.error('image upload failed:', data.error)
      }
    } catch (error) {
      console.error('image upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const saveBotSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/bot-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botName, botImageUrl }),
      })
      if (response.ok) setHasChanges(false)
    } catch (error) {
      console.error('error saving bot settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getPlanDisplayName = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'free': return t('plans.free')
      case 'starter': return t('plans.starter')
      case 'pro': return t('plans.pro')
      case 'premium': return t('plans.premium')
      default: return t('plans.invalid')
    }
  }

  const getPlanColor = (plan: string) => {
    return plan.toLowerCase() === 'free'
      ? 'bg-gray-500/20 text-gray-400'
      : 'bg-green-500/20 text-green-400'
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const SettingSection = ({ title, icon: Icon, section }: { title: string; icon: React.ReactNode; section: string }) => {
    const isExpanded = expandedSections[section]
    return (
      <div className='mb-4'>
        <button
          onClick={() => toggleSection(section)}
          className='w-full flex items-center justify-between p-4 bg-[#1a0b2e]/70 rounded-lg border border-border/50 hover:border-border transition-colors'
        >
          <div className='flex items-center gap-3'>
            <div className='text-primary'>{Icon}</div>
            <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
          </div>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded && (
          <div className='mt-2 p-4 bg-[#1a0b2e]/50 rounded-lg border border-border/30'>
            {section === 'notifications' && (
              <div className='space-y-4'>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <Checkbox checked={notifications.emailAfterTranscription} onChange={() => handleNotificationChange('emailAfterTranscription')} />
                  <span className='text-sm text-foreground'>Email après transcription</span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <Checkbox checked={notifications.emailWeeklySummary} onChange={() => handleNotificationChange('emailWeeklySummary')} />
                  <span className='text-sm text-foreground'>Résumé hebdomadaire</span>
                </label>
                <label className='flex items-center gap-3 cursor-pointer'>
                  <Checkbox checked={notifications.emailMeetingReminders} onChange={() => handleNotificationChange('emailMeetingReminders')} />
                  <span className='text-sm text-foreground'>Rappels de réunion</span>
                </label>
              </div>
            )}
            {section === 'integrations' && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-[#0e001a]/50 rounded-lg border border-border/20'>
                  <div className='flex items-center gap-3'>
                    <Slack className='h-5 w-5 text-blue-400' />
                    <div>
                      <p className='font-medium text-foreground'>Slack</p>
                      <p className='text-xs text-muted-foreground'>Notifications et partage</p>
                    </div>
                  </div>
                  <Button size='sm' variant={integrations.slack ? 'default' : 'outline'}>
                    {integrations.slack ? 'Connecté' : 'Connecter'}
                  </Button>
                </div>
              </div>
            )}
            {section === 'storage' && (
              <div className='space-y-4'>
                <div className='bg-[#0e001a]/50 rounded-lg p-4 border border-border/20'>
                  <p className='text-sm text-muted-foreground mb-3'>Utilisation du stockage</p>
                  <div className='w-full bg-[#1a0b2e] rounded-full h-2 overflow-hidden'>
                    <div className='bg-gradient-to-r from-[#6a0dad] to-[#5f24e7] h-full' style={{width: '65%'}} />
                  </div>
                  <p className='text-xs text-foreground mt-2'>650 MB / 1 GB utilisé</p>
                </div>
                <div className='grid grid-cols-3 gap-3'>
                  <div className='bg-[#0e001a]/50 rounded-lg p-3 border border-border/20'>
                    <p className='text-xs text-muted-foreground'>Réunions</p>
                    <p className='text-lg font-bold text-foreground'>24</p>
                  </div>
                  <div className='bg-[#0e001a]/50 rounded-lg p-3 border border-border/20'>
                    <p className='text-xs text-muted-foreground'>Enregistrements</p>
                    <p className='text-lg font-bold text-foreground'>12</p>
                  </div>
                  <div className='bg-[#0e001a]/50 rounded-lg p-3 border border-border/20'>
                    <p className='text-xs text-muted-foreground'>Stockage utilisé</p>
                    <p className='text-lg font-bold text-foreground'>650 MB</p>
                  </div>
                </div>
                <Button variant='outline' size='sm' className='w-full'>Exporter les données</Button>
              </div>
            )}
            {section === 'privacy' && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-[#0e001a]/50 rounded-lg border border-border/20'>
                  <div>
                    <p className='font-medium text-foreground'>Sessions actives</p>
                    <p className='text-xs text-muted-foreground'>1 session en cours</p>
                  </div>
                  <Button size='sm' variant='outline'>Voir</Button>
                </div>
                <div className='flex items-center justify-between p-3 bg-[#0e001a]/50 rounded-lg border border-border/20'>
                  <div>
                    <p className='font-medium text-foreground'>Historique d\'activité</p>
                    <p className='text-xs text-muted-foreground'>Voir votre historique</p>
                  </div>
                  <Button size='sm' variant='outline'>Afficher</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] min-h-screen flex items-center justify-center p-6'>
        <div className='flex flex-col items-center justify-center'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mb-4'></div>
          <div className='text-foreground'>{t('loading')}</div>
        </div>
      </div>
    )
  }
  const onChangeValue = async (v:string) => {
      setValue(v)
      await saveLang(v)  
      toast({ title: t("updated") })

  }
  return (
    <>
      <AppHeader />
      <div className='mt-5 sm:mt-0 min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] p-6'>
        <div className='max-w-2xl mx-auto'>
          <h1 className='text-2xl font-bold text-foreground mb-8 text-center'>{t('title')}</h1>

          {/* User Info Card */}
          <div className='relative bg-[#1a0b2e]/70 backdrop-blur-sm rounded-lg p-6 border border-border/50 mb-8 shadow-xl shadow-black/10'>
            <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none'></div>
            <div className='relative'>
              <div className='flex items-center gap-4 mb-4'>
                <div className='w-16 h-16 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-primary/20'>
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="profile" className='w-16 h-16 rounded-full object-cover' />
                  ) : (
                    <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center '>
                      <User className='h-8 w-8 text-primary' />
                    </div>
                  )}
                </div>
                <h2 className='text-lg font-semibold text-foreground'>{user?.fullName || t('defaultUser')}</h2>
              </div>
              <div className='flex justify-between items-start '>
                <div>
                  <span className='text-sm bg-gradient-to-r from-[#6a0dad] to-[#5f24e7] text-muted-foreground px-2 py-1 rounded-full'>EMAIL</span>
                  <p className='text-sm text-foreground mt-1'>{user?.primaryEmailAddress?.emailAddress || t('noEmail')}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getPlanColor(userPlan)}`}>{getPlanDisplayName(userPlan)}</span>
              </div>
            </div>
          </div>

          {/* Bot Customization */}
          <div className='bg-[#1a0b2e]/70 rounded-lg p-6 border border-border mb-6'>
            <h3 className='text-lg font-semibold text-foreground mb-4 flex items-center gap-2'>
              <Bot className='h-5 w-5 text-primary' /> {t('botCustomization')}
            </h3>

            <div className='mb-6'>
              <Label htmlFor='bot-name' className='block text-sm font-medium text-foreground mb-2'>{t('botName')}</Label>
              <Input id='bot-name' type='text' value={botName} onChange={handleBotNameChange} placeholder={t('botNamePlaceholder')} />
            </div>
              <Label htmlFor='bot-name' className='block text-sm font-medium text-foreground mb-2'>{t('botLang')}</Label>
                <Select value={value || lang} onValueChange={(v) => onChangeValue(v)}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder={t('botL')} />
                 </SelectTrigger>
                 <SelectContent>
                   {SUPPORTED_LOCALES.map((lc) => {
                     const labelMap: Record<string, string> = {
                       en: t('botEn'),
                       fr: t('botFr'),
                       es: 'Español',
                       de: 'Deutsch',
                       it: 'Italiano',
                       pt: 'Português',
                     }
                     const label = (labelMap as any)[lc] || lc
                     return (
                       <SelectItem key={lc} value={lc}>
                         {label}
                       </SelectItem>
                     )
                   })}
                 </SelectContent>
               </Select>

            {hasChanges && (
              <Button onClick={saveBotSettings} disabled={isSaving} className='inline-flex items-center gap-2 mb-6 cursor-pointer'>
                <Save className='h-4 w-4' /> {isSaving ? t('saving') : t('saveChanges')}
              </Button>
            )}
          </div>

          {/* Sign Out */}
          <div className='bg-[#1a0b2e]/70 rounded-lg p-6 border border-border/50'>
            <div className='pt-4 border-t border-border'>
              <SignOutButton>
                <Button variant='destructive' className='inline-flex items-center gap-2 cursor-pointer'>
                  <LogOut className='h-4 w-4' /> {t('signOut')}
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
