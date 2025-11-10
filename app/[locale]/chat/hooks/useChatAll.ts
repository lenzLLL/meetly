'use client'

import { useChatCore } from '../../hooks/chat/useChatCore'
import { useTranslations } from 'next-intl'

export default function useChatAll() {
  const t = useTranslations('Chat')

  const chatSuggestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
    t('suggestion5'),
    t('suggestion6'),
  ]

  const chat = useChatCore({
    apiEndpoint: '/api/rag/chat-all',
    getRequestBody: (input: string) => ({ question: input }),
  })

  return {
    ...chat,
    chatSuggestions,
  }
}
