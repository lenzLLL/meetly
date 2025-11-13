'use client'

import { Button } from '@/components/ui/button'
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
}

function MeetingHeader({
  title,
  meetingId,
  summary,
  actionItems,
  isOwner,
  isLoading = false,
}: MeetingHeaderProps) {
  const t = useTranslations('Meetings')
  const [isPosting, setIsPosting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
    if (!meetingId) return
    try {
      const shareUrl = `${window.location.origin}/meeting/${meetingId}`
      await navigator.clipboard.writeText(shareUrl)

      setCopied(true)
      toast(`✅ ${t('linkCopied')}`, {
        action: { label: 'OK', onClick: () => {} },
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('failed to copy:', error)
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
    <div className="border-b border-gray-800 bg-black/30 backdrop-blur-xl px-6 py-3.5 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
          {t('loading')}
        </div>
      ) : isOwner ? (
        <div className="flex gap-3">
          <Button
            onClick={handlePostToSlack}
            disabled={isPosting || !meetingId}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer disabled:cursor-not-allowed"
          >
            <img src="/slack.png" alt="Slack" className="w-4 h-4 mr-2" />
            {isPosting ? t('posting') : t('postToSlack')}
          </Button>

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

          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t('deleting') : t('delete')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          {t('viewingShared')}
        </div>
      )}
    </div>
  )
}

export default MeetingHeader
