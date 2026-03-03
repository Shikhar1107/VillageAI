'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Volume2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { SimpleAudioRecorder } from '@/lib/simple-audio-recorder'
import { apiClient } from '@/lib/api-client'

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState('')
  const { toast } = useToast()
  const recorderRef = useRef(new SimpleAudioRecorder())
  const audioRef = useRef<HTMLAudioElement>(null)

  const startRecording = async () => {
    console.log('Starting recording...')
    setError('')
    setTranscript('')
    setResponse('')
    setAudioUrl('')

    try {
      const hasPermission = await recorderRef.current.requestPermission()
      console.log('Permission check result:', hasPermission)

      if (!hasPermission) {
        setError('Microphone permission is required. Please allow microphone access.')
        toast({
          title: "Permission Required",
          description: "Please allow microphone access to record your query.",
          variant: "destructive",
        })
        return false
      }

      console.log('Starting AudioRecorder...')
      await recorderRef.current.startRecording()
      console.log('AudioRecorder started, updating state')
      setIsRecording(true)
      console.log('Recording started successfully, isRecording set to true')
      toast({
        title: "Recording Started",
        description: "Click the button again to stop recording",
      })
      return true
    } catch (error: any) {
      setError(`Failed to start recording: ${error.message}`)
      console.error('Recording error details:', error)
      toast({
        title: "Recording Failed",
        description: `Could not start recording: ${error.message}`,
        variant: "destructive",
      })
      return false
    }
  }

  const stopRecording = async () => {
    console.log('Stopping recording...')
    setIsRecording(false)
    setIsProcessing(true)

    try {
      const audioBlob = await recorderRef.current.stopRecording()
      console.log('Recording stopped, blob size:', audioBlob.size)

      // Convert to file
      const audioFile = new File([audioBlob], 'query.webm', {
        type: audioBlob.type || 'audio/webm',
      })

      // Process with backend
      console.log('Sending to backend...')
      const result = await apiClient.processVoice(audioFile)
      console.log('Backend response:', result)

      setTranscript(result.transcript)
      setResponse(result.response)
      setAudioUrl(result.audio_url)

      // Show which transcription method was used
      if (result.transcription_method) {
        toast({
          title: "Query Processed",
          description: `Transcribed using ${result.transcription_method === 'whisper' ? 'Whisper (fallback)' : 'AWS Transcribe'}`,
        })
      }

      // Auto-play response if available
      if (result.audio_url && audioRef.current) {
        audioRef.current.src = result.audio_url
        await audioRef.current.play()
      }

    } catch (error: any) {
      console.error('Error processing voice:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to process your query. Please try again.')
      toast({
        title: "Processing Error",
        description: error.response?.data?.detail || error.message || "Failed to process your query. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRecordingToggle = async () => {
    console.log('Record button clicked. isRecording:', isRecording, 'isProcessing:', isProcessing)
    console.log('Recorder state:', recorderRef.current.getState())

    if (isProcessing) {
      console.log('Processing in progress, ignoring click')
      return
    }

    if (isRecording) {
      console.log('State says recording, stopping...')
      // Stop recording
      await stopRecording()
    } else {
      console.log('State says not recording, starting...')
      // Start recording
      const success = await startRecording()
      console.log('Start recording result:', success)
    }

    // Double-check the recorder state after operation
    console.log('After toggle - Recorder state:', recorderRef.current.getState())
    console.log('After toggle - isRecording state:', isRecording)
  }

  const handlePlayResponse = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
    }
  }

  return (
    <div className="space-y-6">
      {/* Recording Section */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <button
            className={`
              relative z-10
              w-24 h-24 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-lg
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-600 hover:bg-green-700'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={handleRecordingToggle}
            disabled={isProcessing}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            type="button"
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isRecording ? (
              <Square className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping pointer-events-none" />
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          {isRecording ? (
            <p className="text-lg font-semibold text-red-600 animate-pulse">
              Recording... Click to stop
            </p>
          ) : isProcessing ? (
            <p className="text-lg font-semibold text-blue-600">
              Processing your query...
            </p>
          ) : (
            <p className="text-lg text-gray-600">
              Click to start recording your agricultural query
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Speak in Hindi, English, or your local language
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transcript Display */}
      {transcript && (
        <Card className="p-4 bg-gray-50">
          <div className="flex items-start gap-2">
            <Mic className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-1">Your Query:</h3>
              <p className="text-gray-900">{transcript}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Response Display */}
      {response && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-2">
            <Volume2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-green-700 mb-1">Agricultural Advice:</h3>
              <p className="text-green-900 whitespace-pre-line">{response}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePlayResponse}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Play Response Audio
            </Button>
          </div>
          <audio
            ref={audioRef}
            controls
            className="w-full"
            src={audioUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Test Queries */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Queries:</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>• "मेरे गेहूं की पत्तियों पर पीले धब्बे हैं" (Hindi)</p>
          <p>• "My wheat has yellow spots on leaves" (English)</p>
          <p>• "गेहूं में पीली रतुआ का इलाज बताइए" (Hindi)</p>
          <p>• "How to treat rust disease in wheat?" (English)</p>
        </div>
      </div>
    </div>
  )
}