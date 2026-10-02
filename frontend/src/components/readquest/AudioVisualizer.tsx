import React, { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  isRecording: boolean
  audioStream?: MediaStream | null
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording, audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameId = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let audioContext: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let dataArray: any = null

    if (isRecording && audioStream) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = audioContext.createMediaStreamSource(audioStream)
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 64
        source.connect(analyser)
        dataArray = new Uint8Array(analyser.frequencyBinCount)
      } catch (err) {
        console.warn('Could not initialize Web Audio Analyser:', err)
      }
    }

    let phase = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const width = canvas.width
      const height = canvas.height
      const numBars = 24
      const barWidth = Math.floor(width / numBars) - 3

      if (isRecording && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray)
      }

      for (let i = 0; i < numBars; i++) {
        let barHeight = 8

        if (isRecording) {
          if (dataArray && dataArray[i]) {
            barHeight = Math.max(8, (dataArray[i] / 255) * height * 0.9)
          } else {
            // Simulated lively wave
            const wave = Math.sin(phase + i * 0.4) * 0.5 + 0.5
            barHeight = 10 + wave * (height * 0.65)
          }
        }

        const x = i * (barWidth + 3) + 2
        const y = (height - barHeight) / 2

        // Gradient from primary #0058be to secondary #0284c7
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight)
        grad.addColorStop(0, '#0284c7')
        grad.addColorStop(1, '#0058be')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, 4) : ctx.rect(x, y, barWidth, barHeight)
        ctx.fill()
      }

      phase += 0.15
      animationFrameId.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
      if (audioContext && audioContext.state !== 'closed') audioContext.close()
    }
  }, [isRecording, audioStream])

  return (
    <div className="audio-visualizer-container">
      <canvas
        ref={canvasRef}
        width={320}
        height={60}
        className="audio-visualizer-canvas"
      />
      <div className="visualizer-caption">
        <span className={`status-dot ${isRecording ? 'recording' : ''}`} />
        <span>{isRecording ? 'Capturing crisp vocal clarity...' : 'Microphone ready'}</span>
      </div>
    </div>
  )
}
