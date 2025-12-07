'use client'


import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { exportTranscriptToPdf } from '@/lib/transcript-export'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Mic,
  Square,
  Pause,
  Play,
  Download,
  RotateCcw,
  FileText,
  ListChecks,
  Brain,
  Send,
  Loader,
  CheckCircle,
  FileJson,
  Volume2,
  Settings,
  Upload,
  Upload as UploadIcon,
  Mail,
  Layers,
} from 'lucide-react'
import { useToast } from '@/components/ui/use_toast'

type TabType = 'recording' | 'chat' | 'summary' | 'tasks' | 'topics' | 'transcript' | 'export'
type AudioSource = 'microphone' | 'system' | 'both'
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface Subaccount {
  id: string
  name: string
  email: string
}

interface EmailRecipient {
  id: string
  email: string
  type: 'subaccount' | 'custom'
}

export default function RecordingPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'
  const t = useTranslations('Recording')

  // Recording states
  const [activeTab, setActiveTab] = useState<TabType>('recording')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [recordingStartTime, setRecordingStartTime] = useState<string | null>(null)
  const [recordingEndTime, setRecordingEndTime] = useState<string | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioSource, setAudioSource] = useState<AudioSource>('microphone')
  const [language, setLanguage] = useState(locale)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [importedTranscript, setImportedTranscript] = useState<string>('')
  const [importedPdfFileName, setImportedPdfFileName] = useState<string | null>(null)
  const [importedAudioFileName, setImportedAudioFileName] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const trackEndListenersRef = useRef<Map<MediaStreamTrack, () => void>>(new Map())

  // Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: t('chat_initial_message'),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Analysis states
  const [summary, setSummary] = useState<{
    summary: string
    tasks: string[]
    keyPoints: string[]
  } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [tasks, setTasks] = useState<string[]>([])
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isImportingAudio, setIsImportingAudio] = useState(false)
  const [audioImportProgress, setAudioImportProgress] = useState(0)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const { user } = useUser()
  const { toast } = useToast()

  // Export states
  const [exportTitle, setExportTitle] = useState('')
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [newEmailInput, setNewEmailInput] = useState('')
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  const [isLoadingSubaccounts, setIsLoadingSubaccounts] = useState(false)

  // PDF editor modal states
  const [showPdfEditor, setShowPdfEditor] = useState(false)
  const [editSummary, setEditSummary] = useState('')
  const [editKeyPoints, setEditKeyPoints] = useState<string[]>([])
  const [editActionItems, setEditActionItems] = useState<string[]>([])
  const [editTranscript, setEditTranscript] = useState('')
  const [editorMode, setEditorMode] = useState<'pdf' | 'save'>('pdf') // Track whether editing for PDF or Save

  // Audio source selection modal
  const [showAudioSourceModal, setShowAudioSourceModal] = useState(false)
  const [pendingAudioSource, setPendingAudioSource] = useState<AudioSource | null>(null)

  // Helper to safely render possibly-structured text (strings, arrays, or objects)
  const renderAsText = (value: any) => {
    if (!value && value !== 0) return ''
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item
          if (typeof item === 'object' && item !== null) return item.text || item.content || JSON.stringify(item)
          return String(item)
        })
        .join('\n')
    }
    if (typeof value === 'object') return (value && (value.text || value.content)) || JSON.stringify(value)
    return String(value)
  }

  // Source of truth for tasks shown in the Tasks tab
  const effectiveTasks =
    summary && Array.isArray(summary.tasks) && summary.tasks.length > 0
      ? summary.tasks
      : tasks

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-trigger analysis after audio import (when audioChunks changes and importedAudioFileName is set)
  useEffect(() => {
    console.log('useEffect triggered - audioChunks:', audioChunks.length, 'importedAudioFileName:', importedAudioFileName, 'isRecording:', isRecording, 'isAnalyzing:', isAnalyzing, 'summary:', !!summary)
    if (audioChunks.length > 0 && importedAudioFileName && !isRecording && !isAnalyzing && !summary) {
      console.log('Auto-triggering analysis after audio import:', importedAudioFileName)
      analyzeRecording()
    }
  }, [audioChunks.length, importedAudioFileName, isRecording, isAnalyzing, !!summary])

  // Load subaccounts for export
  useEffect(() => {
    const loadSubaccounts = async () => {
      if (activeTab === 'export') {
        setIsLoadingSubaccounts(true)
        try {
          const response = await fetch('/api/recording/suggest-emails')
          if (response.ok) {
            const data = await response.json()
            setSubaccounts(data.subaccounts)
          }
        } catch (error) {
          console.error('Failed to load subaccounts:', error)
        } finally {
          setIsLoadingSubaccounts(false)
        }
      }
    }
    loadSubaccounts()
  }, [activeTab])

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Show audio source selection modal
  const promptAudioSource = () => {
    setShowAudioSourceModal(true)
  }

  // Handle audio source selection from modal
  const confirmAudioSource = async (selectedSource: AudioSource) => {
    setPendingAudioSource(selectedSource)
    setShowAudioSourceModal(false)
    setAudioSource(selectedSource)
    
    // Show feedback toast
    const sourceLabels: Record<AudioSource, string> = {
      microphone: t('source_microphone'),
      system: t('source_system_audio'),
      both: t('source_both'),
    }
    
    toast({
      title: t('audio_selected'),
      description: sourceLabels[selectedSource],
    })
    
    // Start recording with the selected source
    startRecordingWithSource(selectedSource)
  }

  // Initialize recording with specific audio source
  const startRecordingWithSource = async (source: AudioSource) => {
    try {
      let stream: MediaStream | null = null
      let systemAudioStream: MediaStream | null = null
      
      // Try system audio first if requested
      if (
        (source === 'system' || source === 'both') &&
        navigator.mediaDevices.getDisplayMedia
      ) {
        try {
          console.log('Requesting display media (system audio)...')
          // Note: video MUST be true for getDisplayMedia to work properly
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: { echoCancellation: false },
            video: { mediaSource: 'screen' } as any,
          } as DisplayMediaStreamOptions)
          
          // If user only wants audio, we'll extract just the audio track
          systemAudioStream = displayStream
          console.log('Display media obtained:', displayStream.getTracks().map(t => t.kind))
        } catch (error: any) {
          const errorMessage = error?.message || String(error)
          console.log('System audio capture failed:', errorMessage)
          
          // For 'system' only mode, this is a hard error
          if (source === 'system') {
            throw new Error(`System audio capture failed: ${errorMessage}`)
          }
          // For 'both' mode, we'll fall through to microphone
        }
      }
      
      // Request microphone if needed
      if ((source === 'microphone' || source === 'both') || !systemAudioStream) {
        try {
          console.log('Requesting microphone...')
          const constraints: MediaStreamConstraints = { audio: true }
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          console.log('Microphone obtained')
        } catch (error: any) {
          const errorMessage = error?.message || String(error)
          console.error('Microphone capture failed:', errorMessage)
          
          // Only throw if we don't have system audio
          if (!systemAudioStream) {
            throw new Error(`Microphone capture failed: ${errorMessage}`)
          }
        }
      }

      // Check we have at least one stream
      if (!stream && !systemAudioStream) {
        throw new Error('No audio source available')
      }

      // Merge streams if both are available
      let finalStream = new MediaStream()
      
      if (source === 'both' && stream && systemAudioStream) {
        // Both streams available - need to mix them properly with Web Audio API
        const micTracks = stream.getAudioTracks()
        const sysTracks = systemAudioStream.getAudioTracks()
        
        console.log(`Mixing: ${micTracks.length} microphone tracks + ${sysTracks.length} system audio tracks`)
        
        if (micTracks.length > 0 && sysTracks.length > 0) {
          // Create audio context for mixing
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const destination = audioContext.createMediaStreamDestination()
          
          // Create source from microphone
          const micSource = audioContext.createMediaStreamSource(stream)
          micSource.connect(destination)
          console.log('Connected microphone to mixer')
          
          // Create source from system audio
          const sysSource = audioContext.createMediaStreamSource(systemAudioStream)
          sysSource.connect(destination)
          console.log('Connected system audio to mixer')
          
          // The mixed stream is in destination.stream
          finalStream = destination.stream
          
          // Store the audio context for cleanup later
          audioContextRef.current = audioContext
          analyserRef.current = audioContext.createAnalyser()
          micSource.connect(analyserRef.current)
        } else {
          throw new Error('Missing audio tracks for mixing')
        }
        
        // Stop the video track from displayMedia (we only need audio)
        systemAudioStream.getVideoTracks().forEach((track) => {
          console.log('Stopping video track from screen share')
          track.stop()
        })
      } else if (systemAudioStream && source === 'system') {
        // System audio only - use only system audio
        const audioTracks = systemAudioStream.getAudioTracks()
        if (audioTracks.length > 0) {
          console.log('Using system audio track only')
          finalStream.addTrack(audioTracks[0])
        } else {
          throw new Error('System audio stream has no audio tracks')
        }
        
        // Stop the video track from displayMedia (we only need audio)
        systemAudioStream.getVideoTracks().forEach((track) => {
          console.log('Stopping video track from screen share')
          track.stop()
        })
      } else if (stream) {
        // Microphone or fallback - use microphone
        const audioTracks = stream.getAudioTracks()
        if (audioTracks.length > 0) {
          console.log('Using microphone track only')
          finalStream.addTrack(audioTracks[0])
        } else {
          throw new Error('Microphone stream has no audio tracks')
        }
      } else {
        throw new Error('No audio tracks available')
      }

      // Only create new audio context if not already created (for 'both' mode, we created it above)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const mediaStreamSource = audioContextRef.current.createMediaStreamSource(finalStream)
        mediaStreamSource.connect(analyserRef.current)
      }

      const mediaRecorder = new MediaRecorder(finalStream)
      mediaRecorderRef.current = mediaRecorder
      recordingStreamRef.current = finalStream

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => setAudioChunks(chunks)

      // Monitor for stream ending (e.g., user stops screen sharing)
      const handleTrackEnded = () => {
        console.log('Track ended - user stopped sharing screen or closed permissions')
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
          setIsRecording(false)
          
          // Stop the timer
          if (recordingTimerRef.current) {
            window.clearInterval(recordingTimerRef.current)
            recordingTimerRef.current = null
          }
          
          // Notify user
          toast({
            title: t('recording_stopped'),
            description: t('screen_sharing_closed'),
            variant: 'destructive',
          })
        }
      }

      // Listen for track ended events on all tracks
      finalStream.getTracks().forEach((track) => {
        track.addEventListener('ended', handleTrackEnded)
        // Store listeners for cleanup
        trackEndListenersRef.current.set(track, handleTrackEnded)
      })

      mediaRecorder.start()
      setIsRecording(true)
      setRecordedTime(0)
      setAudioChunks([])
      setAudioSource(source) // Store selected source
      // capture start time
      const startIso = new Date().toISOString()
      setRecordingStartTime(startIso)
      setRecordingEndTime(null)
      // start timer to update recordedTime (respects pause)
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
      }
      isPausedRef.current = false
      setIsPaused(false)
      recordingTimerRef.current = window.setInterval(() => {
        if (!isPausedRef.current) {
          setRecordedTime((t) => t + 1)
        }
      }, 1000)

      if (canvasRef.current && analyserRef.current) {
        visualize()
      }
    } catch (error) {
      console.error('Error accessing audio:', error)
      setIsRecording(false)
      
      // Show user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('No audio source available')) {
          toast({
            title: t('error'),
            description: t('no_audio_source'),
            variant: 'destructive',
          })
        } else if (error.message.includes('Permission denied')) {
          toast({
            title: t('permission_denied'),
            description: t('allow_audio_access'),
            variant: 'destructive',
          })
        } else {
          toast({
            title: t('recording_error'),
            description: error.message,
            variant: 'destructive',
          })
        }
      }
    }
  }

  // Visualizer animation
  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    ctx.fillStyle = 'rgba(14, 0, 26, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const bars = 50
    const barWidth = canvas.width / bars

    for (let i = 0; i < bars; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height
      const hue = (i / bars) * 360

      // Subtler colors: reduced saturation and lightness
      ctx.fillStyle = `hsl(${hue}, 60%, 55%)`
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
    }

    // Continue animation only if recording and not paused
    if (!isPausedRef.current) {
      requestAnimationFrame(visualize)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      
      // Clean up stream and listeners
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => {
          // Remove listener if it exists
          const listener = trackEndListenersRef.current.get(track)
          if (listener) {
            track.removeEventListener('ended', listener)
            trackEndListenersRef.current.delete(track)
          }
          // Stop the track
          track.stop()
        })
        recordingStreamRef.current = null
      }
      
      // Clear all listeners
      trackEndListenersRef.current.clear()
      
      setIsRecording(false)
      setIsPaused(false)
      isPausedRef.current = false
      // capture end time
      const endIso = new Date().toISOString()
      setRecordingEndTime(endIso)
      // stop timer
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (!mediaRecorderRef.current) return
    try {
      if ((mediaRecorderRef.current as any).state === 'recording') {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        isPausedRef.current = true
      }
    } catch (err) {
      console.error('Error pausing recording:', err)
    }
  }

  const resumeRecording = () => {
    if (!mediaRecorderRef.current) return
    try {
      if ((mediaRecorderRef.current as any).state === 'paused') {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        isPausedRef.current = false
        // kick visualizer
        if (canvasRef.current && analyserRef.current) visualize()
      }
    } catch (err) {
      console.error('Error resuming recording:', err)
    }
  }

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      
      // Clean up stream and listeners
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => {
          // Remove listener if it exists
          const listener = trackEndListenersRef.current.get(track)
          if (listener) {
            track.removeEventListener('ended', listener)
            trackEndListenersRef.current.delete(track)
          }
          // Stop the track
          track.stop()
        })
        recordingStreamRef.current = null
      }
      
      // Clear all listeners
      trackEndListenersRef.current.clear()
      
      setIsRecording(false)
      setIsPaused(false)
      isPausedRef.current = false
      // Reset audio and UI state to initial
      resetRecording()
      setRecordingStartTime(null)
      setRecordingEndTime(null)
      // Ensure we return to the recording tab and clear analyzing state
      setActiveTab('recording')
      setIsAnalyzing(false)
      // stop timer
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      toast({
        title: t('cancelled'),
        description: t('recording_cancelled'),
      })
    }
  }

  // Download recording
  const downloadRecording = () => {
    if (audioChunks.length === 0) return

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recording-${new Date().toISOString()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  const analyzeRecording = async () => {
    // Case 1: recorded/imported audio → use dedicated route for transcription + analysis
    // Case 2: existing transcript (from PDF/import) without audio
    const hasRealTranscript =
      !!importedTranscript &&
      !importedTranscript.startsWith('Audio file imported:') &&
      !importedTranscript.startsWith('PDF file imported:')

    if (!hasRealTranscript && audioChunks.length === 0) {
      console.warn(
        'No audio or transcript available for analysis. Please record/import audio or paste a transcript before analyzing.',
      )
      return
    }

    setIsAnalyzing(true)
    setAnalyzeProgress(0)
    try {
      let transcript = importedTranscript
      let result: { summary: string; tasks: string[]; keyPoints: string[] } | null = null

      if (audioChunks.length > 0) {
        // Upload audio via XHR so we can track progress
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', audioBlob, `recording-${Date.now()}.webm`)
        formData.append('language', language)

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', '/api/recording/transcribe-and-analyze')

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 80)
              setAnalyzeProgress(percent)
            }
          }

          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText)
                  transcript = data.transcript || ''
                  const rawTasks = Array.isArray(data.tasks)
                    ? data.tasks
                    : Array.isArray((data as any).actionItems)
                      ? (data as any).actionItems
                      : []
                  const rawKeyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : []
                  const toText = (item: any) => {
                    if (typeof item === 'string') return item
                    if (!item) return ''
                    return item.text || item.content || item.title || item.name || JSON.stringify(item)
                  }
                  const normalizedTasks = rawTasks.map(toText)
                  const normalizedKeyPoints = rawKeyPoints.map(toText)
                  result = {
                    summary: data.summary || '',
                    tasks: normalizedTasks,
                    keyPoints: normalizedKeyPoints,
                  }
                  setImportedTranscript(transcript || '')
                  setAnalyzeProgress(100)
                  resolve()
                } catch (err) {
                  reject(err)
                }
              } else {
                reject(new Error('Failed to transcribe and analyze audio'))
              }
            }
          }

          xhr.onerror = () => reject(new Error('Network error during transcription'))
          xhr.send(formData)
        })
      } else if (hasRealTranscript) {
        // Direct analysis of existing text transcript (no large upload progress available)
        setAnalyzeProgress(30)
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, language }),
        })

        const data = await response.json()
        const rawTasks = Array.isArray(data.tasks)
          ? data.tasks
          : Array.isArray((data as any).actionItems)
            ? (data as any).actionItems
            : []
        const rawKeyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : []
        const toText = (item: any) => {
          if (typeof item === 'string') return item
          if (!item) return ''
          return item.text || item.content || item.title || item.name || JSON.stringify(item)
        }
        const normalizedTasks = rawTasks.map(toText)
        const normalizedKeyPoints = rawKeyPoints.map(toText)
        result = {
          summary: data.summary || '',
          tasks: normalizedTasks,
          keyPoints: normalizedKeyPoints,
        }
        setAnalyzeProgress(100)
      }

      if (!transcript || !result) {
        console.warn('Transcription or analysis result is missing, cannot proceed.')
        return
      }

      setSummary(result)
      setTasks(result.tasks || [])

      // Persist summary and send email if user is signed in
      try {
        if (user && (user.id || (user as any).primaryEmailAddress)) {
          const userEmail =
            (user as any).primaryEmailAddress?.email_address || (user as any).email || null
          await fetch('/api/ai/save-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: result.summary,
              tasks: result.tasks || [],
              keyPoints: result.keyPoints || [],
              transcript,
              userId: user.id,
              userEmail,
              meetingTitle: `Recording ${new Date().toLocaleString()}`,
              language,
            }),
          })
        }
      } catch (err) {
        console.error('Error saving/sending summary:', err)
      }
    } catch (error) {
      console.error('Error analyzing recording:', error)
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false)
        setAnalyzeProgress(0)
      }, 800)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoadingChat(true)

    // Build meeting context from the analyzed summary and/or imported transcript
    const contextSections: string[] = []

    if (summary) {
      if (summary.summary) {
        contextSections.push(`Résumé de la réunion:\n${summary.summary}`)
      }
      if (Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0) {
        contextSections.push(`Points clés:\n- ${summary.keyPoints.join('\n- ')}`)
      }
      if (Array.isArray(summary.tasks) && summary.tasks.length > 0) {
        contextSections.push(`Actions à réaliser:\n- ${summary.tasks.join('\n- ')}`)
      }
    }

    if (!summary && importedTranscript) {
      contextSections.push(`Transcription de la réunion:\n${importedTranscript}`)
    }

    const baseSystemPrompt =
      'You are a helpful assistant analyzing a meeting recording. Answer questions about the meeting content concisely. If the answer is not covered by the meeting context, say that you do not know instead of inventing. Respond in the same language as the user.'

    const contextPrompt = contextSections.length
      ? `Here is the meeting context, use it as the only source of truth:\n\n${contextSections.join('\n\n')}`
      : 'No meeting transcript or summary is available yet. Answer in a generic way and tell the user to run the analysis first if they expect meeting-specific answers.'

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system' as const,
              content: `${baseSystemPrompt}\n\n${contextPrompt}`,
            },
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user' as const,
              content: inputMessage,
            },
          ],
        }),
      })

      const data = await response.json()
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content || 'I apologize, I encountered an error.',
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoadingChat(false)
    }
  }

  const downloadPdf = async () => {
    if (!summary) return

    // Populate editor state and open modal for user edits before export
    const meetingTitle = exportTitle || importedAudioFileName || importedPdfFileName || `Recording ${new Date().toLocaleDateString()}`
    setEditSummary(summary.summary || '')
    setEditKeyPoints(summary.keyPoints ? [...summary.keyPoints] : [])
    // Ensure action items are strings for the editor
    const toText = (item: any) => {
      if (typeof item === 'string') return item
      if (!item) return ''
      return item.text || item.content || item.title || item.name || JSON.stringify(item)
    }
    setEditActionItems((summary.tasks || []).map((t) => toText(t)))
    setEditTranscript(importedTranscript && importedTranscript.trim().length > 0 ? importedTranscript : (summary.summary || ''))
    setShowPdfEditor(true)
  }

  const exportFromEditor = async () => {
    // Called when user confirms edits in the editor modal
    setShowPdfEditor(false)
    setIsGeneratingPdf(true)
    try {
      const meetingTitle = exportTitle || `Recording ${new Date().toLocaleDateString()}`
      const toText = (item: any) => {
        if (typeof item === 'string') return item
        if (!item) return ''
        return item.text || item.content || item.title || item.name || JSON.stringify(item)
      }

      const metadata = {
        date: recordingStartTime || new Date().toLocaleDateString(),
        summary: editSummary,
        speakers: undefined,
        keyPoints: (editKeyPoints || []).slice(0, 25).map(toText),
        actionItems: (editActionItems || []).slice(0, 25).map(toText),
      }

      // Skip transcript section only if:
      // - PDF imported AND no audio was recorded, OR
      // - Audio imported AND recording time is 0 (pure audio import, not a recording)
      const skipTranscript: boolean = (importedPdfFileName !== null && audioChunks.length === 0) || (importedAudioFileName !== null && recordedTime === 0)

      await exportTranscriptToPdf(
        editTranscript || '',
        meetingTitle,
        metadata,
        (language as any) || 'fr',
        skipTranscript
      )
    } catch (error) {
      console.error('Error exporting edited PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const resetRecording = () => {
    // Stop and release media recorder if still active
    try {
      if (mediaRecorderRef.current) {
        try {
          if ((mediaRecorderRef.current as any).state !== 'inactive') {
            mediaRecorderRef.current.stop()
          }
        } catch (e) {
          // ignore
        }
        try {
          mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
        } catch (e) {
          // ignore
        }
        mediaRecorderRef.current = null
      }

      // Close audio context if open
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
          // ignore
        }
        audioContextRef.current = null
      }

      analyserRef.current = null

      // Clear canvas drawing
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }

      // Clear timers and flags
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }

      setAudioChunks([])
      setRecordedTime(0)
      setIsRecording(false)
      setIsPaused(false)
      isPausedRef.current = false
      setSummary(null)
      setTasks([])
      setImportedTranscript('')
      setImportedPdfFileName(null)
      setImportedAudioFileName(null)
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content:
            'Bonjour! Je suis votre assistant IA. Posez-moi des questions sur la réunion qui vient de se terminer.',
        },
      ])
      toast({
        title: locale === 'fr' ? 'Réinitialisé' : 'Reset',
        description: locale === 'fr' ? "L'enregistrement a été réinitialisé." : 'Recording has been reset.',
      })
    } catch (err) {
      console.error('Error during resetRecording cleanup:', err)
    }
  }

  // Save recording to database
  const saveRecording = async () => {
    if (!exportTitle.trim()) {
      toast({
        title: locale === 'fr' ? 'Titre requis' : 'Title required',
        description: locale === 'fr' ? "Veuillez entrer le titre de la réunion" : 'Please enter the meeting title',
        variant: 'destructive',
      })
      return
    }

    if (!summary) {
      toast({
        title: locale === 'fr' ? 'Aucune analyse' : 'No summary',
        description: locale === 'fr' ? "Aucun résumé disponible. Veuillez d'abord analyser l'audio." : 'No summary available. Please analyze the audio first.',
        variant: 'destructive',
      })
      return
    }

    // Populate editor and open modal for user edits before saving
    setEditSummary(summary.summary || '')
    setEditKeyPoints(summary.keyPoints ? [...summary.keyPoints] : [])
    const toText = (item: any) => {
      if (typeof item === 'string') return item
      if (!item) return ''
      return item.text || item.content || item.title || item.name || JSON.stringify(item)
    }
    setEditActionItems((summary.tasks || []).map((t) => toText(t)))
    setEditTranscript(importedTranscript && importedTranscript.trim().length > 0 ? importedTranscript : (summary.summary || ''))
    setEditorMode('save')
    setShowPdfEditor(true)
  }

  const saveFromEditor = async () => {
    // Called when user confirms edits in the editor modal for saving
    setShowPdfEditor(false)
    setIsSavingRecording(true)

    // Create a unique request ID to prevent duplicate submissions
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      console.log('Saving recording payload', {
        title: exportTitle,
        emailRecipients: emailRecipients.map((r) => r.email),
        startTime: recordingStartTime,
        endTime: recordingEndTime,
      })

      const response = await fetch('/api/recording/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': requestId,
        },
        body: JSON.stringify({
          title: exportTitle,
          transcript: editTranscript,
          summary: editSummary,
          keyPoints: (editKeyPoints || []).slice(0, 25),
          actionItems: (editActionItems || []).slice(0, 25).map((item, idx) => ({ id: idx + 1, text: item })),
          emailRecipients: emailRecipients.map(r => r.email),
          startTime: recordingStartTime,
          endTime: recordingEndTime,
          language,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: locale === 'fr' ? 'Enregistré' : 'Saved',
          description: locale === 'fr' ? 'Enregistrement sauvegardé avec succès! Les emails ont été envoyés.' : 'Recording saved successfully! Emails have been sent.',
        })
        // Reset form immediately
        setExportTitle('')
        setEmailRecipients([])
        setNewEmailInput('')
        setIsSavingRecording(false)
      } else {
        setIsSavingRecording(false)
        toast({
          title: locale === 'fr' ? 'Erreur' : 'Error',
          description: data.error || (locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving recording'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      setIsSavingRecording(false)
      toast({
        title: locale === 'fr' ? 'Erreur' : 'Error',
        description: locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving recording',
        variant: 'destructive',
      })
    }
  }

  const oldSaveRecording = async () => {
    if (!exportTitle.trim()) {
      toast({
        title: locale === 'fr' ? 'Titre requis' : 'Title required',
        description: locale === 'fr' ? "Veuillez entrer le titre de la réunion" : 'Please enter the meeting title',
        variant: 'destructive',
      })
      return
    }

    if (!summary) {
      toast({
        title: locale === 'fr' ? 'Aucune analyse' : 'No summary',
        description: locale === 'fr' ? "Aucun résumé disponible. Veuillez d'abord analyser l'audio." : 'No summary available. Please analyze the audio first.',
        variant: 'destructive',
      })
      return
    }

    // Prevent double submission
    if (isSavingRecording) {
      console.warn('Already saving, ignoring duplicate submission')
      return
    }

    setIsSavingRecording(true)
    
    // Create a unique request ID to prevent duplicate submissions
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log('Saving recording payload', {
        title: exportTitle,
        emailRecipients: emailRecipients.map((r) => r.email),
        startTime: recordingStartTime,
        endTime: recordingEndTime,
      })

      const response = await fetch('/api/recording/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': requestId,
        },
        body: JSON.stringify({
          title: exportTitle,
          transcript: importedTranscript,
          summary: summary.summary,
          keyPoints: summary.keyPoints || [],
          actionItems: (summary.tasks || []).map((task, idx) => ({ id: idx + 1, text: task })),
          emailRecipients: emailRecipients.map(r => r.email),
          startTime: recordingStartTime,
          endTime: recordingEndTime,
          language,
        }),
      })

      const data = await response.json()

        if (response.ok) {
        toast({
          title: locale === 'fr' ? 'Enregistré' : 'Saved',
          description: locale === 'fr' ? 'Enregistrement sauvegardé avec succès! Les emails ont été envoyés.' : 'Recording saved successfully! Emails have been sent.',
        })
        // Reset form immediately, then change tab after a brief delay for UI feedback
        setExportTitle('')
        setEmailRecipients([])
        setNewEmailInput('')
        setIsSavingRecording(false)
          // NOTE: keep user on export tab so they can continue working there
      } else {
        setIsSavingRecording(false)
        toast({
          title: locale === 'fr' ? 'Erreur' : 'Error',
          description: data.error || (locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving recording'),
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      setIsSavingRecording(false)
      toast({
        title: locale === 'fr' ? 'Erreur' : 'Error',
        description: locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving recording',
        variant: 'destructive',
      })
    }
  }

  // Add email recipient
  const addEmailRecipient = (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: t('invalid_email'),
        description: locale === 'fr' ? 'Veuillez fournir une adresse email valide.' : 'Please provide a valid email address.',
        variant: 'destructive',
      })
      return
    }
    
    if (emailRecipients.some(r => r.email === email)) {
      toast({
        title: locale === 'fr' ? 'Doublon' : 'Duplicate',
        description: locale === 'fr' ? 'Email déjà ajouté' : 'Email already added',
        variant: 'destructive',
      })
      return
    }
    
    setEmailRecipients([...emailRecipients, { id: Date.now().toString(), email, type: 'custom' }])
    setNewEmailInput('')
  }

  // Remove email recipient
  const removeEmailRecipient = (id: string) => {
    setEmailRecipients(emailRecipients.filter(r => r.id !== id))
  }

  // Add subaccount email
  const addSubaccountEmail = (subaccount: Subaccount) => {
    if (emailRecipients.some(r => r.email === subaccount.email)) {
      toast({
        title: t('duplicate'),
        description: t('email_already_added'),
        variant: 'destructive',
      })
      return
    }
    
    setEmailRecipients([...emailRecipients, { id: subaccount.id, email: subaccount.email, type: 'subaccount' }])
  }

  // Import audio file
  const handleAudioImport = async (file: File) => {
    console.log('handleAudioImport called with:', file.name)
    try {
      // If file is already a common audio type (webm, mp3, m4a, wav), skip client-side decoding
      if (file.type && file.type.startsWith('audio/')) {
        console.log('Recognized as audio type, setting audioChunks and fileName')
        setIsImportingAudio(true)
        setAudioImportProgress(30)
        // Use the raw file directly for server-side transcription
        setAudioChunks([file])
        setImportedAudioFileName(file.name)
        setSummary(null)
        setTasks([])
        setImportedTranscript('')
        setAudioImportProgress(100)
        setTimeout(() => {
          setIsImportingAudio(false)
          setAudioImportProgress(0)
          // Analysis will be auto-triggered by useEffect when audioChunks is updated
          console.log('Audio import complete, waiting for useEffect to trigger analysis')
        }, 1000)
        return
      }

      // Fallback: attempt to decode/convert (for non-audio blobs)
      setIsImportingAudio(true)
      setAudioImportProgress(10)
      const arrayBuffer = await file.arrayBuffer()
      setAudioImportProgress(40)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      setAudioImportProgress(60)

      // Convert to WAV format for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      )
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineContext.destination)
      source.start(0)

      const renderedBuffer = await offlineContext.startRendering()
      const wavBlob = audioBufferToWav(renderedBuffer)
      setAudioChunks([wavBlob])
      setImportedAudioFileName(file.name)
      // Reset previous analysis when a new audio file is imported
      setSummary(null)
      setTasks([])

      // Clear any previous transcript to force fresh transcription
      setImportedTranscript('')
      setAudioImportProgress(100)
      setTimeout(() => {
        setIsImportingAudio(false)
        setAudioImportProgress(0)
        // Analysis will be auto-triggered by useEffect when audioChunks is updated
      }, 1000)
    } catch (error) {
      console.error('Error importing audio (conversion failed), falling back to raw file:', error)
      // Fallback: use the original file as the audio chunk and let downstream handle decoding
      try {
        setAudioChunks([file])
        setImportedAudioFileName(file.name)
        setSummary(null)
        setTasks([])
        setImportedTranscript('')
        toast({
          title: t('partial_import'),
          description: t('audio_imported_conversion_failed'),
        })
      } catch (err2) {
        console.error('Fallback import also failed:', err2)
        toast({
          title: t('error'),
          description: t('could_not_import_audio'),
          variant: 'destructive',
        })
      } finally {
        setIsImportingAudio(false)
        setAudioImportProgress(0)
        // Analysis will be auto-triggered by useEffect when audioChunks is updated
      }
    }
  }

  // Import PDF file
  const handlePdfImport = async (file: File) => {
    try {
      setSummary(null)
      setTasks([])
      setIsImportingPdf(true)
      setImportProgress(0)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()
        formData.append('file', file)

        xhr.open('POST', '/api/ai/process-pdf')

        // Track upload progress (0-80%)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 80)
            setImportProgress(percent)
          }
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText)
                setImportedTranscript(data.text || `PDF file imported: ${file.name}`)
                setImportedPdfFileName(file.name)
              } catch (err) {
                setImportedTranscript(`PDF file imported: ${file.name}. Send it to AI for analysis.`)
                setImportedPdfFileName(file.name)
              }
              setImportProgress(100)
              resolve()
            } else {
              setImportedTranscript(`PDF file imported: ${file.name}. Send it to AI for analysis.`)
              setImportedPdfFileName(file.name)
              setImportProgress(100)
              resolve()
            }
          }
        }

        xhr.onerror = () => {
          reject(new Error('Upload failed'))
        }

        xhr.send(formData)
      })
    } catch (error) {
      console.error('Error importing PDF:', error)
      setImportedTranscript(`PDF file imported: ${file.name}. Ready for analysis.`)
      setImportedPdfFileName(file.name)
    } finally {
      // keep progress visible very briefly then hide
      setTimeout(() => {
        setIsImportingPdf(false)
        setImportProgress(0)
      }, 700)
    }
  }

  // Convert AudioBuffer to WAV Blob
  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample

    const channelDatas = []
    for (let i = 0; i < numberOfChannels; i++) {
      channelDatas.push(audioBuffer.getChannelData(i))
    }

    const interleaved = new Float32Array(audioBuffer.length * numberOfChannels)
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        interleaved[i * numberOfChannels + channel] = channelDatas[channel][i]
      }
    }

    const dataLength = interleaved.length * bytesPerSample
    const buffer = new ArrayBuffer(44 + dataLength)
    const view = new DataView(buffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataLength, true)

    let index = 44
    for (let i = 0; i < interleaved.length; i++) {
      view.setInt16(
        index,
        interleaved[i] < 0 ? interleaved[i] * 0x8000 : interleaved[i] * 0x7fff,
        true,
      )
      index += 2
    }

    return new Blob([buffer], { type: 'audio/wav' })
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('handleFileImport - File:', file.name, 'Type:', file.type)

    // Check by MIME type or file extension
    const isAudio = file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.webm') || file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.m4a')
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (isAudio) {
      console.log('Detected as audio, calling handleAudioImport')
      handleAudioImport(file)
    } else if (isPdf) {
      console.log('Detected as PDF, calling handlePdfImport')
      handlePdfImport(file)
    } else {
      console.log('File type not recognized:', file.type, file.name)
    }

    // Reset input
    event.target.value = ''
  }

  // NOTE: timer is managed via recordingTimerRef in start/stop and respects pause state

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white flex flex-col p-6">
      <style>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 20px rgba(139, 92, 246, 0);
          }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes glow-intense {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3),
                        0 0 40px rgba(139, 92, 246, 0.15);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.4),
                        0 0 60px rgba(139, 92, 246, 0.2);
          }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .recording-container {
          animation: fade-in 0.6s ease-out;
        }

        .record-button {
          animation: float-slow 3s ease-in-out infinite;
        }

        .record-button.active {
          animation: pulse-border 1.5s infinite, float-slow 3s ease-in-out infinite;
        }

        .canvas-wrapper {
          animation: glow-intense 2s ease-in-out infinite;
        }

        .tab-content {
          animation: slide-in 0.4s ease-out;
        }

        .tab-button {
          position: relative;
          transition: all 0.3s ease;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #8B5CF6, #A855F7);
          border-radius: 1px;
        }
      `}</style>

      <div className="recording-container max-w-5xl w-full mx-auto">
        {/* Title and Settings */}
        <div className="text-center mb-8 pt-6 relative">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent mb-2">
            {t('studio_title')}
          </h1>
          <p className="text-gray-500">{t('studio_subtitle')}</p>

          {/* Settings Button */}
          <button
            onClick={() => setShowAudioSettings(!showAudioSettings)}
            className="absolute top-0 right-0 p-2 hover:bg-white/5 rounded-lg transition-all duration-300 cursor-pointer"
          >
            <Settings className="h-6 w-6 text-violet-300" />
          </button>

          {/* Audio Settings Panel */}
          {showAudioSettings && (
            <div className="absolute top-12 right-0 bg-gradient-to-br from-violet-950/95 to-purple-950/95 z-[100] border border-violet-700/30 rounded-xl p-6 w-80 backdrop-blur-md shadow-lg">
              <h3 className="font-bold text-lg mb-4 text-violet-200">{t('settings_title')}</h3>

              {/* Audio Source Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-2">{t('audio_source_label')}</label>
                <div className="space-y-2">
                  {[
                    { value: 'microphone', label: t('mic_label') },
                    { value: 'system', label: t('system_audio_label') },
                    { value: 'both', label: t('both_label') },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer hover:bg-white/3 p-2 rounded"
                    >
                      <input
                        type="radio"
                        name="audioSource"
                        value={option.value}
                        checked={audioSource === option.value}
                        onChange={(e) => setAudioSource(e.target.value as AudioSource)}
                        disabled={isRecording}
                        className="w-4 h-4 accent-violet-500"
                      />
                      <span className="text-sm text-gray-400">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">{t('language_label')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isRecording}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-violet-700/30 text-gray-300 text-sm focus:outline-none focus:border-violet-600/50"
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="it">🇮🇹 Italiano</option>
                  <option value="pt">🇵🇹 Português</option>
                  <option value="ja">🇯🇵 日本語</option>
                  <option value="zh">🇨🇳 中文</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-violet-700/20 overflow-x-auto pb-4">
          {[
            { id: 'recording' as TabType, label: t('tabs.recording'), icon: Mic },
            {
              id: 'chat' as TabType,
              label: t('tabs.chat'),
              icon: Brain,
              disabled: audioChunks.length === 0 && !importedTranscript,
            },
            {
              id: 'summary' as TabType,
              label: t('tabs.summary'),
              icon: FileText,
              disabled: !summary,
            },
            {
              id: 'tasks' as TabType,
              label: t('tabs.tasks'),
              icon: ListChecks,
              disabled: effectiveTasks.length === 0,
            },
            {
              id: 'topics' as TabType,
              label: t('tabs.topics'),
              icon: ListChecks,
              disabled: !summary,
            },
            {
              id: 'transcript' as TabType,
              label: t('tabs.transcript'),
              icon: Brain,
              disabled: !summary,
            },
            {
              id: 'export' as TabType,
              label: t('tabs.export'),
              icon: UploadIcon,
              disabled: !summary,
            },
          ].map((tab) => {
            const Icon = tab.icon
            const isDisabled = tab.disabled
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`tab-button relative px-4 py-3 flex items-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-violet-300'
                    : isDisabled
                      ? 'text-gray-700 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recording Tab */}
          {activeTab === 'recording' && (
            <div className="lg:col-span-3 space-y-6">
              {/* Visualizer */}
              <div className="canvas-wrapper rounded-2xl overflow-hidden p-3 bg-gradient-to-br from-violet-950/30 to-purple-950/30 border border-violet-700/10">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={120}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* Import/Analysis Progress Bars */}
              {(isImportingPdf || isImportingAudio || isAnalyzing || analyzeProgress > 0) && (
                <div className="space-y-4 bg-gradient-to-br from-violet-950/20 to-purple-950/20 border border-violet-700/20 rounded-lg p-4">
                  {isImportingPdf && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2 font-medium">Importation PDF… {importProgress}%</p>
                      <div className="h-2 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-2 bg-emerald-500 rounded"
                          style={{ width: `${importProgress}%`, transition: 'width 200ms' }}
                        />
                      </div>
                    </div>
                  )}
                  {isImportingAudio && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2 font-medium">Importation audio… {audioImportProgress}%</p>
                      <div className="h-2 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-2 bg-sky-500 rounded"
                          style={{ width: `${audioImportProgress}%`, transition: 'width 200ms' }}
                        />
                      </div>
                    </div>
                  )}
                  {(isAnalyzing || analyzeProgress > 0) && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2 font-medium">Analyse… {analyzeProgress}%</p>
                      <div className="h-2 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-2 bg-indigo-500 rounded"
                          style={{ width: `${analyzeProgress}%`, transition: 'width 200ms' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-violet-800/20 to-purple-800/20 border border-violet-700/25 rounded-xl px-8 py-4 backdrop-blur-md">
                  <p className="text-gray-500 text-sm mb-1">{t('timer')}</p>
                  <p className="text-4xl font-bold font-mono text-violet-200">{formatTime(recordedTime)}</p>
                </div>
              </div>

              {isRecording && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-semibold">{t('recording_indicator')}</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-4 justify-center flex-wrap">
                {!isRecording ? (
                  <button
                    onClick={promptAudioSource}
                    className="record-button group relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-700 via-violet-600 to-purple-700 hover:from-violet-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={stopRecording}
                      className="record-button active w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 animate-pulse flex items-center justify-center cursor-pointer shadow-lg"
                      title={t('stop_button')}
                    >
                      <Square className="h-8 w-8 text-white" fill="white" />
                    </button>

                    {!isPaused ? (
                      <button
                        onClick={pauseRecording}
                        className="px-4 py-3 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center gap-2 shadow-md"
                        title={t('pause_button')}
                      >
                        <Pause className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={resumeRecording}
                        className="px-4 py-3 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center gap-2 shadow-md"
                        title={t('resume_button')}
                      >
                        <Play className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={cancelRecording}
                      className="px-4 py-3 rounded-full bg-gray-600 hover:bg-gray-500 text-white flex items-center gap-2 shadow-md"
                      title={t('cancel_button')}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {audioChunks.length > 0 && !isRecording && (
                  <>
                    <button
                      onClick={downloadRecording}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Download className="h-5 w-5" />
                      {t('download_audio')}
                    </button>

                    <button
                      onClick={resetRecording}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <RotateCcw className="h-5 w-5" />
                      {t('reset_button')}
                    </button>
                  </>
                )}

                {(audioChunks.length > 0 || importedTranscript) && !isRecording && (
                  <button
                    onClick={analyzeRecording}
                    disabled={isAnalyzing}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        {t('analyzing')}
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        {t('analyze_button')}
                      </>
                    )}
                  </button>
                )}

                {!isRecording && audioChunks.length === 0 && !importedTranscript && (
                  <label className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg">
                    <Upload className="h-5 w-5" />
                    {t('import_audio_pdf')}
                    <input
                      type="file"
                      accept="audio/*,.pdf"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                )}

                {!isRecording && (audioChunks.length > 0 || importedTranscript) && (
                  <label className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg">
                    <Upload className="h-5 w-5" />
                    {t('import_file')}
                    <input
                      type="file"
                      accept="audio/*,.pdf"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-6 h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/10 text-gray-200'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoadingChat && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 px-4 py-2 rounded-lg">
                        <Loader className="h-5 w-5 animate-spin text-violet-400" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Posez une question..."
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-violet-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/60"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoadingChat}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-all duration-300 cursor-pointer"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && summary && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-violet-400" />
                  Résumé de la Réunion
                </h3>

                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-white/5 border border-violet-500/20">
                    <p className="text-violet-300 font-semibold mb-2">Résumé Exécutif</p>
                    <p className="text-gray-200 leading-relaxed">{renderAsText(summary.summary)}</p>
                  </div>

                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div className="p-4 rounded-lg bg-white/5 border border-violet-500/20">
                      <p className="text-violet-300 font-semibold mb-3">Points Clés</p>
                      <ul className="space-y-2 text-gray-200">
                        {summary.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{renderAsText(point)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileJson className="h-5 w-5" />
                        Télécharger le Résumé
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && effectiveTasks.length > 0 && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <ListChecks className="h-6 w-6 text-violet-400" />
                  Actions à Effectuer
                </h3>

                <div className="space-y-3">
                  {effectiveTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-white/5 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 rounded accent-violet-600 cursor-pointer"
                      />
                      <span className="text-gray-200 flex-1">{renderAsText(task)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Topics / Key Points Tab */}
          {activeTab === 'topics' &&
            summary &&
            Array.isArray(summary.keyPoints) &&
            summary.keyPoints.length > 0 && (
              <div className="lg:col-span-3">
                <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-violet-400" />
                    Points clés détectés
                  </h3>
                  <ul className="space-y-3">
                        {summary.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="p-4 rounded-lg bg-white/5 border border-violet-500/20 hover:border-violet-500/50 transition-all duration-300 flex items-start gap-3"
                      >
                        <span className="mt-1 w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                        <span className="text-gray-200 flex-1">{renderAsText(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

          {/* Transcript Tab */}
          {activeTab === 'transcript' && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Brain className="h-6 w-6 text-violet-400" />
                  Transcription Automatique
                </h3>
                <div className="p-6 rounded-lg bg-white/5 border border-violet-500/20 space-y-4 max-h-96 overflow-y-auto">
                  {importedTranscript ? (
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {importedTranscript}
                    </p>
                  ) : summary ? (
                    <div className="space-y-3">
                      {summary.summary && (
                        <p className="text-gray-300 leading-relaxed">{renderAsText(summary.summary)}</p>
                      )}
                      {Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0 && (
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {summary.keyPoints.map((point, idx) => (
                            <li key={idx}>{renderAsText(point)}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('no_transcript')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && summary && (
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/30 p-8">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <UploadIcon className="h-6 w-6 text-violet-400" />
                  {t('export_recording')}
                </h3>

                <div className="space-y-6">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {t('meeting_title_required')}
                    </label>
                    <input
                      type="text"
                      value={exportTitle}
                      onChange={(e) => setExportTitle(e.target.value)}
                      placeholder={t('enter_title')}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-violet-700/30 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>



                  {/* Email Recipients */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      {t('summary_recipients')}
                    </label>

                    {/* Add email input */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addEmailRecipient(newEmailInput)
                          }
                        }}
                        placeholder={t('add_email')}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-violet-700/30 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => addEmailRecipient(newEmailInput)}
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
                      >
                        {t('add_recipient')}
                      </button>
                    </div>

                    {/* Email list */}
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {emailRecipients.length > 0 ? (
                        emailRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/5 border border-violet-500/20"
                          >
                            <div className="flex-1">
                              <p className="text-gray-200 text-sm">{recipient.email}</p>
                              {recipient.type === 'subaccount' && (
                                <p className="text-gray-400 text-xs">{t('subaccount')}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeEmailRecipient(recipient.id)}
                              className="px-2 py-1 rounded text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          {t('no_recipients')}
                        </p>
                      )}
                    </div>

                    {/* Quick add from subaccounts */}
                    {subaccounts.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-xs mb-2">
                          {t('quick_add_subaccounts')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {subaccounts.map((subaccount) => (
                            <button
                              key={subaccount.id}
                              onClick={() => addSubaccountEmail(subaccount)}
                              disabled={emailRecipients.some(r => r.email === subaccount.email)}
                              className="px-3 py-1 text-xs rounded-full bg-violet-600/20 hover:bg-violet-600/40 disabled:opacity-50 disabled:cursor-not-allowed text-violet-300 border border-violet-500/30 transition-colors"
                            >
                              + {subaccount.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={saveRecording}
                      disabled={isSavingRecording || !exportTitle.trim()}
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      {isSavingRecording ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          {t('saving')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          {t('save_recording')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={downloadPdf}
                      disabled={isGeneratingPdf}
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          PDF
                        </>
                      ) : (
                        <>
                          <FileJson className="h-5 w-5" />
                          PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Editor Modal (handles both PDF export and Save modes) */}
      <Dialog open={showPdfEditor} onOpenChange={setShowPdfEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editorMode === 'pdf'
                ? t('edit_before_export')
                : t('edit_before_saving')}
            </DialogTitle>
            <DialogDescription>
              {editorMode === 'pdf'
                ? t('modify_before_export')
                : t('modify_before_save')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Summary */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('summary')}
              </label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-violet-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/60 h-24"
                placeholder={t('enter_summary')}
              />
            </div>

            {/* Key Points */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('max_key_points')}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                {editKeyPoints.map((point, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const updated = [...editKeyPoints]
                        updated[idx] = e.target.value
                        setEditKeyPoints(updated)
                      }}
                      className="flex-1 px-3 py-1 rounded-lg bg-white/5 border border-violet-500/20 text-white text-sm focus:outline-none focus:border-violet-500/60"
                    />
                    <button
                      onClick={() => setEditKeyPoints(editKeyPoints.filter((_, i) => i !== idx))}
                      className="px-2 py-1 text-red-400 hover:bg-red-500/20 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditKeyPoints([...editKeyPoints, ''])}
                disabled={editKeyPoints.length >= 25}
                className="px-3 py-1 text-sm rounded-lg bg-violet-600/30 hover:bg-violet-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-violet-300 border border-violet-500/30"
              >
                {t('add_key_point')}
              </button>
            </div>

            {/* Action Items */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('max_actions')}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                {editActionItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...editActionItems]
                        updated[idx] = e.target.value
                        setEditActionItems(updated)
                      }}
                      className="flex-1 px-3 py-1 rounded-lg bg-white/5 border border-violet-500/20 text-white text-sm focus:outline-none focus:border-violet-500/60"
                    />
                    <button
                      onClick={() => setEditActionItems(editActionItems.filter((_, i) => i !== idx))}
                      className="px-2 py-1 text-red-400 hover:bg-red-500/20 rounded text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setEditActionItems([...editActionItems, ''])}
                disabled={editActionItems.length >= 25}
                className="px-3 py-1 text-sm rounded-lg bg-violet-600/30 hover:bg-violet-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-violet-300 border border-violet-500/30"
              >
                {t('add_action')}
              </button>
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {t('transcript')}
              </label>
              <textarea
                value={editTranscript}
                onChange={(e) => setEditTranscript(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-violet-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-violet-500/60 h-24"
                placeholder={t('enter_transcript')}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <button className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white">
                {t('cancel_button_text')}
              </button>
            </DialogClose>
            <button
              onClick={editorMode === 'pdf' ? exportFromEditor : saveFromEditor}
              disabled={isGeneratingPdf || isSavingRecording}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2"
            >
              {(isGeneratingPdf || isSavingRecording) ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  {editorMode === 'pdf' ? t('generate_pdf') : t('saving')}
                </>
              ) : (
                <>
                  {editorMode === 'pdf' ? (
                    <>
                      <FileJson className="h-4 w-4" />
                      {t('generate_pdf')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t('save_recording')}
                    </>
                  )}
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Source Selection Modal */}
      <Dialog open={showAudioSourceModal} onOpenChange={setShowAudioSourceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('audio_source_modal_title')}
            </DialogTitle>
            <DialogDescription>
              {t('audio_source_modal_description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-6">
            {/* Microphone Option */}
            <button
              onClick={() => confirmAudioSource('microphone')}
              className="w-full p-4 rounded-lg border-2 border-violet-500/30 hover:border-violet-500/60 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left flex items-center gap-3"
            >
              <Mic className="h-6 w-6 text-violet-400" />
              <div>
                <p className="font-semibold text-white">
                  {t('microphone_option')}
                </p>
                <p className="text-xs text-gray-400">
                  {t('microphone_description')}
                </p>
              </div>
            </button>

            {/* System Audio Option */}
            <button
              onClick={() => confirmAudioSource('system')}
              className="w-full p-4 rounded-lg border-2 border-amber-500/30 hover:border-amber-500/60 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left flex items-center gap-3"
            >
              <Volume2 className="h-6 w-6 text-amber-400" />
              <div>
                <p className="font-semibold text-white">
                  {t('system_audio_option')}
                </p>
                <p className="text-xs text-gray-400">
                  {t('system_audio_description')}
                </p>
              </div>
            </button>

            {/* Both Option */}
            <button
              onClick={() => confirmAudioSource('both')}
              className="w-full p-4 rounded-lg border-2 border-emerald-500/30 hover:border-emerald-500/60 bg-white/5 hover:bg-white/10 transition-all duration-300 text-left flex items-center gap-3"
            >
              <Layers className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">
                  {t('both_option')}
                </p>
                <p className="text-xs text-gray-400">
                  {t('both_description')}
                </p>
              </div>
            </button>

            {/* Help Text */}
            <div className="mt-6 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
              <p className="text-xs text-amber-200">
                {t('audio_source_help')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button className="w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium">
                {t('cancel_button')}
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

