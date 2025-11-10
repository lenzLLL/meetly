'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

interface ChatSuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

function ChatSuggestions({ suggestions, onSuggestionClick }: ChatSuggestionsProps) {
  const t = useTranslations('Chat')

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-3">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="p-4 bg-[#1a0b2e]/70 cursor-pointer border border-border rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-colors text-left group"
          >
            <p className="text-sm text-foreground group-hover:text-primary transition-colors">
              ⚡️ {suggestion}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChatSuggestions
