'use client'

import { useUser } from '@clerk/nextjs'
import React from 'react'

interface MeetingData {
    title: string
    date: string
    time: string
    userName: string
}

interface MeetingInfoProps {
    meetingData: MeetingData
}

function MeetingInfo({ meetingData }: MeetingInfoProps) {
    const { user } = useUser()
    return (
        <div className='mb-8'>
            <div className='bg-black/30 border border-border rounded-lg p-5'>
                <h2 className='text-3xl sm:text-4xl font-extrabold text-foreground mb-2'>
                    {meetingData.title}
                </h2>

                <div className='text-sm text-muted-foreground mt-2 flex items-center gap-4 flex-wrap'>
                    <span className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border flex items-center justify-center bg-primary/5'>
                            {user?.imageUrl ? (
                                <img
                                    src={user.imageUrl}
                                    alt={`${meetingData.userName}'s profile`}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                                    <span className='text-sm text-primary font-semibold'>
                                        {meetingData.userName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className='flex flex-col'>
                            <span className='text-sm font-medium text-foreground'>{meetingData.userName}</span>
                            <span className='text-xs text-muted-foreground'>Organizer</span>
                        </div>
                    </span>

                    <span className='flex items-center gap-2 px-3 py-1 rounded bg-[#0f0420]/50'>
                        <span className='text-sm'>📅</span>
                        <span className='text-sm text-foreground'>{meetingData.date}</span>
                    </span>

                    <span className='flex items-center gap-2 px-3 py-1 rounded bg-[#0f0420]/50'>
                        <span className='text-sm'>🕐</span>
                        <span className='text-sm text-foreground'>{meetingData.time}</span>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default MeetingInfo
