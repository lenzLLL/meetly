'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, MessageCircle, Brain, Zap } from 'lucide-react'

interface ChatSuggestionsProps {
  suggestions: string[]
  onSuggestionClick: (suggestion: string) => void
}

const icons = [Sparkles, MessageCircle, Brain, Zap]

function ChatSuggestions({ suggestions, onSuggestionClick }: ChatSuggestionsProps) {
  const t = useTranslations('Chat')

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-10">
      <div className="text-center space-y-3 max-w-xl">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-violet-500 to-purple-500 p-4 rounded-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
          {t('title')}
        </h2>
        <p className="text-gray-400 text-lg">{t('description')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 w-full">
        {suggestions.map((suggestion, index) => {
          const Icon = icons[index % icons.length]
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="p-4 bg-gradient-to-br from-violet-900/40 to-purple-900/40 cursor-pointer border border-violet-500/30 hover:border-violet-500/60 rounded-2xl hover:bg-violet-900/60 transition-all duration-300 text-left group shadow-lg hover:shadow-violet-500/10"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg group-hover:bg-violet-500/40 transition-colors mt-1">
                  <Icon className="h-4 w-4 text-violet-400 group-hover:text-violet-300 transition-colors" />
                </div>
                <p className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                  {suggestion}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ChatSuggestions
