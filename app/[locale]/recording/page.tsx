'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Mic,
  Square,
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
} from 'lucide-react'

type TabType = 'recording' | 'chat' | 'summary' | 'tasks' | 'topics' | 'transcript'
type AudioSource = 'microphone' | 'system' | 'both'
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function RecordingPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'fr'

  // Recording states
  const [activeTab, setActiveTab] = useState<TabType>('recording')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedTime, setRecordedTime] = useState(0)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioSource, setAudioSource] = useState<AudioSource>('microphone')
  const [language, setLanguage] = useState(locale)
  const [showAudioSettings, setShowAudioSettings] = useState(false)
  const [importedTranscript, setImportedTranscript] = useState<string>('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Bonjour! Je suis votre assistant IA. Posez-moi des questions sur la réunion qui vient de se terminer.',
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
  const { user } = useUser()

  // Source of truth for tasks shown in the Tasks tab
  const effectiveTasks =
    summary && Array.isArray(summary.tasks) && summary.tasks.length > 0
      ? summary.tasks
      : tasks

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Initialize recording
  const startRecording = async () => {
    try {
      const constraints: MediaStreamConstraints = { audio: false }

      if (audioSource === 'microphone' || audioSource === 'both') {
        constraints.audio = true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Handle system audio (requires getDisplayMedia on supported browsers)
      let systemAudioStream: MediaStream | null = null
      if (
        (audioSource === 'system' || audioSource === 'both') &&
        navigator.mediaDevices.getDisplayMedia
      ) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false,
          } as DisplayMediaStreamOptions)
          systemAudioStream = displayStream
        } catch (e) {
          console.log('System audio not available')
        }
      }

      // Merge streams if both are available
      const finalStream = new MediaStream()
      if (audioSource === 'both' && systemAudioStream) {
        stream.getAudioTracks().forEach((track) => finalStream.addTrack(track))
        systemAudioStream.getAudioTracks().forEach((track) => finalStream.addTrack(track))
      } else if (systemAudioStream) {
        finalStream.addTrack(systemAudioStream.getAudioTracks()[0])
      } else {
        finalStream.addTrack(stream.getAudioTracks()[0])
      }

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(finalStream)
      source.connect(analyserRef.current)

      const mediaRecorder = new MediaRecorder(finalStream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => setAudioChunks(chunks)

      mediaRecorder.start()
      setIsRecording(true)
      setRecordedTime(0)
      setAudioChunks([])

      if (canvasRef.current && analyserRef.current) {
        visualize()
      }
    } catch (error) {
      console.error('Error accessing audio:', error)
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

      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
    }

    if (isRecording) {
      requestAnimationFrame(visualize)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
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
    try {
      let transcript = importedTranscript
      let result: { summary: string; tasks: string[]; keyPoints: string[] } | null = null

      if (audioChunks.length > 0) {
        // Always prefer audio when available
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', audioBlob, `recording-${Date.now()}.webm`)
        formData.append('language', language)

        const response = await fetch('/api/recording/transcribe-and-analyze', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          console.error('Error during OpenAI audio transcription/analysis')
          throw new Error('Failed to transcribe and analyze audio')
        }

        const data = await response.json()
        transcript = data.transcript || ''
        const normalizedTasks =
          Array.isArray(data.tasks)
            ? data.tasks
            : Array.isArray((data as any).actionItems)
              ? (data as any).actionItems
              : []
        const normalizedKeyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : []
        result = {
          summary: data.summary || '',
          tasks: normalizedTasks,
          keyPoints: normalizedKeyPoints,
        }

        setImportedTranscript(transcript || '')
      } else if (hasRealTranscript) {
        // Direct analysis of existing text transcript
        const response = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            language,
          }),
        })

        const data = await response.json()
        const normalizedTasks =
          Array.isArray(data.tasks)
            ? data.tasks
            : Array.isArray((data as any).actionItems)
              ? (data as any).actionItems
              : []
        const normalizedKeyPoints = Array.isArray(data.keyPoints) ? data.keyPoints : []
        result = {
          summary: data.summary || '',
          tasks: normalizedTasks,
          keyPoints: normalizedKeyPoints,
        }
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
      setIsAnalyzing(false)
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

    setIsGeneratingPdf(true)
    try {
      const response = await fetch('/api/ai/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...summary, language }),
      })

      const data = await response.json()

      // For now, download as HTML
      const element = document.createElement('a')
      const file = new Blob([data.html], { type: 'text/html' })
      element.href = URL.createObjectURL(file)
      element.download = `meeting-summary-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const resetRecording = () => {
    setAudioChunks([])
    setRecordedTime(0)
    setSummary(null)
    setTasks([])
    setImportedTranscript('')
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content:
          'Bonjour! Je suis votre assistant IA. Posez-moi des questions sur la réunion qui vient de se terminer.',
      },
    ])
  }

  // Import audio file
  const handleAudioImport = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

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
      // Reset previous analysis when a new audio file is imported
      setSummary(null)
      setTasks([])

      // Clear any previous transcript to force fresh transcription
      setImportedTranscript('')
    } catch (error) {
      console.error('Error importing audio:', error)
    }
  }

  // Import PDF file
  const handlePdfImport = async (file: File) => {
    try {
      setSummary(null)
      setTasks([])
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ai/process-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        setImportedTranscript(`PDF file imported: ${file.name}. Send it to AI for analysis.`)
        return
      }

      const data = await response.json()
      setImportedTranscript(data.text || `PDF file imported: ${file.name}`)
    } catch (error) {
      console.error('Error importing PDF:', error)
      setImportedTranscript(`PDF file imported: ${file.name}. Ready for analysis.`)
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

    if (file.type.startsWith('audio/')) {
      handleAudioImport(file)
    } else if (file.type === 'application/pdf') {
      handlePdfImport(file)
    }

    // Reset input
    event.target.value = ''
  }

  // Timer
  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      setRecordedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording])

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
            Recording Studio
          </h1>
          <p className="text-gray-500">Enregistrez, analysez et partagez vos audios</p>

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
              <h3 className="font-bold text-lg mb-4 text-violet-200">Paramètres</h3>

              {/* Audio Source Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-400 mb-2">Source Audio</label>
                <div className="space-y-2">
                  {[
                    { value: 'microphone', label: '🎤 Microphone' },
                    { value: 'system', label: '🔊 Audio Système' },
                    { value: 'both', label: '🎧 Microphone + Système' },
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
                <label className="block text-sm font-semibold text-gray-400 mb-2">Langue</label>
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
            { id: 'recording' as TabType, label: 'Enregistrement', icon: Mic },
            {
              id: 'chat' as TabType,
              label: 'Assistant IA',
              icon: Brain,
              disabled: audioChunks.length === 0 && !importedTranscript,
            },
            {
              id: 'summary' as TabType,
              label: 'Résumé',
              icon: FileText,
              disabled: !summary,
            },
            {
              id: 'tasks' as TabType,
              label: 'Tâches',
              icon: ListChecks,
              disabled: effectiveTasks.length === 0,
            },
            {
              id: 'topics' as TabType,
              label: 'Points clés',
              icon: ListChecks,
              disabled: !summary,
            },
            {
              id: 'transcript' as TabType,
              label: 'Transcription',
              icon: Brain,
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
              <div className="canvas-wrapper rounded-2xl overflow-hidden p-4 bg-gradient-to-br from-violet-950/40 to-purple-950/40 border border-violet-700/15">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* Timer */}
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-violet-800/20 to-purple-800/20 border border-violet-700/25 rounded-xl px-8 py-4 backdrop-blur-md">
                  <p className="text-gray-500 text-sm mb-1">Temps d'enregistrement</p>
                  <p className="text-4xl font-bold font-mono text-violet-200">{formatTime(recordedTime)}</p>
                </div>
              </div>

              {isRecording && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-red-500 font-semibold">En cours d'enregistrement...</span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-4 justify-center flex-wrap">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="record-button group relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-700 via-violet-600 to-purple-700 hover:from-violet-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="record-button active w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 animate-pulse flex items-center justify-center cursor-pointer shadow-lg"
                  >
                    <Square className="h-8 w-8 text-white" fill="white" />
                  </button>
                )}

                {audioChunks.length > 0 && !isRecording && (
                  <>
                    <button
                      onClick={downloadRecording}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Download className="h-5 w-5" />
                      Télécharger Audio
                    </button>

                    <button
                      onClick={resetRecording}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Réinitialiser
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
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Analyser
                      </>
                    )}
                  </button>
                )}

                {!isRecording && audioChunks.length === 0 && !importedTranscript && (
                  <label className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-lg">
                    <Upload className="h-5 w-5" />
                    Importer Audio/PDF
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
                    Importer Fichier
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
                    <p className="text-gray-200 leading-relaxed">{summary.summary}</p>
                  </div>

                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div className="p-4 rounded-lg bg-white/5 border border-violet-500/20">
                      <p className="text-violet-300 font-semibold mb-3">Points Clés</p>
                      <ul className="space-y-2 text-gray-200">
                        {summary.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{point}</span>
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
                      <span className="text-gray-200 flex-1">{task}</span>
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
                        <span className="text-gray-200 flex-1">{point}</span>
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
                        <p className="text-gray-300 leading-relaxed">{summary.summary}</p>
                      )}
                      {Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0 && (
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {summary.keyPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune transcription n'est disponible pour le moment. Lance une analyse ou importe un
                      transcript pour la voir ici.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
