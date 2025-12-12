import React from 'react'
import { Calendar, Clock, Mic, Video } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface RecordingInfoProps {
  recordingData: any
}

export default function RecordingInfo({ recordingData }: RecordingInfoProps) {
  const t = useTranslations('Dashboard')

  if (!recordingData) return null

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const minutes = Math.floor((end - start) / 1000 / 60)
    return `${minutes} min`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-5 h-5 text-violet-400" />
          <p className="text-sm text-violet-300/70">Date</p>
        </div>
        <p className="text-lg font-semibold text-white">
          {new Date(recordingData.startTime).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="w-5 h-5 text-violet-400" />
          <p className="text-sm text-violet-300/70">Duration</p>
        </div>
        <p className="text-lg font-semibold text-white">
          {recordingData.endTime ? formatDuration(recordingData.startTime, recordingData.endTime) : 'N/A'}
        </p>
      </div>

      <div className="rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Video className="w-5 h-5 text-violet-400" />
          <p className="text-sm text-violet-300/70">Type</p>
        </div>
        <p className="text-lg font-semibold text-white">Recording</p>
      </div>

      <div className="rounded-2xl p-6 border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <Mic className="w-5 h-5 text-violet-400" />
          <p className="text-sm text-violet-300/70">Size</p>
        </div>
        <p className="text-lg font-semibold text-white">
          {recordingData.fileSize ? `${(recordingData.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
        </p>
      </div>
    </div>
  )
}
