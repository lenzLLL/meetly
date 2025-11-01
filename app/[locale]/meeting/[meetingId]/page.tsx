'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface SmartAudioPlayerProps {
  recordingUrl?: string
  isOwner?: boolean
}

export default function SmartAudioPlayer({ recordingUrl, isOwner = true }: SmartAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)

  // ✅ Recharge l’audio à chaque changement d’URL
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !recordingUrl) return
    audio.pause()
    audio.src = recordingUrl
    audio.load()
    setIsPlaying(false)
    setCurrentTime(0)
  }, [recordingUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) {
      setCurrentTime(audio.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) {
      setDuration(audio.duration)
    }
  }

  const handleVolumeChange = (val: number[]) => {
    const newVolume = val[0]
    setVolume(newVolume)
    if (audioRef.current) audioRef.current.volume = newVolume
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!recordingUrl) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a0b2e]/90 border-t border-border backdrop-blur-lg px-6 py-3 flex items-center justify-between z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-primary/20 hover:bg-primary/30 transition"
        >
          {isPlaying ? <Pause className="text-primary w-5 h-5" /> : <Play className="text-primary w-5 h-5" />}
        </button>
        <div className="flex flex-col">
          <span className="text-sm text-foreground font-medium">{isOwner ? 'Your Recording' : 'Meeting Audio'}</span>
          <div className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      <div className="flex-1 mx-6">
        <Slider
          value={[duration ? (currentTime / duration) * 100 : 0]}
          onValueChange={(val) => {
            const audio = audioRef.current
            if (audio && duration) {
              audio.currentTime = (val[0] / 100) * duration
            }
          }}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2 w-32">
        <Volume2 className="w-4 h-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.01}
          className="cursor-pointer"
        />
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  )
}
