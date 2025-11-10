'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUsage } from '@/context/UsageContext'
import { Send } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { useTranslations } from 'next-intl'

interface ChatInputProps {
  chatInput: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
  isLoading: boolean
}

function ChatInput({
  chatInput,
  onInputChange,
  onSendMessage,
  isLoading
}: ChatInputProps) {
  const t = useTranslations('Chat')
  const { canChat, usage, limits } = useUsage()

  return (
    <div className="p-6 bg-transparent">
      {!canChat && usage && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
            {t('limitReached', {
              used: usage.chatMessagesToday,
              total: limits.chatMessages,
            })}{' '}
            <Link href="/pricing" className="underline ml-1">
              {t('upgrade')}
            </Link>{' '}
            {t('toContinue')}
          </p>
        </div>
      )}

      <div className="flex gap-3 max-w-4xl mx-auto">
        <Input
          type="text"
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder={
            canChat ? t('placeholderActive') : t('placeholderLimitReached')
          }
          className="flex-1"
          disabled={isLoading || !canChat}
        />

        <Button
          onClick={onSendMessage}
          disabled={isLoading || !canChat}
          className="px-4 py-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default ChatInput
