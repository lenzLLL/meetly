'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

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
        <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
          <div
            className={`max-w-[70%] rounded-lg p-4 ${
              message.isBot
                ? 'bg-gradient-to-r from-indigo-600/60 to-purple-600/60 border border-indigo-800 backdrop-blur-md text-foreground'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gradient-to-r from-indigo-600/60 to-purple-600/60 border border-indigo-800 backdrop-blur-md text-foreground rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{t('loadingBotMessage')}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatMessages
