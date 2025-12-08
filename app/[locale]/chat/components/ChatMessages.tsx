'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Loader } from 'lucide-react'

interface Message {
  id: number
  content: string
  isBot: boolean
  timestamp: Date
}

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const t = useTranslations('Chat')

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`message flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.isBot
                ? 'bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 backdrop-blur-md text-gray-100 shadow-lg'
                : 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg'
            }`}
          >
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="message flex justify-start">
          <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 backdrop-blur-md text-gray-100 rounded-2xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-violet-400" />
              <p className="text-sm text-gray-300">{t('loadingBotMessage')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatMessages
