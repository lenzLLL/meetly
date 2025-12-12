import React from 'react'
import { useTranslations } from 'next-intl'

interface RecordingMetadataProps {
  recordingData: any
}

export default function RecordingMetadata({ recordingData }: RecordingMetadataProps) {
  const t = useTranslations('Dashboard')

  if (!recordingData) return null

  return (
    <div className="space-y-6">
      {recordingData.description && (
        <div className="rounded-2xl border border-violet-500/20 p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
          <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
          <p className="text-violet-300/90 leading-relaxed whitespace-pre-wrap">
            {recordingData.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-violet-500/20 p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
          <h4 className="text-sm font-semibold text-violet-300 mb-2">Created At</h4>
          <p className="text-white">
            {new Date(recordingData.createdAt).toLocaleDateString()} at{' '}
            {new Date(recordingData.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
          <h4 className="text-sm font-semibold text-violet-300 mb-2">Updated At</h4>
          <p className="text-white">
            {recordingData.updatedAt
              ? new Date(recordingData.updatedAt).toLocaleDateString() +
                ' at ' +
                new Date(recordingData.updatedAt).toLocaleTimeString()
              : 'N/A'}
          </p>
        </div>
      </div>

      {recordingData.recordingUrl && (
        <div className="rounded-2xl border border-violet-500/20 p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-md">
          <h4 className="text-sm font-semibold text-violet-300 mb-2">Recording URL</h4>
          <p className="text-white break-all text-sm">{recordingData.recordingUrl}</p>
        </div>
      )}
    </div>
  )
}
