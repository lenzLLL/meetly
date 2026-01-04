'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Check, Eye, Share2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface MeetingHeaderProps {
  title: string
  meetingId?: string
  summary?: string
  actionItems?: string
  isOwner: boolean
  isLoading?: boolean
  shared?: boolean
  sharedBy?: string | null
}

function MeetingHeader({
  title,
  meetingId,
  summary,
  actionItems,
  isOwner,
  isLoading = false,
  shared,
  sharedBy,
}: MeetingHeaderProps) {
  const t = useTranslations('Meetings')
  const [isPosting, setIsPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareLang, setShareLang] = useState<'en'|'fr'|'es'|'de'|'pt'|'it'>('en')
  const [isSharing, setIsSharing] = useState(false)
  const router = useRouter()

  const handlePostToSlack = async () => {
    if (!meetingId) return

    try {
      setIsPosting(true)

      toast(`✅ ${t('postedToSlack')}`, {
        action: { label: 'OK', onClick: () => {} },
      })

      const response = await fetch('/api/slack/post-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          summary: summary || t('noSummary'),
          actionItems: actionItems || t('noActions'),
        }),
      })

      await response.json()
    } catch (error) {
      console.error(error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleShare = async () => {
    // open share modal for email entry
    setShowShareModal(true)
  }

  const submitShare = async () => {
    if (!meetingId || !shareEmail.includes('@')) {
      toast('Invalid email')
      return
    }
    try {
      setIsSharing(true)
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, email: shareEmail, language: shareLang }),
      })
      const j = await res.json()
      if (res.ok) {
        toast(`✅ ${t('share_sent') || 'Shared'}`)
        setShowShareModal(false)
        setShareEmail('')
      } else if (res.status === 409) {
        toast(t('AlreadyShared') || 'This email already has access', { duration: 4000 })
      } else {
        toast(j.error || 'Failed to share')
      }
    } catch (err) {
      console.error('share error', err)
      toast('Failed to share')
    } finally {
      setIsSharing(false)
    }
  }

  const handleDelete = async () => {
    if (!meetingId) return
    try {
      setIsDeleting(true)
      toast(`✅ ${t('meetingDeleted')}`, {
        action: { label: 'OK', onClick: () => {} },
      })

      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      await response.json()
      if (response.ok) router.push('/home')
    } catch (error) {
      console.error('delete error', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border-b border-gray-800 bg-black/30 backdrop-blur-xl px-6 py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
      <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate">{title}</h1>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
          {t('loading')}
        </div>
      ) : isOwner ? (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handlePostToSlack}
            disabled={isPosting || !meetingId}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer disabled:cursor-not-allowed"
          >
            <img src="/slack.png" alt="Slack" className="w-4 h-4 mr-2" />
            {isPosting ? t('posting') : t('postToSlack')}
          </Button>

          <>
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-foreground text-sm cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  {t('share')}
                </>
              )}
            </Button>

            <Dialog open={showShareModal} onOpenChange={(o) => setShowShareModal(o)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('share')}</DialogTitle>
                  <DialogDescription>{t('ShareDialogIntro')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input value={shareEmail} onChange={(e:any) => setShareEmail(e.target.value)} placeholder="friend@example.com" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('ShareNotice')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Language</label>
                    <Select onValueChange={(v) => setShareLang(v as any)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={shareLang} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={submitShare} disabled={isSharing}>{isSharing ? 'Sending...' : t('share')}</Button>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? t('deleting') : t('delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('ConfirmDeleteTitle') || 'Confirm deletion'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('ConfirmDeleteDescription') || 'Are you sure you want to delete this meeting? This action cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel') || 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {shared && sharedBy ? (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-700/30 text-indigo-200 px-2 py-1 rounded-full">{t('SharedByLabel', { name: sharedBy })}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              {t('viewingShared')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MeetingHeader
