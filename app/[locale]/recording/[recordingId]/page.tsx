'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRecordingDetail } from './hooks/useRecordingDetail'
import AppHeader from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  ArrowLeft,
  Download,
  FileText,
  ListChecks,
  Brain,
  Send,
  Loader,
  CheckCircle,
  Trash2,
  Copy,
  FileJson,
  Mail,
} from 'lucide-react'
import { useToast } from '@/components/ui/use_toast'
import { exportTranscriptToPdf } from '@/lib/transcript-export'

type TabType = 'summary' | 'tasks' | 'topics' | 'transcript' | 'chat' | 'export'
type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface EmailRecipient {
  id: string
  email: string
  type: 'subaccount' | 'custom'
}

interface Subaccount {
  id: string
  name: string
  email: string
}

export default function RecordingDetailPage() {
  const t = useTranslations('Recording')
  const locale = useLocale()
  const router = useRouter()
  const { recordingId, recordingData, loading, error } = useRecordingDetail()
  const { toast } = useToast()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('summary')

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

  // PDF Editor modal states
  const [showPdfEditor, setShowPdfEditor] = useState(false)
  const [editSummary, setEditSummary] = useState('')
  const [editKeyPoints, setEditKeyPoints] = useState<string[]>([])
  const [editActionItems, setEditActionItems] = useState<string[]>([])
  const [editTranscript, setEditTranscript] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [editorMode, setEditorMode] = useState<'pdf' | 'save'>('pdf')

  // Export states
  const [exportTitle, setExportTitle] = useState('')
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([])
  const [newEmailInput, setNewEmailInput] = useState('')
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([])
  const [isLoadingSubaccounts, setIsLoadingSubaccounts] = useState(false)
  const [isSavingRecording, setIsSavingRecording] = useState(false)

  // Parse data
  const [summary, setSummary] = useState<{ summary: string; tasks: string[]; keyPoints: string[] } | null>(null)
  const [topics, setTopics] = useState<string[]>([])

  // Extract topics from summary/description
  const extractTopics = (input: any): string[] => {
    if (!input) return []

    // Normalize input to plain text
    let text = ''
    try {
      if (typeof input === 'string') {
        text = input
      } else if (Array.isArray(input)) {
        text = input.join(' ')
      } else if (typeof input === 'object') {
        // common shapes: { text }, { transcript }, or complex objects
        text = input.text || input.transcript || JSON.stringify(input)
      } else {
        text = String(input)
      }
    } catch (e) {
      text = String(input)
    }

    if (!text || text.trim().length < 20) return []

    // Basic heuristic: split into sentences and pick likely topic sentences
    const sentences = text
      .replace(/\s+/g, ' ')
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    // Score sentences by length and presence of keywords
    const topicKeywords = ['about', 'regarding', 'discuss', 'topic', 'agenda', 'decide', 'decision', 'action', 'plan', 'next steps']

    const scored = sentences.map((s) => {
      const lower = s.toLowerCase()
      const score = (topicKeywords.reduce((acc, k) => acc + (lower.includes(k) ? 2 : 0), 0)) + Math.min(5, Math.max(0, Math.floor(s.length / 40)))
      return { s, score }
    })

    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, 6).map((x) => x.s).filter((s) => s.length > 10 && s.length < 200)
  }

  // Load subaccounts when user opens Export tab (match studio behavior)
  useEffect(() => {
    const loadSubaccounts = async () => {
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

    if (activeTab === 'export') {
      loadSubaccounts()
    }
  }, [activeTab])

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Extract summary from recording
  useEffect(() => {
    if (recordingData && !summary) {
      let parsedSummary = ''
      let parsedKeyPoints: string[] = []
      let parsedTasks: string[] = []
      let extractedTopics: string[] = []

      // Parse summary string
      try {
        if (typeof recordingData.summary === 'string') {
          const parsed = JSON.parse(recordingData.summary)
          parsedSummary = parsed.summary || parsed.text || recordingData.summary
          parsedKeyPoints = Array.isArray(parsed.keyPoints) ? parsed.keyPoints : []
        } else {
          parsedSummary = recordingData.summary || ''
        }
      } catch (e) {
        parsedSummary = recordingData.summary || ''
      }

      // Parse action items from Json field
      if (recordingData.actionItems) {
        try {
          const items = typeof recordingData.actionItems === 'string' 
            ? JSON.parse(recordingData.actionItems)
            : recordingData.actionItems
          
          if (Array.isArray(items)) {
            parsedTasks = items
              .map((item: any) => {
                if (typeof item === 'string') return item
                if (item.text) return item.text
                if (item.task) return item.task
                if (item.name) return item.name
                return JSON.stringify(item)
              })
              .filter((t: string) => t.trim())
          }
        } catch (e) {
          console.error('Error parsing actionItems:', e)
        }
      }

      // Extract topics from summary
      if (parsedSummary) {
        extractedTopics = extractTopics(parsedSummary)
      }

      setSummary({
        summary: parsedSummary,
        tasks: parsedTasks,
        keyPoints: parsedKeyPoints,
      })
      setTopics(extractedTopics)
      setEditSummary(parsedSummary)
      setEditKeyPoints(parsedKeyPoints)
      setEditActionItems(parsedTasks)
    }
    
    if (recordingData?.transcript) {
      try {
        const transcriptData = typeof recordingData.transcript === 'string' 
          ? recordingData.transcript 
          : JSON.stringify(recordingData.transcript)
        setEditTranscript(transcriptData)
      } catch (e) {
        setEditTranscript('')
      }
    }
  }, [recordingData])

  const handleDelete = async () => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        const response = await fetch(`/api/studio-recordings/${recordingId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          toast({ title: t('deleted') })
          router.push('/home')
        }
      } catch (err) {
        console.error('Failed to delete recording:', err)
        toast({ title: t('error'), variant: 'destructive' })
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoadingChat(true)

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inputMessage,
          meetingId: recordingId,
        }),
      })

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || t('error'),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('error'),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      await exportTranscriptToPdf(
        editTranscript,
        exportTitle || recordingData?.title || 'Recording',
        {
          summary: editSummary,
          keyPoints: editKeyPoints,
          actionItems: editActionItems.map((item, idx) => ({ id: idx + 1, text: item })),
          date: recordingData?.startTime ? new Date(recordingData.startTime).toLocaleDateString() : undefined,
        },
        locale as 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it',
        false
      )
      toast({ title: t('pdf_generated') })
      setShowPdfEditor(false)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast({ title: t('error'), variant: 'destructive' })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleSaveRecording = async () => {
    if (!exportTitle.trim()) {
      toast({ title: t('enter_title'), variant: 'destructive' })
      return
    }

    // Prevent double submission
    if (isSavingRecording) return

    setIsSavingRecording(true)

    // Create a unique request ID to prevent duplicate submissions
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
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
          startTime: recordingData?.startTime,
          endTime: recordingData?.endTime,
          language: locale,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        toast({ title: t('saved') })
        setShowPdfEditor(false)
        setExportTitle('')
        setEmailRecipients([])
        setNewEmailInput('')
      } else {
        toast({ title: data.error || t('error'), variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({ title: t('error'), variant: 'destructive' })
    } finally {
      setIsSavingRecording(false)
    }
  }

  const addEmailRecipient = () => {
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      toast({ title: t('invalid_email'), variant: 'destructive' })
      return
    }
    if (emailRecipients.some(r => r.email === newEmailInput)) {
      toast({ title: t('duplicate'), variant: 'destructive' })
      return
    }
    setEmailRecipients([...emailRecipients, { id: Date.now().toString(), email: newEmailInput, type: 'custom' }])
    setNewEmailInput('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-12 flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </div>
    )
  }

  if (error || !recordingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020]">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-6 border-violet-500/30">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-8 text-center">
            <p className="text-red-300">{error || 'Recording not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white">
      <AppHeader />

      {/* Header */}
      <div className="border-b border-violet-500/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="border-violet-500/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="border-red-500/30 text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
            {recordingData.title || 'Untitled Recording'}
          </h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{new Date(recordingData.startTime).toLocaleDateString()}</span>
            <span>•</span>
            <span>{new Date(recordingData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {recordingData.endTime && (
              <>
                <span>•</span>
                <span>
                  Duration:{' '}
                  {Math.round((new Date(recordingData.endTime).getTime() - new Date(recordingData.startTime).getTime()) / 60000)} min
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">Recording ID</p>
            <p className="text-white font-mono text-sm flex items-center justify-between">
              {recordingId.substring(0, 8)}...
              <button onClick={() => { navigator.clipboard.writeText(recordingId); toast({ title: 'Copied' }) }} className="ml-2 hover:text-violet-300">
                <Copy className="w-4 h-4" />
              </button>
            </p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">Date</p>
            <p className="text-white font-semibold">{new Date(recordingData.startTime).toLocaleDateString()}</p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">Duration</p>
            <p className="text-white font-semibold">
              {recordingData.endTime
                ? `${Math.round((new Date(recordingData.endTime).getTime() - new Date(recordingData.startTime).getTime()) / 60000)} min`
                : 'N/A'}
            </p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">Status</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-white font-semibold">Processed</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-violet-500/20 overflow-x-auto">
            {(['summary', 'tasks', 'topics', 'transcript', 'chat', 'export'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-violet-400 text-violet-300'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'summary' && <FileText className="inline w-4 h-4 mr-2" />}
                {tab === 'tasks' && <ListChecks className="inline w-4 h-4 mr-2" />}
                {tab === 'topics' && <Brain className="inline w-4 h-4 mr-2" />}
                {tab === 'transcript' && <FileText className="inline w-4 h-4 mr-2" />}
                {tab === 'chat' && <Brain className="inline w-4 h-4 mr-2" />}
                {tab === 'export' && <Download className="inline w-4 h-4 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/20 p-6 min-h-96">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-violet-300">Summary</h3>
                <p className="text-gray-300 leading-relaxed">{summary?.summary || recordingData.summary || 'No summary available'}</p>
              </div>
              {summary?.keyPoints && summary.keyPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-violet-300">Key Points</h3>
                  <ul className="space-y-2">
                    {summary.keyPoints.map((point, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300">
                        <span className="text-violet-400">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-violet-300">Action Items</h3>
              {summary?.tasks && summary.tasks.length > 0 ? (
                <ul className="space-y-3">
                  {summary.tasks.map((task, idx) => (
                    <li key={idx} className="flex gap-3 p-3 rounded-lg bg-violet-900/20 border border-violet-500/20">
                      <CheckCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{task}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No action items identified</p>
              )}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-violet-300">Topics Discussed</h3>
              {topics && topics.length > 0 ? (
                <ul className="space-y-3">
                  {topics.map((topic, idx) => (
                    <li key={idx} className="flex gap-3 p-3 rounded-lg bg-violet-900/20 border border-violet-500/20">
                      <Brain className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{topic}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No topics identified yet. Topics are extracted from the summary and transcript.</p>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="border-violet-500/30"
                  onClick={() => { navigator.clipboard.writeText(recordingData.transcript || ''); toast({ title: 'Copied' }) }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="bg-violet-950/20 rounded-lg p-4 max-h-96 overflow-y-auto border border-violet-500/20">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {recordingData.transcript ? (typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript)) : 'No transcript available'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-violet-900/30 border border-violet-500/20 text-gray-300'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about the recording..."
                  className="flex-1 bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                />
                <Button onClick={handleSendMessage} disabled={isLoadingChat} className="bg-violet-600 hover:bg-violet-500">
                  {isLoadingChat ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-violet-300">Export Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setEditorMode('pdf')
                    setExportTitle(recordingData?.title || '')
                    setShowPdfEditor(true)
                  }}
                  className="p-4 rounded-lg border-2 border-violet-500/30 hover:border-violet-500/60 bg-white/5 hover:bg-white/10 transition-all text-left"
                >
                  <FileJson className="w-6 h-6 text-violet-400 mb-2" />
                  <p className="font-semibold text-white">{t('generate_pdf')}</p>
                  <p className="text-xs text-gray-400">Create and download PDF</p>
                </button>

                <button
                  onClick={() => {
                    // Prefill editor with existing analysis before opening in save mode
                    setEditSummary(summary?.summary || (typeof recordingData?.summary === 'string' ? recordingData.summary : ''))
                    setEditKeyPoints(summary?.keyPoints ? [...summary.keyPoints] : [])
                    const tasks = summary?.tasks || []
                    setEditActionItems(tasks.map((t: any) => (typeof t === 'string' ? t : (t?.text || t?.name || JSON.stringify(t)))))
                    const transcriptText = recordingData?.transcript 
                      ? (typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript))
                      : ''
                    setEditTranscript(transcriptText)
                    setEditorMode('save')
                    setExportTitle(recordingData?.title || '')
                    setEmailRecipients([])
                    setNewEmailInput('')
                    setShowPdfEditor(true)
                  }}
                  className="p-4 rounded-lg border-2 border-emerald-500/30 hover:border-emerald-500/60 bg-white/5 hover:bg-white/10 transition-all text-left"
                >
                  <Mail className="w-6 h-6 text-emerald-400 mb-2" />
                  <p className="font-semibold text-white">{t('save_recording')}</p>
                  <p className="text-xs text-gray-400">Save and share with team</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Editor Dialog */}
      <Dialog open={showPdfEditor} onOpenChange={setShowPdfEditor}>
        <DialogContent className="bg-gradient-to-br from-[#1a0033] to-[#100020] border-violet-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-violet-300">
              {editorMode === 'pdf' ? 'Edit PDF Content' : 'Save Recording'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Summary</label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Key Points (one per line)</label>
              <textarea
                value={editKeyPoints.join('\n')}
                onChange={(e) => setEditKeyPoints(e.target.value.split('\n').filter(p => p.trim()))}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Action Items (one per line)</label>
              <textarea
                value={editActionItems.join('\n')}
                onChange={(e) => setEditActionItems(e.target.value.split('\n').filter(i => i.trim()))}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-20"
              />
            </div>

            {editorMode === 'save' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Recipients</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Add email"
                    className="flex-1 bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                  <Button onClick={addEmailRecipient} className="bg-violet-600 hover:bg-violet-500">
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {emailRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-violet-900/20 border border-violet-500/20 rounded-lg p-3">
                      <span className="text-gray-300">{r.email}</span>
                      <button onClick={() => setEmailRecipients(emailRecipients.filter(x => x.id !== r.id))} className="text-red-400">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfEditor(false)} className="border-violet-500/30">
              Cancel
            </Button>
            {editorMode === 'pdf' ? (
              <Button onClick={handleGeneratePdf} disabled={isGeneratingPdf} className="bg-violet-600 hover:bg-violet-500">
                {isGeneratingPdf ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {t('generate_pdf')}
              </Button>
            ) : (
              <Button onClick={handleSaveRecording} disabled={isSavingRecording} className="bg-violet-600 hover:bg-violet-500">
                {isSavingRecording ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {isSavingRecording ? t('saving') : t('save')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}
