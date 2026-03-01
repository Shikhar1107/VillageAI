'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Square, Loader2, Volume2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AudioRecorder } from '@/lib/audio-utils'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [error, setError] = useState<string>('')

  const recorderRef = useRef(new AudioRecorder())
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleStartRecording = async () => {
    setError('')
    setTranscript('')
    setResponse('')
    setAudioUrl('')

    const hasPermission = await recorderRef.current.requestPermission()
    if (!hasPermission) {
      setError('Microphone permission is required. Please allow microphone access.')
      toast({
        title: "Permission Required",
        description: "Please allow microphone access to record your query.",
        variant: "destructive",
      })
      return
    }

    try {
      await recorderRef.current.startRecording()
      setIsRecording(true)
    } catch (error) {
      setError('Failed to start recording. Please try again.')
      console.error('Recording error:', error)
    }
  }

  const handleStopRecording = async () => {
    if (!isRecording) return

    setIsRecording(false)
    setIsProcessing(true)

    try {
      const audioBlob = await recorderRef.current.stopRecording()

      // Convert to WAV format if needed
      const audioFile = new File([audioBlob], 'query.webm', {
        type: audioBlob.type || 'audio/webm',
      })

      // Process with backend
      const result = await apiClient.processVoice(audioFile)

      setTranscript(result.transcript)
      setResponse(result.response)
      setAudioUrl(result.audio_url)

      // Auto-play response if available
      if (result.audio_url && audioRef.current) {
        audioRef.current.src = result.audio_url
        await audioRef.current.play()
      }

      toast({
        title: "Query Processed",
        description: "Your agricultural query has been processed successfully.",
      })
    } catch (error) {
      console.error('Error processing voice:', error)
      setError('Failed to process your query. Please try again.')
      toast({
        title: "Processing Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
              w-24 h-24 rounded-full flex items-center justify-center
              transition-all duration-200 shadow-lg
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 recording-pulse'
                : 'bg-green-600 hover:bg-green-700'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onMouseDown={!isProcessing ? handleStartRecording : undefined}
            onMouseUp={isRecording ? handleStopRecording : undefined}
            onTouchStart={!isProcessing ? handleStartRecording : undefined}
            onTouchEnd={isRecording ? handleStopRecording : undefined}
            onMouseLeave={isRecording ? handleStopRecording : undefined}
            disabled={isProcessing}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
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
            <div className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping" />
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          {isRecording ? (
            <p className="text-lg font-semibold text-red-600 animate-pulse">
              Recording... Release to stop
            </p>
          ) : isProcessing ? (
            <p className="text-lg font-semibold text-blue-600">
              Processing your query...
            </p>
          ) : (
            <p className="text-lg text-gray-600">
              Press and hold to record your agricultural query
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
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Queries (Hindi):</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>• "मेरे गेहूं की पत्तियों पर पीले धब्बे हैं"</p>
          <p>• "My wheat has yellow spots on leaves"</p>
          <p>• "गेहूं में पीली रतुआ का इलाज बताइए"</p>
        </div>
      </div>
    </div>
  )
}