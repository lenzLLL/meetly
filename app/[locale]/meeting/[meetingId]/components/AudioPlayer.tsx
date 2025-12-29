import { Button } from '@/components/ui/button';
import { Pause, Play, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';
import React, { useRef, useState } from 'react'
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { useTranslations } from 'next-intl';

interface CustomAudioPlayerProps {
    recordingUrl?: string
    isOwner?: boolean
}

function CustomAudioPlayer({
    recordingUrl,
    isOwner = true
}: CustomAudioPlayerProps) {
    const t = useTranslations('Meetings');
    const playerRef = useRef<any>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(0.75)

    if (!recordingUrl) {
        return null
    }

    const handlePlayPause = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio) {
            return
        }

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    const handleSkipBack = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio) {
            return
        }
        audio.currentTime = Math.max(0, audio.currentTime - 10)

    }

    const handleSkipForward = () => {
        const audio = playerRef.current?.audio?.current
        if (!audio) {
            return
        }
        audio.currentTime = Math.min(duration, audio.currentTime + 10)

    }

    const handleProgressClick = (e: any) => {
        const audio = playerRef.current?.audio?.current
        if (!audio || !duration) {
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const width = rect.width
        const newTime = (clickX / width) * duration

        audio.currentTime = newTime
    }

    const handleVolumeChange = (e: any) => {
        const audio = playerRef.current?.audio?.current
        if (!audio || !duration) {
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const width = rect.width
        const newVolume = Math.max(0, Math.min(1, clickX / width))

        audio.volume = newVolume
        setVolume(newVolume)
    }

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00'

        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)

        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleDownloadAudio = async () => {
        if (!recordingUrl) return;
        
        try {
            // Try to fetch and download
            const response = await fetch(recordingUrl, { 
                mode: 'cors',
                credentials: 'omit' 
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Conia-recording-${new Date().toISOString().split('T')[0]}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading audio via fetch, using direct link:', error);
            // Fallback: open in new tab
            if (recordingUrl) {
                window.open(recordingUrl, '_blank');
            }
        }
    }


    return (
        <div className={`w-full bg-[#1a0b2e]/70 border-t border-border p-4 sm:p-5 ${isOwner ? 'sm:fixed sm:left-[var(--sidebar-width)] sm:right-24' : 'sm:fixed sm:left-0 sm:right-0'} sm:bottom-0 sm:z-50`}>
            <div style={{ display: 'none' }}>
                <AudioPlayer
                    ref={playerRef}
                    src={recordingUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    onListen={(e) => {
                        const audio = e.target as HTMLAudioElement
                        if (audio && audio.currentTime) {
                            setCurrentTime(audio.currentTime)
                        }
                    }}
                    onLoadedMetaData={(e) => {
                        const audio = e.target as HTMLAudioElement
                        if (audio && audio.duration) {
                            setDuration(audio.duration)
                        }
                    }}
                    volume={volume}
                    hasDefaultKeyBindings={true}
                    autoPlayAfterSrcChange={false}
                    showSkipControls={false}
                    showJumpControls={false}
                    showDownloadProgress={false}
                    showFilledProgress={false}

                />
            </div>

            <div className={!isOwner ? 'max-w-full sm:max-w-4xl mx-auto relative sm:pr-80' : 'w-full relative sm:pr-80'}>
                {/* Desktop / large: single row with controls, progress, and right-side actions */}
                <div className='hidden sm:flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-3 flex-shrink-0'>
                        <Button variant='ghost' size='icon' onClick={handleSkipBack} className='hover:bg-muted rounded-lg transition-colors cursor-pointer flex-shrink-0'>
                            <SkipBack className='h-4 w-4 text-foreground' />
                        </Button>
                        <Button variant='default' size='icon' onClick={handlePlayPause} className='bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer flex-shrink-0'>
                            {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
                        </Button>
                        <Button variant='ghost' size='icon' onClick={handleSkipForward} className='hover:bg-muted rounded-lg transition-colors cursor-pointer flex-shrink-0'>
                            <SkipForward className='h-4 w-4' />
                        </Button>
                    </div>

                    <div className='flex-1 mx-2 min-w-0 pr-56 relative z-0' style={{ maxWidth: '640px' }}>
                        <div className='flex items-center gap-3 min-w-0 overflow-hidden'>
                            <span className='text-sm text-muted-foreground w-12 text-center flex-shrink-0'>{formatTime(currentTime)}</span>
                            <div className='flex-1 bg-muted rounded-full h-2 min-w-0' onClick={handleProgressClick}>
                                <div className='bg-primary h-2 rounded-full transition-all duration-300' style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                            </div>
                            <span className='text-sm text-muted-foreground w-12 text-center flex-shrink-0'>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className='flex items-center gap-3 w-56 flex-none justify-end z-30'>
                        <div className='flex items-center gap-2 flex-none mr-3'>
                            <Volume2 className='h-4 w-4 text-muted-foreground' />
                            <div className='w-20 bg-muted rounded-full h-2' onClick={handleVolumeChange}>
                                <div className='bg-primary h-2 rounded-full' style={{ width: `${volume * 100}%` }} />
                            </div>
                        </div>
                        <div className='text-sm text-muted-foreground hidden md:block flex-none mr-2'>{t('recording')}</div>
                        <div className='flex-none hidden sm:block'>
                            <Button variant='outline' size='sm' onClick={handleDownloadAudio} className='flex gap-2 items-center cursor-pointer text-foreground border border-border px-2 py-1 rounded sm:ml-2 whitespace-nowrap' title={t('downloadAudio')} aria-label={String(t('downloadAudio'))}>
                                <Download className='h-4 w-4 text-foreground' />
                                <span className='inline'>{t('downloadAudio')}</span>
                            </Button>
                        </div>
                        <div className='sm:hidden'>
                            <Button variant='outline' size='sm' onClick={handleDownloadAudio} className='flex gap-2 items-center cursor-pointer text-foreground border border-border px-2 py-1 rounded flex-shrink-0' title={t('downloadAudio')} aria-label={String(t('downloadAudio'))}>
                                <Download className='h-4 w-4 text-foreground' />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mobile: compact controls with full-width progress bar below */}
                <div className='sm:hidden'>
                    <div className='flex items-center gap-3 justify-between'>
                        <div className='flex items-center gap-2'>
                            <Button variant='ghost' size='icon' onClick={handleSkipBack} className='hover:bg-muted rounded-lg transition-colors cursor-pointer flex-shrink-0'>
                                <SkipBack className='h-4 w-4 text-foreground' />
                            </Button>
                            <Button variant='default' size='icon' onClick={handlePlayPause} className='bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer flex-shrink-0'>
                                {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}
                            </Button>
                            <Button variant='ghost' size='icon' onClick={handleSkipForward} className='hover:bg-muted rounded-lg transition-colors cursor-pointer flex-shrink-0'>
                                <SkipForward className='h-4 w-4' />
                            </Button>
                        </div>
                        <Button variant='outline' size='sm' onClick={handleDownloadAudio} className='flex gap-2 items-center cursor-pointer text-foreground border border-border px-2 py-1 rounded flex-shrink-0' title={t('downloadAudio')} aria-label={String(t('downloadAudio'))}>
                            <Download className='h-4 w-4 text-foreground' />
                        </Button>
                    </div>
                    <div className='mt-3'>
                        <div className='flex items-center gap-3'>
                            <span className='text-sm text-muted-foreground w-12 text-center'>{formatTime(currentTime)}</span>
                            <div className='flex-1 bg-muted rounded-full h-2' onClick={handleProgressClick}>
                                <div className='bg-primary h-2 rounded-full transition-all duration-300' style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                            </div>
                            <span className='text-sm text-muted-foreground w-12 text-center'>{formatTime(duration)}</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default CustomAudioPlayer
