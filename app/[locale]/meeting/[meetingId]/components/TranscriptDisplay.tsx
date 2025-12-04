'use client'

import { useTranslations } from 'next-intl'

interface TranscriptWord {
    word: string
    start: number
    end: number
}

interface TranscriptSegment {
    words?: TranscriptWord[]
    offset?: number
    speaker?: string
    content?: string
    speakerName?: string
}

interface TranscriptDisplayProps {
    transcript: TranscriptSegment[]
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
    const t = useTranslations('Meetings')

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    const getSpeakerSegmentTime = (segment: TranscriptSegment) => {
        const startTime = segment.offset || 0
        const endTime = (segment.words && segment.words.length > 0) 
            ? segment.words[segment.words.length - 1]?.end || startTime
            : startTime
        return `${formatTime(startTime)} - ${formatTime(endTime)}`
    }

    const getSegmentText = (segment: TranscriptSegment) => {
        // Support both old format (words array) and chunk format (content string)
        if (segment.content) return segment.content
        if (segment.words) return segment.words.map((w: any) => w.word).join(' ')
        return ''
    }

    if (!transcript || transcript.length === 0) {
        return (
            <div className='border-b border-gray-800 bg-black/30 backdrop-blur-xl rounded-lg p-6 border text-center'>
                <p className='text-muted-foreground'>
                    {t('noTranscript')}
                </p>
            </div>
        )
    }

    return (
        <div className="border-b border-gray-800 bg-black/30 backdrop-blur-xl rounded-lg p-6 border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
                {t('meetingTranscript')}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {transcript.map((segment, index) => (
                    <div key={index} className="flex gap-3 items-start pb-3 border-b border-border last:border-b-0">
                        <div className="flex-shrink-0">
                            <div className='w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-semibold text-white'>
                                {(segment.speaker || segment.speakerName || 'U').charAt(0)}
                            </div>
                        </div>

                        <div className='flex-1'>
                            <div className='flex items-center justify-between mb-1'>
                                <div className='flex items-center gap-3'>
                                    <span className='font-medium text-foreground'>{segment.speaker || segment.speakerName}</span>
                                    <span className='text-xs text-muted-foreground hidden sm:inline'>{getSpeakerSegmentTime(segment)}</span>
                                </div>
                                <div className='text-xs text-muted-foreground sm:hidden'>
                                    {getSpeakerSegmentTime(segment)}
                                </div>
                            </div>

                            <p className='text-muted-foreground leading-relaxed'>{getSegmentText(segment)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
