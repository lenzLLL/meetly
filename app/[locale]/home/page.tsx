"use client"
import React, { useEffect } from 'react'
import { useMeetings } from './hooks/useMeetings'
import { useRouter } from 'next/navigation'
import PastMeetings from './components/PastMeetings'
import UpcomingMeetings from './components/UpcomingMeetings'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/hooks/use-user'

export default function Home() {
        const {
        userId,
        upcomingEvents,
        pastMeetings,
        loading,
        pastLoading,
        connected,
        error,
        botToggles,
        initialLoading,
        fetchUpcomingEvents,
        fetchPastMeetings,
        toggleBot,
        directOAuth,
        getAttendeeList,
        getInitials
    } = useMeetings()

      const router = useRouter()
        const {isSignedIn,isLoaded} = useAuth()
        const {saveUser} = useUser()
        const SaveUser = async () =>{
              await SaveUser()
        }
        useEffect(
          ()=>{
              if(isSignedIn){
                    saveUser()
              }    
          },[isSignedIn,isLoaded]
        )
    const handleMeetingClick = (meetingId: string) => {
        router.push(`/meeting/${meetingId}`)
    }
    if (!userId) {
        return (
            <div className='flex items-center justify-center h-screen'>
                Loading...
            </div>
        )
    }
    return (
        <div className='min-h-screen bg-gradient-to-br from-[#0e001a] via-[#1a0033] to-[#100020] '>
            <div className='flex gap-6 p-6'>
                <div className='flex-1'>
                    <div className='mb-6'>
                        <h2 className='text-2xl font-bold text-foreground'>
                            Past Meetings
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
                <div className='w-px bg-border'></div>
                <div className='w-96'>
                    <div className='sticky top-6'>
                        <UpcomingMeetings
                            upcomingEvents={upcomingEvents}
                            connected={connected}
                            error={error}
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
    )
}

