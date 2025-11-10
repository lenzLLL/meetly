'use client'

import React from 'react'
import { Bot, Calendar, Mail, MessageSquare, Share2, Slack } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function FeaturesSection() {
  const t = useTranslations('Home.Features')

  const features = [
    {
      icon: Bot,
      key: 'aiMeetingSummaries',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Calendar,
      key: 'smartCalendarIntegration',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Mail,
      key: 'automatedEmailReports',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: MessageSquare,
      key: 'chatWithMeetings',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Share2,
      key: 'oneClickIntegrations',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      icon: Slack,
      key: 'slackBotIntegration',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
  ]

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('title')}{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)]">
            {t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all"
            >
              <div
                className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {t(`${feature.key}.title`)}
              </h3>
              <p className="text-gray-400">
                {t(`${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
