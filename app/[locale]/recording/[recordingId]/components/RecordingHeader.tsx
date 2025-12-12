import React from 'react'
import { Copy, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use_toast'
import { useTranslations } from 'next-intl'

interface RecordingHeaderProps {
  title: string
  recordingId: string
  createdAt: string
  duration?: number
  onDelete?: () => void
}

export default function RecordingHeader({
  title,
  recordingId,
  createdAt,
  duration,
  onDelete,
}: RecordingHeaderProps) {
  const { toast } = useToast()
  const t = useTranslations('Dashboard')

  const handleCopyId = () => {
    navigator.clipboard.writeText(recordingId)
    toast({
      title: 'Copied',
      description: 'Recording ID copied to clipboard',
    })
  }

  return (
    <div className="border-b border-violet-500/20 bg-gradient-to-r from-[#0e001a] via-[#1a0033] to-[#100020]">
      <div className="max-w-7xl mx-auto px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-white truncate">
              {title}
            </h1>
            <p className="text-sm text-violet-300/70 mt-2">
              {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString()}
              {duration && ` • ${duration} min`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyId}
              className="border-violet-500/30 hover:border-violet-500/60 text-violet-300"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDelete}
                className="border-red-500/30 hover:border-red-500/60 text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
