"use client"

import React from 'react'
import { Play, Mic, FileText, Download, ListChecks, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function StudioFeatures() {
  const t = useTranslations('Home')

  const features = [
    { icon: Play, key: 'localCapture' },
    { icon: Mic, key: 'transcription' },
    { icon: FileText, key: 'keyPoints' },
    { icon: Download, key: 'pdfExport' },
    { icon: ListChecks, key: 'postEdit' },
    { icon: Globe, key: 'translation' },
  ]

  return (
    <section className="mt-12 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t('RecordingFeatures.part1')}{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              {t('RecordingFeatures.part2')}
            </span>
          </h2>
          <p className="text-lg bg-gradient-to-r from-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(156,163,175,0.3)] max-w-2xl mx-auto">
            {t('RecordingFeatures.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.key} className="p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-700/20 rounded-xl">
                <div className="w-12 h-12 bg-violet-800/30 rounded-md flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t(`RecordingFeatures.${f.key}.title`)}</h3>
                <p className="text-gray-400 text-sm">{t(`RecordingFeatures.${f.key}.description`)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
