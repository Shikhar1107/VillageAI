export class SimpleAudioRecorder {
  private mediaRecorder?: MediaRecorder
  private audioChunks: Blob[] = []
  private stream?: MediaStream
  private recordingState: 'idle' | 'recording' | 'stopping' = 'idle'

  async requestPermission(): Promise<boolean> {
    try {
      console.log('Requesting microphone permission...')
      // Just check if we can get permission, don't keep the stream
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      testStream.getTracks().forEach(track => track.stop())
      console.log('Microphone permission granted')
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }

  async startRecording(): Promise<void> {
    console.log('SimpleAudioRecorder: Starting recording...')

    if (this.recordingState === 'recording') {
      console.log('Already recording, ignoring start request')
      return
    }

    try {
      // Get fresh audio stream
      console.log('Getting audio stream...')
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Create media recorder
      console.log('Creating MediaRecorder...')
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm',
      })

      // Reset chunks
      this.audioChunks = []

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size)
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started')
        this.recordingState = 'recording'
      }

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped')
        this.recordingState = 'idle'
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        this.recordingState = 'idle'
      }

      // Start recording
      this.mediaRecorder.start(100) // Collect data every 100ms
      console.log('Called mediaRecorder.start()')

      // Set state immediately (don't wait for onstart)
      this.recordingState = 'recording'
      console.log('Recording state set to:', this.recordingState)

    } catch (error) {
      console.error('Failed to start recording:', error)
      this.recordingState = 'idle'
      throw error
    }
  }

  async stopRecording(): Promise<Blob> {
    console.log('SimpleAudioRecorder: Stopping recording...')
    console.log('Current state:', this.recordingState)
    console.log('MediaRecorder exists:', !!this.mediaRecorder)
    console.log('MediaRecorder state:', this.mediaRecorder?.state)

    if (!this.mediaRecorder || this.recordingState !== 'recording') {
      console.log('Not recording, cannot stop')
      throw new Error('Not recording')
    }

    this.recordingState = 'stopping'

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No media recorder'))
        return
      }

      const recorder = this.mediaRecorder

      recorder.onstop = () => {
        console.log('MediaRecorder onstop event fired')

        // Create blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        console.log('Created blob, size:', audioBlob.size)

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop()
            console.log('Stopped track:', track.label)
          })
        }

        // Clean up
        this.stream = undefined
        this.mediaRecorder = undefined
        this.audioChunks = []
        this.recordingState = 'idle'

        resolve(audioBlob)
      }

      recorder.onerror = (event) => {
        console.error('MediaRecorder error during stop:', event)
        this.recordingState = 'idle'
        reject(new Error('Recording error'))
      }

      // Stop recording
      console.log('Calling mediaRecorder.stop()')
      recorder.stop()
    })
  }

  isRecording(): boolean {
    const recording = this.recordingState === 'recording'
    console.log('isRecording() called, returning:', recording)
    return recording
  }

  getState(): string {
    return this.recordingState
  }
}