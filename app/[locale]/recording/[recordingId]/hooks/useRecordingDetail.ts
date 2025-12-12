import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams } from 'next/navigation'

export function useRecordingDetail() {
  const { userId } = useAuth()
  const params = useParams()
  const recordingId = params?.recordingId as string

  const [recordingData, setRecordingData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!recordingId) {
      setError('No recording ID provided')
      setLoading(false)
      return
    }

    const fetchRecording = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching recording:', recordingId)
        
        const response = await fetch(`/api/studio-recordings/${recordingId}`)
        console.log('Response status:', response.status)
        
        const data = await response.json()
        console.log('Response data:', data)
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`)
        }
        
        setRecordingData(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching recording:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setRecordingData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRecording()
  }, [recordingId])

  return {
    recordingId,
    recordingData,
    loading,
    error,
  }
}
