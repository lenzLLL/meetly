import { useChatCore } from "@/app/[locale]/hooks/chat/useChatCore"
import { useAuth } from "@clerk/nextjs"
import { Subaccount } from "@prisma/client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export interface MeetingData {
    id: string
    title: string
    description?: string
    startTime: string
    endTime: string
    transcript?: any
    summary?: string
    actionItems?: Array<{
        id: number
        text: string
    }>
    speakers?: string[]
    processed: boolean
    processedAt?: string
    recordingUrl?: string
    emailSent: boolean
    emailSentAt?: string
    userId?: string
    user?: {
        name?: string
        email?: string
    }
    ragProcessed?: boolean,
    urls?:string[]
    permissions?:Subaccount[]
    subaccounts:Subaccount[]
}

export function useMeetingDetail() {
    const params = useParams()
    const meetingId = params.meetingId as string
    const { userId, isLoaded } = useAuth()
    const [subaccounts,setSubaccounts] = useState([])
    const [isOwner, setIsOwner] = useState(false)
    const [userChecked, setUserChecked] = useState(false)

    const [activeTab, setActiveTab] = useState<'summary' | 'transcript'|'recording'|'screens'|'permissions'>('summary')
    const [localActionItems, setLocalActionItems] = useState<any[]>([])
    const [meetingLanguage, setMeetingLanguage] = useState<'en' | 'fr' | 'es' | 'de' | 'pt' | 'it'>('en')
    const [isReanalyzing, setIsReanalyzing] = useState(false)

    const [meetingData, setMeetingData] = useState<MeetingData | null>(null)
    const [loading, setLoading] = useState(true)

    const chat = useChatCore({
        apiEndpoint: '/api/rag/chat-meeting',
        getRequestBody: (input) => (
            {
                meetingId, question: input
            }
        )
    })

    const handleSendMessage = async () => {
        if (!chat.chatInput.trim() || !isOwner) {
            return
        }
        await chat.handleSendMessage()
    }

    const handleSuggestionClick = (suggestion: string) => {
        if (!isOwner) {
            return
        }

        chat.handleSuggestionClick(suggestion)
    }

    const handleInputChange = (value: string) => {
        if (!isOwner) {
            return
        }

        chat.handleInputChange(value)
    }

    useEffect(() => {
        const fetchMeetingData = async () => {
            try {
                const response = await fetch(`/api/meetings/${meetingId}`)
                if (response.ok) {
                    const data = await response.json()
                    setMeetingData(data)
                    if (isLoaded) {
                        const ownerStatus = userId === data.userId
                        setIsOwner(ownerStatus)
                        setUserChecked(true)
                    }

                    if (data.actionItems && data.actionItems.length > 0) {
                        setLocalActionItems(data.actionItems)
                    } else {
                        setLocalActionItems([])
                    }
                }
            } catch (error) {
                console.error('error fetching meeting:', error)
            } finally {
                setLoading(false)
            }
        }
        if (isLoaded) {
            fetchMeetingData()
        }
    }, [meetingId, userId, isLoaded])

    useEffect(() => {
        const processTranscript = async () => {
            try {
                const meetingResponse = await fetch(`/api/meetings/${meetingId}`)
                if (!meetingResponse.ok) {
                    return
                }
                const meeting = await meetingResponse.json()

                if (meeting.transcript && !meeting.ragProcessed && userId == meeting.userId) {
                    let transcriptText = ''
                    if (typeof meeting.transcript === 'string') {
                        transcriptText = meeting.transcript
                    } else if (Array.isArray(meeting.transcript)) {
                        transcriptText = meeting.transcript
                            .map((segment: any) => `${segment.speaker}: ${segment.words.map((w: any) => w.word).join(' ')}`)
                            .join('\n')
                    }

                    await fetch('/api/rag/process', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            meetingId,
                            transcript: transcriptText,
                            meetingTitle: meeting.title
                        })
                    })
                }
            } catch (error) {
                console.error('error checking RAG processing:', error)

            }
        }
        if (isLoaded && userChecked) {
            processTranscript()
        }
    }, [meetingId, userId, isLoaded, userChecked])


    const deleteActionItem = async (id: number) => {
        if (!isOwner) {
            return
        }

        setLocalActionItems(prev => prev.filter(item => item.id !== id))

    }

    const addActionItem = async (text: string) => {
        if (!isOwner) {
            return
        }
        try {
            const response = await fetch(`/api/meetings/${meetingId}`)
            if (response.ok) {
                const data = await response.json()
                setMeetingData(data)
                setLocalActionItems(data.actionItems || [])
            }
        } catch (error) {
            console.error('error refetching meeting data: ', error)
        }
    }

    const handleLanguageChange = async (newLanguage: 'en' | 'fr' | 'es' | 'de' | 'pt' | 'it') => {
        if (!isOwner || !meetingId) return

        setMeetingLanguage(newLanguage)
        setIsReanalyzing(true)

        try {
            // Fetch original transcript for analysis only
            const response = await fetch(`/api/meetings/${meetingId}`)
            if (!response.ok) throw new Error('failed to fetch meeting')
            const meeting = await response.json()

            let transcriptText = ''
            if (typeof meeting.transcript === 'string') {
                transcriptText = meeting.transcript
            } else if (Array.isArray(meeting.transcript)) {
                transcriptText = meeting.transcript
                    .map((segment: any) => `${segment.speaker}: ${segment.words?.map((w: any) => w.word || w).join(' ') || segment.content || ''}`)
                    .join('\n')
            }

            // Re-analyze the transcript with the new language (for summary/actionItems only)
            const analyzeRes = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: transcriptText,
                    language: newLanguage,
                }),
            })

            if (analyzeRes.ok) {
                const result = await analyzeRes.json()
                
                // Translate the title
                let translatedTitle = meeting.title
                if (newLanguage !== 'fr') {
                    const titleRes = await fetch('/api/ai/translate-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            texts: [meeting.title], 
                            targetLanguage: newLanguage 
                        }),
                    })
                    if (titleRes.ok) {
                        const { translations } = await titleRes.json()
                        translatedTitle = translations[0] || meeting.title
                    }
                }
                
                // IMPORTANT: Do NOT persist translations to the database.
                // Only update local UI state so nothing is modified server-side.
                const localUpdated = {
                    ...meeting,
                    summary: result.summary,
                    actionItems: result.actionItems || [],
                    title: translatedTitle,
                }

                setMeetingData(localUpdated)
                setLocalActionItems(localUpdated.actionItems || [])
            }
        } catch (error) {
            console.error('error re-analyzing with new language:', error)
        } finally {
            setIsReanalyzing(false)
        }
    }

    const displayActionItems = localActionItems.length > 0
        ? localActionItems.map((item: any) => ({
            id: item.id,
            text: item.text
        }))
        : []


    const meetingInfoData = meetingData ? {
        title: meetingData.title,
        date: new Date(meetingData.startTime).toLocaleDateString(),
        time: `${new Date(meetingData.startTime).toLocaleTimeString()} - ${new Date(meetingData.endTime).toLocaleTimeString()}`,
        userName: meetingData.user?.name || "User"
    } : {
        title: "loading...",
        date: "loading...",
        time: "loading...",
        userName: "loading...",
    }

    return {
        meetingId,
        isOwner,
        userChecked,
        activeTab,
        setActiveTab,
        localActionItems,
        setLocalActionItems,
        meetingData,
        setMeetingData,
        loading,
        setLoading,
        chatInput: chat.chatInput,
        setChatInput: chat.setChatInput,
        messages: chat.messages,
        setMessages: chat.setMessages,
        showSuggestions: chat.showSuggestions,
        setShowSuggestions: chat.setShowSuggestions,
        isLoading: chat.isLoading,
        setIsLoading: chat.setIsLoading,
        handleSendMessage,
        handleSuggestionClick,
        handleInputChange,
        deleteActionItem,
        addActionItem,
        displayActionItems,
        meetingInfoData,
        meetingLanguage,
        setMeetingLanguage,
        handleLanguageChange,
        isReanalyzing,
    }

}