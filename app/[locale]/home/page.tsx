'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useMeetings } from './hooks/useMeetings'
import { useAuth } from '@clerk/nextjs'
import AppHeader from '@/components/Header'
import PastMeetings from './components/PastMeetings'
import UpcomingMeetings from './components/UpcomingMeetings'
import FloatingRecordButton from '@/components/floating-record-button'
import { Video, Clock, CalendarDays, Mic, Play, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const t = useTranslations('Dashboard')
  const locale = useLocale()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()

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
    
  } = useMeetings()

  // Studio recordings - meetings with type == 'recording'
  const [studioRecordings, setStudioRecordings] = React.useState<any[]>([])

  React.useEffect(() => {
    if (userId) {
      fetchStudioRecordings()
    }
  }, [userId])

  // Count of meetings in the last 30 days (past meetings only)
  const getLast30DaysCount = () => {
    try {
      const now = new Date()
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return (pastMeetings || []).filter((m: any) => {
        const st = new Date(m.startTime)
        return !isNaN(st.getTime()) && st >= cutoff && st <= now
      }).length
    } catch {
      return 0
    }
  }

  const last30Count = getLast30DaysCount()

  const fetchStudioRecordings = async () => {
    try {
      const response = await fetch('/api/studio-recordings')
      const data = await response.json()
      // API may return either an array or an object { meetings: [...] }
      if (Array.isArray(data)) {
        const filtered = data.filter((r: any) => r?.type === 'recording')
        const sorted = filtered.slice().sort((a: any, b: any) => {
          const ta = new Date(a.startTime || a.createdAt || 0).getTime()
          const tb = new Date(b.startTime || b.createdAt || 0).getTime()
          return tb - ta
        })
        setStudioRecordings(sorted)
      } else if (data && Array.isArray(data.meetings)) {
        const filtered = data.meetings.filter((r: any) => r?.type === 'recording')
        const sorted = filtered.slice().sort((a: any, b: any) => {
          const ta = new Date(a.startTime || a.createdAt || 0).getTime()
          const tb = new Date(b.startTime || b.createdAt || 0).getTime()
          return tb - ta
        })
        setStudioRecordings(sorted)
      } else {
        console.warn('Unexpected studio recordings response shape', data)
        setStudioRecordings([])
      }
    } catch (error) {
      console.log('No studio recordings API yet')
    }
  }

  const metrics = [
    {
      title: t('Metrics.TotalMeetings'),
      value: (pastMeetings?.length || 0) + (upcomingEvents?.length || 0),
      icon: <Video className="h-6 w-6 text-white/90" />,
      color: 'from-violet-600 to-purple-600',
      trend: t('Metrics.InLast30Days', { count: last30Count })
    },
    {
      title: t('Metrics.UpcomingMeetings'),
      value: upcomingEvents?.length || 0,
      icon: <CalendarDays className="h-6 w-6 text-white/90" />,
      color: 'from-violet-600 to-purple-600',
      trend: 'Next 7 days'
    },
    {
      title: t('Metrics.PastMeetings'),
      value: pastMeetings?.length || 0,
      icon: <Clock className="h-6 w-6 text-white/90" />,
      color: 'from-violet-600 to-purple-600',
      trend: 'All time'
    },
    {
      title: t('Metrics.Recordings'),
      value: studioRecordings?.length || 0,
      icon: <Play className="h-6 w-6 text-white/90" />,
      color: 'from-pink-600 to-rose-600',
      trend: 'Studio'
    }
  ]

  const handleMeetingClick = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`)
  }

  if (!userId) {
    return (
      <div className="bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] flex items-center justify-center h-screen text-white">
        {t('Loading')}
      </div>
    )
  }

  return (
    <>
      <AppHeader />
      <FloatingRecordButton />

      <div className="min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] text-white">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes subtle-pulse {
            0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.1); }
            50% { box-shadow: 0 0 30px rgba(168, 85, 247, 0.2); }
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
            opacity: 0;
          }
          .card-glow {
            animation: subtle-pulse 3s ease-in-out infinite;
          }
        `}</style>

        {/* Hero Section */}
        <div className="p-6 sm:p-8 border-b border-violet-500/20 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
                {t('Hero.Welcome')}
              </h1>
              <div className="p-2 bg-gradient-to-br from-violet-600/30 to-purple-600/30 rounded-lg border border-violet-500/30 cursor-pointer hover:scale-110 transition-transform">
                <Mic className="w-8 h-8 text-violet-300" />
              </div>
            </div>
            <p className="text-gray-400 text-base sm:text-lg">
              {pastMeetings?.length || 0} {t('Hero.ActivitySummary').split('•')[0].trim()} • {upcomingEvents?.length || 0} {t('Hero.ActivitySummary').split('•')[1].trim()}
            </p>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="p-5 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="card-glow relative overflow-hidden rounded-2xl p-6 border border-violet-500/30 bg-gradient-to-br from-violet-900/30 to-purple-900/30 backdrop-blur-md transition-all duration-300 hover:border-violet-500/60 hover:scale-105 group"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg border border-violet-500/30 group-hover:border-violet-500/60 transition-colors cursor-pointer">
                        {metric.icon}
                      </div>
                      <div>
                        <p className="text-sm text-violet-300/80">{metric.title}</p>
                        <p className="text-2xl sm:text-3xl font-bold">{metric.value}</p>
                        <p className="text-xs text-violet-300/50 mt-1">{metric.trend}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-lg font-semibold mb-4 text-violet-200">{t('QuickActions.Title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  onClick={() => router.push('/recording')}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl py-6 font-semibold transition-all hover:scale-105 cursor-pointer"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  {t('QuickActions.StartRecording')}
                </Button>
                <Button 
                  onClick={() => router.push('/integrations')}
                  className="bg-gradient-to-r from-violet-600/40 to-purple-600/40 border border-violet-500/40 hover:border-violet-500/70 text-white rounded-xl py-6 font-semibold transition-all hover:scale-105 cursor-pointer"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {t('QuickActions.ExploreIntegrations')}
                </Button>
                <Button 
                  onClick={() => router.push('/recording?conference=true')}
                  className="bg-gradient-to-r from-violet-600/40 to-purple-600/40 border border-violet-500/40 hover:border-violet-500/70 text-white rounded-xl py-6 font-semibold transition-all hover:scale-105 cursor-pointer"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {t('QuickActions.RecordConference')}
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Meetings */}
              <div className="lg:col-span-2 space-y-8">
                {/* Calendar Meetings */}
                <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-lg border border-violet-500/30">
                      <CalendarDays className="w-5 h-5 text-violet-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      {t('Sections.UpcomingMeetings')}
                      <span className="text-sm text-violet-300/80">({upcomingEvents?.length || 0})</span>
                    </h2>
                  </div>
                  <UpcomingMeetings
                    upcomingEvents={upcomingEvents}
                    connected={connected}
                    error={error}
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

                {/* Past Calendar Meetings */}
                <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                      <Clock className="w-5 h-5 text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {t('Sections.CalendarMeetings')}
                    </h2>
                  </div>
                  <PastMeetings
                    pastMeetings={pastMeetings}
                    pastLoading={pastLoading}
                    onMeetingClick={handleMeetingClick}
                    getAttendeeList={getAttendeeList}
                    getInitials={getInitials}
                  />
                </div>
              </div>

              {/* Right Column - Studio Recordings */}
              <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <div className="sticky top-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg border border-pink-500/30">
                      <Mic className="w-5 h-5 text-pink-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {t('Sections.StudioRecordings')}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-900/20 to-rose-900/20 backdrop-blur-md overflow-hidden">
                    {!studioRecordings || studioRecordings.length === 0 ? (
                      <div className="p-8 text-center">
                        <Mic className="h-12 w-12 mx-auto text-pink-300/50 mb-4" />
                        <h4 className="text-lg font-semibold text-pink-200 mb-2">
                          {t('StudioRecordings.NoRecordings')}
                        </h4>
                        <p className="text-sm text-pink-300/60 mb-6">
                          {t('StudioRecordings.NoRecordingsDesc')}
                        </p>
                        <Button 
                          onClick={() => router.push('/recording')}
                          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-lg font-semibold cursor-pointer"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          {t('StudioRecordings.StartRecording')}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                                        {studioRecordings.map((recording: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => router.push(`/${locale}/recording/${recording.id}`)}
                            className="p-4 rounded-lg bg-pink-900/30 border border-pink-500/20 hover:border-pink-500/40 transition-all hover:scale-105 cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-pink-500/20 rounded-lg mt-1">
                                <Play className="w-4 h-4 text-pink-300" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-pink-200 group-hover:text-white transition-colors">
                                  {recording.title || 'Recording ' + (idx + 1)}
                                </h4>
                                                <p className="text-xs text-pink-300/60 mt-1">
                                  {recording.startTime || recording.createdAt
                                    ? new Date(recording.startTime || recording.createdAt).toLocaleString(locale as any, { dateStyle: 'medium', timeStyle: 'short' })
                                    : ''}
                                </p>
                                                {recording.shared && recording.sharedBy ? (
                                                  <div className="mt-2">
                                                    <span className="text-xs bg-pink-500/20 text-pink-200 px-2 py-1 rounded-full">{t('SharedByLabel', { name: recording.sharedBy })}</span>
                                                  </div>
                                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
