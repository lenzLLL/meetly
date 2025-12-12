import React from 'react'
import { useTranslations } from 'next-intl'
import { Loader, AlertCircle } from 'lucide-react'

interface RecordingPlayerProps {
  recordingUrl?: string
  title: string
  loading?: boolean
}

export default function RecordingPlayer({
  recordingUrl,
  title,
  loading = false,
}: RecordingPlayerProps) {
  const t = useTranslations('Dashboard')

  return (
    <div className="rounded-2xl border border-violet-500/20 overflow-hidden bg-black mb-8">
      {loading ? (
        <div className="w-full aspect-video bg-gradient-to-br from-violet-900/20 to-purple-900/20 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-violet-400 mx-auto mb-4" />
            <p className="text-violet-300">Loading recording...</p>
          </div>
        </div>
      ) : recordingUrl ? (
        <video
          src={recordingUrl}
          controls
          className="w-full h-auto"
          preload="metadata"
          controlsList="nodownload"
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full aspect-video bg-gradient-to-br from-violet-900/20 to-purple-900/20 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <p className="text-violet-300 font-semibold mb-2">Recording URL not yet available</p>
            <p className="text-violet-300/70 text-sm max-w-xs">
              The recording file will be available soon. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
