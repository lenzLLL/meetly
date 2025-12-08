'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUsage } from '@/context/UsageContext'
import { Send, AlertCircle } from 'lucide-react'
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
    <div className="space-y-4">
      {!canChat && usage && (
        <div className="max-w-4xl mx-auto p-4 bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/30 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-100">
              {t('limitReached', {
                used: usage.chatMessagesToday,
                total: limits.chatMessages,
              })}{' '}
              <Link href="/pricing" className="underline hover:text-amber-50 font-semibold ml-1">
                {t('upgrade')}
              </Link>{' '}
              {t('toContinue')}
            </p>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="flex gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/30 backdrop-blur-md shadow-lg hover:border-violet-500/50 transition-colors">
          <Input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder={
              canChat ? t('placeholderActive') : t('placeholderLimitReached')
            }
            className="flex-1 bg-transparent border-0 text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            disabled={isLoading || !canChat}
          />

          <Button
            onClick={onSendMessage}
            disabled={isLoading || !canChat}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 px-4 py-3 rounded-lg transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
