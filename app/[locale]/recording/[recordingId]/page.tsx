'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRecordingDetail } from './hooks/useRecordingDetail'
import AppHeader from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
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
import { ToastAction } from '@/components/ui/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type TabType = 'summary' | 'tasks' | 'keypoints' | 'transcript' | 'chat' | 'export'
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

  const isDesktop = typeof window !== 'undefined' && !!(window as any).electron

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
  const [isGeneratingKeyPoints, setIsGeneratingKeyPoints] = useState(false)
  const [keyPointsSource, setKeyPointsSource] = useState<'db' | 'ai' | 'user' | null>(null)
  const [editorMode, setEditorMode] = useState<'pdf' | 'save'>('pdf')
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'>((locale as any) || 'fr')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(null)
  const originalSummaryRef = useRef<string | null>(null)
  const originalKeyPointsRef = useRef<string[] | null>(null)
  const originalActionItemsRef = useRef<string[] | null>(null)
  const originalTranscriptRef = useRef<string | null>(null)
  const originalLanguageRef = useRef<string | null>(null)
  const displayedLanguageRef = useRef<string | null>(locale as any || 'fr')

  // direct language selection without confirmation (translate keyPoints immediately)

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
  // subaccounts feature removed from Recording Studio exports — avoid loading suggestions
  useEffect(() => {
    // keep state but do not fetch subaccounts to ensure no UI or hints appear
  }, [])

  // Utility to remove quick-add subaccount hints from action items
  const cleanQuickAddHints = (items: any[] | undefined) => {
    if (!items || !Array.isArray(items)) return []
    const quickAddLabel = t('quick_add_subaccounts') || ''
    return items
      .map((it) => (typeof it === 'string' ? it : (it.text || JSON.stringify(it))))
      .filter((text) => {
        if (!text) return false
        const lower = text.toLowerCase()
        if (quickAddLabel && lower.includes(String(quickAddLabel).toLowerCase())) return false
        if (/^\+\s*\S+/.test(text.trim())) return false
        return true
      })
  }

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for desktop save events (from Electron) and show toast
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const fp = e?.detail?.filePath
        if (fp) {
          const action = (
            <ToastAction altText={t('open_folder')} onClick={() => { try { (window as any).electron?.showItemInFolder(fp) } catch (_) {} }}>
              {t('open')}
            </ToastAction>
          )
          toast({ title: t('pdf_saved'), description: fp, action })
        }
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('electron-file-saved', handler as EventListener)
    return () => window.removeEventListener('electron-file-saved', handler as EventListener)
  }, [])

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

      // If keyPoints not present in summary JSON, try reading top-level recordingData.keypoints (DB field)
      try {
        if ((!parsedKeyPoints || parsedKeyPoints.length === 0) && Array.isArray((recordingData as any).keypoints)) {
          parsedKeyPoints = (recordingData as any).keypoints || []
        }
      } catch (e) {
        // ignore
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
      // Save originals (only set once)
      if (!originalSummaryRef.current) originalSummaryRef.current = parsedSummary || null
      if (!originalKeyPointsRef.current) originalKeyPointsRef.current = parsedKeyPoints && parsedKeyPoints.length > 0 ? parsedKeyPoints : null
      if (!originalActionItemsRef.current) originalActionItemsRef.current = parsedTasks && parsedTasks.length > 0 ? parsedTasks : null
      // originalLanguageRef: prefer recordingData.language if present
      if (!originalLanguageRef.current) originalLanguageRef.current = (recordingData && (recordingData.language as string)) || (locale as any) || 'fr'
      setKeyPointsSource(parsedKeyPoints && parsedKeyPoints.length > 0 ? 'db' : null)
      setTopics(extractedTopics)
      setEditSummary(parsedSummary)
      setEditKeyPoints(parsedKeyPoints)
      setEditActionItems(cleanQuickAddHints(parsedTasks))
    }
    
    if (recordingData?.transcript) {
      try {
        const transcriptData = typeof recordingData.transcript === 'string' 
          ? recordingData.transcript 
          : JSON.stringify(recordingData.transcript)
        setEditTranscript(transcriptData)
        if (!originalTranscriptRef.current) originalTranscriptRef.current = transcriptData
        // reset translated transcript when loading new recording
        setTranslatedTranscript(null)
      } catch (e) {
        setEditTranscript('')
      }
    }
  }, [recordingData])

  // Auto-generate keyPoints on initial recording load if none exist (use transcript only)
  useEffect(() => {
    // Do not auto-generate keyPoints client-side to avoid runtime AI costs.
    // Prefer keyPoints stored in the DB (set by processing or on save).
    if (Array.isArray(summary?.keyPoints) && summary.keyPoints.length > 0) {
      setKeyPointsSource('db')
    }
  }, [recordingData, summary])

  // When the PDF editor opens, ensure keyPoints are populated by generating from transcript if missing
  useEffect(() => {
    // No client-side generation when opening editor; editor will show DB keyPoints or user edits.
    if (showPdfEditor && Array.isArray(summary?.keyPoints) && summary.keyPoints.length > 0) {
      setEditKeyPoints(summary.keyPoints)
      setKeyPointsSource('db')
    }
  }, [showPdfEditor, summary])

  // Whenever selectedLanguage changes, translate using originals (do not cascade translations)
  useEffect(() => {
    const doTranslate = async () => {
      // Need original transcript to translate from
      if (!originalTranscriptRef.current) return

      // If user selected the original language, restore originals
      const origLang = originalLanguageRef.current || (locale as any) || 'fr'
      if (selectedLanguage === origLang) {
        // restore originals
        if (originalSummaryRef.current !== null) {
          setSummary((prev) => ({ ...(prev || { summary: '', tasks: [], keyPoints: [] }), summary: originalSummaryRef.current ?? '' }))
          setEditSummary(originalSummaryRef.current ?? '')
        }
        if (originalKeyPointsRef.current !== null) {
          setSummary((prev) => ({ ...(prev || { summary: '', tasks: [], keyPoints: [] }), keyPoints: originalKeyPointsRef.current || [] }))
          setEditKeyPoints(originalKeyPointsRef.current || [])
        }
        if (originalActionItemsRef.current !== null) setEditActionItems(originalActionItemsRef.current || [])
        if (originalTranscriptRef.current !== null) {
          setTranslatedTranscript(null)
          setEditTranscript(originalTranscriptRef.current)
        } else {
          setTranslatedTranscript(null)
        }
        displayedLanguageRef.current = origLang
        return
      }

      // Avoid re-translating to same language
      if (displayedLanguageRef.current === selectedLanguage) return

      try {
        setIsTranslating(true)
        const resp = await fetch('/api/ai/translate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: originalSummaryRef.current || '',
            keyPoints: originalKeyPointsRef.current || [],
            actionItems: originalActionItemsRef.current || [],
            transcript: originalTranscriptRef.current || '',
            language: selectedLanguage,
          }),
        })
        if (resp.ok) {
          const json = await resp.json()
          const tSummary = json.translatedSummary || ''
          const tKeyPoints = Array.isArray(json.translatedKeyPoints) ? json.translatedKeyPoints : []
          const tActionItems = Array.isArray(json.translatedActionItems) ? json.translatedActionItems : []
          const tTranscript = typeof json.translatedTranscript === 'string' ? json.translatedTranscript : (json.translatedTranscript ? JSON.stringify(json.translatedTranscript) : '')

          // Update UI with translated content
          setSummary((prev) => ({ ...(prev || { summary: '', tasks: [], keyPoints: [] }), summary: tSummary, keyPoints: tKeyPoints }))
          // Update editor buffers immediately so modal shows translated content when language is changed
          setEditSummary(tSummary)
          setEditKeyPoints(tKeyPoints)
          setEditActionItems(tActionItems)
          setEditTranscript(tTranscript || '')
          setTranslatedTranscript(tTranscript || null)
          // mark displayed language
          displayedLanguageRef.current = selectedLanguage
        }
      } catch (err) {
        console.error('Translation failed:', err)
      } finally {
        setIsTranslating(false)
      }
    }

    doTranslate()
  }, [selectedLanguage])

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
    // Use same chat flow as the Studio page: build a system/context prompt
    try {
      // Build meeting context from the analyzed summary and/or transcript
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

      if (!summary && recordingData?.transcript) {
        contextSections.push(`Transcription de la réunion:\n${typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript)}`)
      }

      const baseSystemPrompt =
        'You are a helpful assistant analyzing a meeting recording. Answer questions about the meeting content concisely. If the answer is not covered by the meeting context, say that you do not know instead of inventing. Respond in the same language as the user.'

      const contextPrompt = contextSections.length
        ? `Here is the meeting context, use it as the only source of truth:\n\n${contextSections.join('\n\n')}`
        : 'No meeting transcript or summary is available yet. Answer in a generic way and tell the user to run the analysis first if they expect meeting-specific answers.'

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `${baseSystemPrompt}\n\n${contextPrompt}`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputMessage },
          ],
        }),
      })

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || t('error'),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
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
      // If the selected language differs from the original, translate on-the-fly to ensure exported PDF uses requested language
      let transcriptToUse: any = editTranscript || recordingData?.transcript
      let summaryToUse = editSummary
      let keyPointsToUse = editKeyPoints
      let actionItemsToUse = editActionItems

      const origLang = originalLanguageRef.current || (locale as any) || 'fr'
      if (selectedLanguage && selectedLanguage !== origLang) {
        try {
          setIsTranslating(true)
          const resp = await fetch('/api/ai/translate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary: originalSummaryRef.current || editSummary || summary?.summary || '',
              keyPoints: originalKeyPointsRef.current || (summary?.keyPoints || []),
              actionItems: originalActionItemsRef.current || (summary?.tasks || []),
              transcript: originalTranscriptRef.current || (typeof recordingData?.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData?.transcript) || ''),
              language: selectedLanguage,
            }),
          })
          if (resp.ok) {
            const json = await resp.json()
            summaryToUse = json.translatedSummary || summaryToUse
            keyPointsToUse = Array.isArray(json.translatedKeyPoints) ? json.translatedKeyPoints : keyPointsToUse
            actionItemsToUse = Array.isArray(json.translatedActionItems) ? json.translatedActionItems : actionItemsToUse
            transcriptToUse = json.translatedTranscript || transcriptToUse
          }
        } catch (err) {
          console.error('On-the-fly translation failed for export:', err)
        } finally {
          setIsTranslating(false)
        }
      }

      // Filter out any quick-add subaccounts hints that may have been injected into action items
      const quickAddLabel = t('quick_add_subaccounts') || 'subaccounts';
      const cleanedActionItems = (actionItemsToUse || []).filter((item: any) => {
        const text = typeof item === 'string' ? item : (item.text || JSON.stringify(item));
        if (!text) return false;
        const lower = text.toLowerCase();
        if (quickAddLabel && lower.includes(String(quickAddLabel).toLowerCase())) return false;
        // remove lines that look like quick-added subaccount entries (e.g. "+ lenz youndauu")
        if (/^\+\s*\S+/.test(text.trim())) return false;
        return true;
      }).map((item: any, idx: number) => ({ id: idx + 1, text: typeof item === 'string' ? item : (item.text || JSON.stringify(item)) }));

      await exportTranscriptToPdf(
        transcriptToUse,
        exportTitle || recordingData?.title || 'Recording',
        {
          summary: summaryToUse,
          keyPoints: keyPointsToUse,
          actionItems: cleanedActionItems,
          date: recordingData?.startTime ? new Date(recordingData.startTime).toLocaleDateString() : undefined,
        },
        selectedLanguage,
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
          language: selectedLanguage,
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
            {t('back')}
          </Button>
          <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-8 text-center">
            <p className="text-red-300">{error || t('recording_not_found')}</p>
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
            <div className="flex gap-2">
              <ShareButton />
              <Button variant="outline" size="sm" onClick={handleDelete} className="border-red-500/30 text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('delete')}
              </Button>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
            {recordingData.title || t('untitled_recording')}
          </h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{new Date(recordingData.startTime).toLocaleDateString()}</span>
            <span>•</span>
            <span>{new Date(recordingData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {/* duration removed per request */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">{t('recording_id')}</p>
            <p className="text-white font-mono text-sm flex items-center justify-between">
              {recordingId.substring(0, 8)}...
              <button onClick={() => { navigator.clipboard.writeText(recordingId); toast({ title: t('copied') }) }} className="ml-2 hover:text-violet-300">
                <Copy className="w-4 h-4" />
              </button>
            </p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">{t('date')}</p>
            <p className="text-white font-semibold">{new Date(recordingData.startTime).toLocaleDateString()}</p>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">{t('tasks') || 'Tasks'}</p>
            {
              (() => {
                let count = 0
                try {
                  if (summary && Array.isArray((summary as any).tasks)) {
                    count = (summary as any).tasks.length
                  } else if (Array.isArray((recordingData as any).actionItems)) {
                    count = (recordingData as any).actionItems.length
                  } else if (typeof (recordingData as any).actionItems === 'string') {
                    const parsed = JSON.parse((recordingData as any).actionItems || '[]')
                    if (Array.isArray(parsed)) count = parsed.length
                  }
                } catch (e) {
                  // ignore parse errors
                }

                return <p className="text-white font-semibold">{count}</p>
              })()
            }
          </div>

          {/* duration card removed per request */}

          <div className="rounded-lg bg-gradient-to-br from-violet-900/30 to-purple-900/30 border border-violet-500/20 p-4">
            <p className="text-gray-400 text-sm mb-2">{t('status')}</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-white font-semibold">{t('processed')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-violet-500/20 overflow-x-auto">
            {(['summary', 'tasks', 'keypoints', 'transcript', 'chat', 'export'] as const).map((tab) => (
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
                {tab === 'keypoints' && <ListChecks className="inline w-4 h-4 mr-2" />}
                {tab === 'transcript' && <FileText className="inline w-4 h-4 mr-2" />}
                {tab === 'chat' && <Brain className="inline w-4 h-4 mr-2" />}
                {tab === 'export' && <Download className="inline w-4 h-4 mr-2" />}
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-900/20 to-purple-900/20 border border-violet-500/20 p-6 min-h-96">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-violet-300">{t('summary')}</h3>
                <p className="text-gray-300 leading-relaxed">{summary?.summary || recordingData.summary || t('no_summary')}</p>
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
              <h3 className="text-lg font-semibold mb-4 text-violet-300">{t('action_items')}</h3>
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
                <p className="text-gray-400">{t('no_action_items')}</p>
              )}
            </div>
          )}

          {activeTab === 'keypoints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold mb-4 text-violet-300">{t('key_points')}</h3>
                  {isGeneratingKeyPoints ? (
                    <div className="flex items-center text-sm text-gray-300">
                      <Loader className="w-4 h-4 animate-spin mr-2 text-violet-400" />
                      {t('generating')}
                    </div>
                  ) : keyPointsSource === 'ai' ? (
                    <span className="text-sm text-emerald-300 bg-emerald-900/20 px-2 py-0.5 rounded">{t('ai_generated')}</span>
                  ) : null}
                </div>
                <Button size="sm" variant="outline" onClick={async () => {
                  // Open editor prefilled for PDF export so user can edit key points before exporting
                  setEditSummary(summary?.summary || (typeof recordingData?.summary === 'string' ? recordingData.summary : ''))
                  const tasks = summary?.tasks || []
                  setEditActionItems(tasks.map((t: any) => (typeof t === 'string' ? t : JSON.stringify(t))))
                  const transcriptText = recordingData?.transcript 
                    ? (typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript))
                    : ''
                  setEditTranscript(transcriptText)
                  setEditorMode('pdf')
                  setExportTitle(recordingData?.title || '')

                  // Populate editor with DB-stored keyPoints (no on-demand AI generation)

                  setEditKeyPoints(summary?.keyPoints ? [...summary.keyPoints] : [])
                  setKeyPointsSource(summary?.keyPoints && summary.keyPoints.length > 0 ? 'db' : null)
                  // Clean any quick-add subaccount hints from action items before showing editor
                  setEditActionItems(cleanQuickAddHints(tasks))

                  setShowPdfEditor(true)
                }} className="border-violet-500/30">
                  {isGeneratingKeyPoints ? t('generating') : t('edit')}
                </Button>
              </div>

              {isGeneratingKeyPoints ? (
                <div className="flex items-center gap-2 text-gray-300">
                  <Loader className="w-5 h-5 animate-spin text-violet-400" />
                  <span>{t('generating_keypoints')}</span>
                </div>
              ) : summary?.keyPoints && summary.keyPoints.length > 0 ? (
                <ul className="space-y-3">
                  {summary.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3 p-3 rounded-lg bg-violet-900/20 border border-violet-500/20 text-gray-300">
                      <span className="text-violet-400">•</span>
                      <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">{t('no_key_points')}</p>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="border-violet-500/30"
                  onClick={() => { navigator.clipboard.writeText(translatedTranscript || (typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript)) || ''); toast({ title: t('copied') }) }}>
                  <Copy className="w-4 h-4 mr-2" />
                  {t('copy')}
                </Button>
              </div>
              <div className="bg-violet-950/20 rounded-lg p-4 max-h-96 overflow-y-auto border border-violet-500/20">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {translatedTranscript !== null
                    ? translatedTranscript
                    : (recordingData.transcript ? (typeof recordingData.transcript === 'string' ? recordingData.transcript : JSON.stringify(recordingData.transcript)) : 'No transcript available')}
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
                  placeholder={t('ask_question')}
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
                <h3 className="text-lg font-semibold mb-4 text-violet-300">{t('export_options')}</h3>
                {isDesktop && (
                  <p className="text-sm text-emerald-300 mb-2">{t('desktop_note')}</p>
                )}
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
                  <p className="text-xs text-gray-400">{t('create_download_pdf')}</p>
                </button>

                {/* 'Save Recording' button removed to match Studio export (view-only save removed) */}
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
              {editorMode === 'pdf' ? t('edit_pdf_content') : t('save_recording')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('language')}</label>
              <div className="flex items-center gap-3">
                <Select onValueChange={(v: string) => setSelectedLanguage(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue>{selectedLanguage}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                </SelectContent>
              </Select>
              {isTranslating && (
                <div className="flex items-center text-sm text-gray-300 ml-3">
                  <Loader className="w-4 h-4 animate-spin mr-2 text-violet-400" />
                  <span>{t('generating') || 'Translating...'}</span>
                </div>
              )}
                <Button size="sm" variant="outline" onClick={async () => {
                  // Translate current edited content into selected language
                  try {
                    setIsGeneratingKeyPoints(true)
                    const resp = await fetch('/api/ai/translate-content', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        summary: editSummary || summary?.summary,
                        keyPoints: editKeyPoints.length ? editKeyPoints : summary?.keyPoints,
                        actionItems: editActionItems.length ? editActionItems : summary?.tasks,
                        transcript: editTranscript || recordingData?.transcript,
                        language: selectedLanguage,
                      }),
                    })
                    if (resp.ok) {
                      const json = await resp.json()
                      if (json.translatedSummary) setEditSummary(json.translatedSummary)
                      if (Array.isArray(json.translatedKeyPoints)) setEditKeyPoints(json.translatedKeyPoints)
                      if (Array.isArray(json.translatedActionItems)) setEditActionItems(json.translatedActionItems)
                      if (json.translatedTranscript) setEditTranscript(json.translatedTranscript)
                      setKeyPointsSource('ai')
                      toast({ title: t('content_translated') })
                    } else {
                      toast({ title: t('translation_failed'), variant: 'destructive' })
                    }
                  } catch (err) {
                    console.error('Translate request failed', err)
                    toast({ title: t('translation_error'), variant: 'destructive' })
                  } finally {
                    setIsGeneratingKeyPoints(false)
                  }
                }} className="border-violet-500/30">{t('translate')}</Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('meeting_title')}</label>
              <input
                type="text"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('summary')}</label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('key_points_one_per_line')}</label>
              <textarea
                value={editKeyPoints.join('\n')}
                onChange={(e) => setEditKeyPoints(e.target.value.split('\n').filter(p => p.trim()))}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('action_items_one_per_line')}</label>
              <textarea
                value={editActionItems.join('\n')}
                onChange={(e) => setEditActionItems(e.target.value.split('\n').filter(i => i.trim()))}
                className="w-full bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-violet-500/50 h-20"
              />
            </div>

            {editorMode === 'save' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('email_recipients')}</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder={t('add_email')}
                    className="flex-1 bg-violet-950/30 border border-violet-500/20 rounded-lg px-4 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                  <Button onClick={addEmailRecipient} className="bg-violet-600 hover:bg-violet-500">
                    {t('add_recipient')}
                  </Button>
                </div>

                <div className="space-y-2">
                  {emailRecipients.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-violet-900/20 border border-violet-500/20 rounded-lg p-3">
                      <span className="text-gray-300">{r.email}</span>
                      <button onClick={() => setEmailRecipients(emailRecipients.filter(x => x.id !== r.id))} className="text-red-400">
                        {t('remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfEditor(false)} className="border-violet-500/30">
              {t('cancel_button_text')}
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

function ShareButton() {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [lang, setLang] = React.useState<'en'|'fr'|'es'|'de'|'pt'|'it'>('en')
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const doShare = async () => {
    // recordingId is available via URL params in parent scope, but keep simple: extract from location
    const parts = window.location.pathname.split('/')
    const recordingId = parts[parts.length - 1]
    if (!email.includes('@')) { toast({ title: 'Invalid email', variant: 'destructive' }); return }
    try {
      setLoading(true)
      const res = await fetch('/api/share', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ meetingId: recordingId, email, language: lang }) })
      const j = await res.json()
      if (res.ok) {
        toast({ title: 'Shared' })
        setOpen(false)
        setEmail('')
      } else if (res.status === 409) {
        toast({ title: 'This email already has access', variant: 'destructive' })
      } else {
        toast({ title: j.error || 'Failed to share', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Failed to share', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="border-violet-500/30">
        <Mail className="w-4 h-4 mr-2" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share recording</DialogTitle>
            <DialogDescription>Enter recipient email and language</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" className="w-full p-2 rounded bg-black/20 border border-border" />
            <select value={lang} onChange={(e:any) => setLang(e.target.value)} className="w-full p-2 rounded bg-black/20 border border-border">
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="it">Italiano</option>
            </select>
          </div>

          <DialogFooter>
            <Button onClick={doShare} disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
