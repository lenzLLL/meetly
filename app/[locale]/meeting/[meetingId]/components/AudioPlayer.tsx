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
        <div
            className={`fixed bottom-0 bg-[#1a0b2e]/70 border-t border-border p-5 ${!isOwner
                ? 'left-0 right-0'
                : ''
                }`}
            style={isOwner ? { left: 'var(--sidebar-width, 16rem)', right: '24rem' } : {}}
        >
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

            <div className={!isOwner ? 'max-w-4xl mx-auto' : ''}>
                <div className='flex items-center gap-4'>
                    <div className='flex items-center gap-3'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSkipBack}
                            className='hover:bg-muted rounded-lg transition-colors cursor-pointer'
                        >
                            <SkipBack className='h-4 w-4 text-foreground' />
                        </Button>

                        <Button
                            variant='default'
                            size='icon'
                            onClick={handlePlayPause}
                            className='bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer'
                        >
                            {isPlaying ? <Pause className='h-5 w-5' /> : <Play className='h-5 w-5' />}

                        </Button>

                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSkipForward}
                            className='hover:bg-muted rounded-lg transition-colors cursor-pointer'
                        >
                            <SkipForward className='h-4 w-4' />
                        </Button>

                    </div>

                    <div className='flex-1 flex items-center gap-3'>
                        <span className='text-sm text-muted-foreground min-w-[40px]'>
                            {formatTime(currentTime)}
                        </span>

                        <div
                            className='flex-1 bg-muted rounded-full h-2 cursor-pointer'
                            onClick={handleProgressClick}
                        >
                            <div
                                className='bg-primary h-2 rounded-full transition-all duration-300'
                                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                        </div>

                        <span className='text-sm text-muted-foreground min-w-[40px]'>
                            {formatTime(duration)}
                        </span>


                    </div>

                    <div className='flex items-center gap-2'>
                        <Volume2 className='h-4 w-4 text-muted-foreground' />
                        <div
                            className='w-20 bg-muted rounded-full h-2 cursor-pointer'
                            onClick={handleVolumeChange}
                        >
                            <div
                                className='bg-primary h-2 rounded-full'
                                style={{ width: `${volume * 100}%` }}
                            />

                        </div>

                    </div>

                    <div className='text-sm text-muted-foreground'>
                        {t('recording')}
                    </div>

                    <Button
                        variant='outline'
                        size='sm'
                        onClick={handleDownloadAudio}
                        className='flex gap-2 cursor-pointer'
                        title={t('downloadAudio')}
                    >
                        <Download className='h-4 w-4' />
                        <span className='hidden sm:inline'>{t('downloadAudio')}</span>
                    </Button>

                </div>

            </div>




        </div>
    )
}

export default CustomAudioPlayer
