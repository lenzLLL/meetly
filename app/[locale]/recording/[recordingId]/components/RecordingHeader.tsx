import React, { useState } from 'react'
import { Copy, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use_toast'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

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
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(recordingId)
    toast({
      title: 'Copied',
      description: 'Recording ID copied to clipboard',
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (onDelete) {
        await onDelete()
      }
    } finally {
      setIsDeleting(false)
    }
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={isDeleting}
                    className="border-red-500/30 hover:border-red-500/60 text-red-300 border hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#1a0b2e] border-red-500/20">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-400 flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Delete Recording
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      Are you sure you want to delete this recording? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-300 font-medium">⚠️ This action is permanent and cannot be reversed.</p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-gray-700 hover:bg-gray-800">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
