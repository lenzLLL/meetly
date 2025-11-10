"use client"

import React, { useEffect } from 'react'
import { useMeetings } from './hooks/useMeetings'
import { useRouter } from 'next/navigation'
import PastMeetings from './components/PastMeetings'
import UpcomingMeetings from './components/UpcomingMeetings'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/hooks/use-user'
import { Users, Clock, Video, CalendarDays } from 'lucide-react'
import AppHeader from '@/components/Header'
export default function Home() {
  const {
    userId,
    upcomingEvents,
    pastMeetings,
    loading,
    pastLoading,
    connected,
    error,
    g,
    z,
    o,
    botToggles,
    initialLoading,
    fetchUpcomingEvents,
    fetchPastMeetings,
    toggleBot,
    directOAuth,
    getAttendeeList,
    getInitials,
    subaccounts
  } = useMeetings()

  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const { saveUser } = useUser()

  // useEffect(() => {
  //   if (isSignedIn && isLoaded) {
  //     saveUser()
  //   }
  // }, [isSignedIn, isLoaded])
  const metrics = [
    {
      title: "Total Meetings",
      value: pastMeetings?.length + upcomingEvents?.length || 0,
      icon: <Video className="h-6 w-6 text-white/90" />,
    },
    {
      title: "Upcoming Meetings",
      value: upcomingEvents?.length || 0,
      icon: <CalendarDays className="h-6 w-6 text-white/90" />,
    },
    {
      title: "Past Meetings",
      value: pastMeetings?.length || 0,
      icon: <Clock className="h-6 w-6 text-white/90" />,
    },
    {
      title: "Subaccounts",
      value: subaccounts?.length || 0,
      icon: <Users className="h-6 w-6 text-white/90" />,
    },
    // {
    //   title: "Active Participants",
    //   value: Math.floor(Math.random() * 20) + 5, 
    //   icon: <Users className="h-6 w-6 text-white/90" />,
    // },
  ]
  const handleMeetingClick = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`)
  }

  if (!userId) {
    return (
      <div className="bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    )
  }

  return (
    <>
    <AppHeader/>     {/* === Metrics Section === */}
    <div className="min-h-screen mt-5 sm:mt-0 bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white">
      <div className="w-full p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 sm:gap-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex-1 bg-[#1a0b2e]/70 border border-white/10 backdrop-blur-md rounded-xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                {metric.icon}
              </div>
              <div>
                <p className="text-sm text-white/70">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* ---- Past Meetings ---- */}
        <div className="flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Past Meetings</h2>
          </div>
          <PastMeetings
            pastMeetings={pastMeetings}
            pastLoading={pastLoading}
            onMeetingClick={handleMeetingClick}
            getAttendeeList={getAttendeeList}
            getInitials={getInitials}
          />
        </div>

        {/* Divider (hidden on small screens) */}
        <div className="hidden lg:block w-px bg-border"></div>

        {/* ---- Upcoming Meetings ---- */}
        <div className="w-full lg:w-96">
          <div className="lg:sticky lg:top-6">
            <UpcomingMeetings
              upcomingEvents={upcomingEvents}
              connected={connected}
              error={error}
              subaccounts = {subaccounts}
              z={z}
              g={g}
              o={o}
              loading={loading}
              initialLoading={initialLoading}
              botToggles={botToggles}
              onRefresh={fetchUpcomingEvents}
              onToggleBot={toggleBot}
              onConnectCalendar={directOAuth}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
