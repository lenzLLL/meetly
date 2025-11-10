import React from 'react'
import { PastMeeting } from '../hooks/useMeetings'
import { Clock, ExternalLink, Video } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import AttendeeAvatars from './AttendeeAvatar'
import { cn } from '@/lib/utils'

interface PastMeetingsProps {
    pastMeetings: PastMeeting[]
    pastLoading: boolean
    onMeetingClick: (id: string) => void
    getAttendeeList: (attendees: any) => string[]
    getInitials: (name: string) => string
}

function PastMeetings({
    pastMeetings,
    pastLoading,
    onMeetingClick,
    getAttendeeList,
    getInitials
}: PastMeetingsProps) {

    if (pastLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="bg-[#130a22]/70 rounded-xl p-5 border border-white/5 animate-pulse"
                    >
                        <div className="h-5 bg-white/10 rounded w-48 mb-4"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3 mb-3"></div>
                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
        )
    }

    if (pastMeetings.length === 0) {
        return (
            <div className="bg-[#130a22]/70 border border-white/10 rounded-xl p-10 text-center backdrop-blur">
                <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                    No past meetings
                </h3>
                <p className="text-muted-foreground">Your completed meetings will appear here</p>
            </div>
        )
    }

    const typeStyles = {
        z: "bg-blue-500/20 text-blue-300 border-blue-500/30", // Zoom
        g: "bg-green-500/20 text-green-300 border-green-500/30", // Google
        default: "bg-white/10 text-white border-white/20"
    }

    return (
        <div className="space-y-4">
            {pastMeetings.map(meeting => {
                const type = meeting.type?.toLowerCase() === "z" ? "z" :
                             meeting.type?.toLowerCase() === "g" ? "g" :
                             "default"

                return (
                    <div
                        key={meeting.id}
                        className="bg-[#130a22]/70 rounded-xl p-5 border border-white/10 hover:border-white/20 hover:shadow-lg transition cursor-pointer backdrop-blur-md"
                        onClick={() => onMeetingClick(meeting.id)}
                    >
                        {/* Header */}

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3 flex-1">
                                <span
                                    className={cn(
                                        "px-2 py-0.5 text-[10px] rounded-full border font-medium",
                                        typeStyles[type as "z" | "g" | "default"]
                                    )}
                                >
                                    {type === "z" ? "Zoom" : type === "g" ? "Google Meet" : "Meeting"}
                                </span>

                                <h3 className="font-semibold text-xl text-foreground">
                                    {meeting.title}
                                </h3>

                                {meeting.attendees && (
                                    <AttendeeAvatars
                                        attendees={meeting.attendees}
                                        getAttendeeList={getAttendeeList}
                                        getInitials={getInitials}
                                    />
                                )}
                            </div>

                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                                Completed
                            </span>
                        </div>

                        {/* Description */}
                        {meeting.description && (
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                {meeting.description}
                            </p>
                        )}

                        {/* Time */}
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mb-4">
                            <Clock className="h-4 w-4" />
                            <span>
                                {format(new Date(meeting.startTime), 'PPp')} –{' '}
                                {format(new Date(meeting.endTime), 'pp')}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button
                                className="flex items-center gap-1 px-3 py-1 text-xs rounded-md h-7 bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => onMeetingClick(meeting.id)}
                            >
                                <ExternalLink className="h-3 w-3" />
                                View details
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default PastMeetings
