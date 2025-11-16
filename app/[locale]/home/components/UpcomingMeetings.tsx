"use client"

import React, { useState } from "react"
import { CalendarEvent } from "../hooks/useMeetings"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Clock, Video, UserPlus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { Subaccount } from "@prisma/client"
import { useTranslations } from "next-intl"

interface UpcomingMeetingsProps {
    upcomingEvents: CalendarEvent[]
    connected: boolean
    error: string
    loading: boolean
    initialLoading: boolean
    botToggles: { [key: string]: boolean }
    onRefresh: () => void
    subaccounts: Subaccount[]
    onToggleBot: (eventId: string) => void
    onConnectCalendar: () => void
    g: boolean
    z: boolean
    o: boolean
}

export default function UpcomingMeetings({
    upcomingEvents,
    connected,
    error,
    loading,
    initialLoading,
    botToggles,
    onRefresh,
    onToggleBot,
    g,
    z,
    o
}: UpcomingMeetingsProps) {

    const t = useTranslations("Dashboard.Upcoming")   // <-- KEY IMPORTANTE

    const [filter, setFilter] = useState<'all' | 'z' | 'g' | 'o'>('all')

    const filteredEvents = upcomingEvents.filter(event => {
        if (filter === 'all') return true
        if (filter === 'z') return event.type?.toLowerCase() === 'z'
        if (filter === 'g') return event.type?.toLowerCase() === 'g'
        if (filter === 'o') return event.type?.toLowerCase() === 'o'
        return true
    })

    return (
        <div>
            {/* Section Title */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">{t("UpcomingMeetings")}</h2>
                <span className="text-sm text-muted-foreground">
                    ({filteredEvents.length})
                </span>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-5">
                {[
                    { key: 'all', label: t("Filters.All") },
                    { key: 'g', label: "Google Meet" },
                    { key: 'z', label: "Zoom" },
                    { key: 'o', label: "Outlook" }
                ].map(f => (
                    <Button
                        key={f.key}
                        variant={filter === f.key ? 'default' : 'outline'}
                        onClick={() => setFilter(f.key as any)}
                        className={cn(
                            "px-3 py-1 text-xs rounded-full cursor-pointer transition",
                            filter === f.key
                                ? "bg-primary text-primary-foreground shadow"
                                : "border-white/10 text-muted-foreground hover:bg-white/10"
                        )}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                </div>
            )}

            {/* Loading Skeleton */}
            {initialLoading ? (
                <div className="bg-[#1a0b2e]/70 rounded-lg p-6 border border-border animate-pulse">
                    <div className="w-12 h-12 mx-auto bg-[#2a1b4a]/70 rounded-full mb-3"></div>
                    <div className="h-4 bg-[#2a1b4a]/70 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-[#2a1b4a]/70 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-8 bg-[#2a1b4a]/70 rounded w-full"></div>
                </div>
            ) : !connected ? (
                /* Not connected */
                <div className="bg-[#1a0b2e]/70 rounded-lg p-6 text-center border border-border backdrop-blur-md">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        📆
                    </div>
                    <h3 className="font-semibold mb-2 text-foreground text-sm">{t("ConnectCalendar")}</h3>
                    <p className="text-muted-foreground mb-4 text-xs">
                        {t("ConnectMessage")}
                    </p>
                    <Link href="/integrations">
                        <Button className="w-full text-sm cursor-pointer">
                            {t("ConnectCalendar")}
                        </Button>
                    </Link>
                </div>
            ) :
            /* Missing provider for filter */
            ((filter === "g" && !g) || (filter === "z" && !z) || (filter === "o" && !o)) ? (
                <div className="bg-[#1a0b2e]/70 rounded-lg p-6 text-center border border-border backdrop-blur-md">
                    <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                        <Image
                            height={30}
                            width={30}
                            alt="provider"
                            src={filter === "g" ? "/gcal.png" : filter === "z" ? "/zoom.png" : "/outlook.png"}
                        />
                    </div>

                    <h3 className="font-semibold mb-2 text-foreground text-sm">
                        {t("ConnectPlatform", {
                            platform:
                                filter === "g" ? "Google Calendar" :
                                filter === "z" ? "Zoom" :
                                "Outlook"
                        })}
                    </h3>

                    <p className="text-muted-foreground mb-4 text-xs">
                        {t("ConnectPlatform", { platform: "" })}
                    </p>

                    <Link href="/integrations">
                        <Button className="w-full text-sm cursor-pointer">
                            {t("ConnectCalendar")}
                        </Button>
                    </Link>
                </div>
            ) :
            /* No events */
            (connected && filteredEvents.length === 0) ? (
                <div className="bg-[#1a0b2e]/70 rounded-lg backdrop-blur-md border border-[#3b186b]/40 p-6 text-center">
                    <h3 className="font-medium mb-2 text-foreground text-sm">{t("NoUpcomingMeetings")}</h3>
                    <p className="text-muted-foreground text-xs">{t("NoUpcomingMeetingsMessage")}</p>
                </div>
            ) :
            (
                /* Events list */
                <div className="space-y-3">
                    <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:opacity-90 hover:scale-[0.98] px-3 py-2 rounded-lg text-sm mb-4 cursor-pointer transition"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        {loading ? t("LoadingEvents") : t("Refresh")}
                    </Button>

                    {filteredEvents.map(event => {
                        const startDate = event.start?.dateTime || event.start?.date || ""

                        return (
                            <div
                                key={event.id}
                                className="bg-[#1a0b2e]/70 rounded-lg p-4 border border-white/10 hover:border-white/20 transition relative backdrop-blur-md"
                            >
                                {/* Bot Toggle */}
                                <div className="absolute top-3 right-3">
                                    <Switch
                                        checked={!!botToggles[event.id]}
                                        onCheckedChange={() => onToggleBot(event.id)}
                                        aria-label="Toggle bot"
                                        className="cursor-pointer"
                                    />
                                </div>

                                {/* Title */}
                                <h4 className="font-medium text-sm text-foreground mb-2 pr-12">
                                    {event.summary || 'No Title'}
                                </h4>

                                {/* Info */}
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {startDate ? format(new Date(startDate), "MMM d, h:mm a") : "—"}
                                    </div>

                                    {event.attendees && (
                                        <div>👥 {event.attendees.length} attendees</div>
                                    )}
                                </div>

                                {/* Actions */}
                                {(event.hangoutLink || event.location) && (
                                    <div className="flex items-center justify-between gap-2 mt-3">
                                        <a
                                            href={event.hangoutLink || event.location}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button className="w-full text-xs h-7 cursor-pointer">
                                                <Video className="w-3 h-3 mr-1" /> {t("JoinMeeting")}
                                            </Button>
                                        </a>

                                        <Button className="flex items-center gap-1 text-xs h-7 cursor-pointer">
                                            <UserPlus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
