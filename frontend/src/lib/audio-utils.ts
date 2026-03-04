export class AudioRecorder {
  private mediaRecorder?: MediaRecorder
  private audioChunks: Blob[] = []
  private stream?: MediaStream

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Optimal for speech recognition
        }
      })

      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop())

      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Get audio stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      // Determine the best supported mime type
      const mimeType = this.getSupportedMimeType()

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 64000, // Lower bitrate for voice
      })

      // Reset chunks
      this.audioChunks = []

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // Start recording
      this.mediaRecorder.start(100) // Collect data every 100ms
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Not recording'))
        return
      }

      this.mediaRecorder.onstop = () => {
        // Create blob from chunks
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop())
        }

        // Clean up
        this.stream = undefined
        this.mediaRecorder = undefined
        this.audioChunks = []

        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event}`))
      }

      // Stop recording
      this.mediaRecorder.stop()
    })
  }

  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    // Default fallback
    return 'audio/webm'
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false
  }

  async convertToWav(blob: Blob): Promise<Blob> {
    // For now, return the original blob
    // In production, you might want to use a library like lamejs
    // to convert to WAV format if needed
    return blob
  }
}

export class AudioPlayer {
  private audio?: HTMLAudioElement

  async play(url: string): Promise<void> {
    try {
      // Stop any existing playback
      this.stop()

      // Create new audio element
      this.audio = new Audio(url)
      this.audio.volume = 1.0

      // Play audio
      await this.audio.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
      throw error
    }
  }

  pause(): void {
    this.audio?.pause()
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
      this.audio = undefined
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.min(1, Math.max(0, volume))
    }
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false
  }

  getDuration(): number {
    return this.audio?.duration || 0
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0
  }

  setCurrentTime(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time
    }
  }
}

// Audio utilities
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const getAudioContext = (): AudioContext => {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext is not available')
  }

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  return new AudioContext()
}

// Visualizer for audio waveform (optional)
export class AudioVisualizer {
  private analyser?: AnalyserNode
  private dataArray?: Uint8Array
  private animationId?: number

  async visualize(
    stream: MediaStream,
    canvas: HTMLCanvasElement,
    color = '#2E7D32'
  ): Promise<void> {
    const audioContext = getAudioContext()
    const source = audioContext.createMediaStreamSource(stream)

    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = 256
    const bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)

    source.connect(this.analyser)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      if (!this.analyser || !this.dataArray) return

      this.animationId = requestAnimationFrame(draw)

      this.analyser.getByteFrequencyData(this.dataArray as Uint8Array<ArrayBuffer>)

      ctx.fillStyle = 'rgb(255, 255, 255)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (this.dataArray[i] / 255) * canvas.height

        ctx.fillStyle = color
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = undefined
    }
    this.analyser = undefined
    this.dataArray = undefined
  }
}