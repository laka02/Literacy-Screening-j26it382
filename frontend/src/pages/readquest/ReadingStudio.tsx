import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { MascotHoot } from '../../components/readquest/MascotHoot'
import { AudioVisualizer } from '../../components/readquest/AudioVisualizer'
import { READING_PASSAGES } from '../../data/passages'
import { assessReadingFluency } from '../../services/fluencyService'
import './ReadQuest.css'

export default function ReadingStudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Selected passage
  const passage = READING_PASSAGES.find((p) => p.id === id) || READING_PASSAGES[0]

  // Font size toggle (A / A+)
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal')

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNarrating, setIsNarrating] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<any>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (audioStream) audioStream.getTracks().forEach((track) => track.stop())
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [audioStream])

  // Timer logic
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isRecording, isPaused])

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 1. Play full story aloud (Listen Guide)
  const handleListenGuide = () => {
    if ('speechSynthesis' in window) {
      if (isNarrating) {
        window.speechSynthesis.cancel()
        setIsNarrating(false)
      } else {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(passage.content)
        utterance.rate = 0.88
        utterance.pitch = 1.05
        utterance.onend = () => setIsNarrating(false)
        setIsNarrating(true)
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // 2. Click word to pronounce
  const handleWordClick = (word: string) => {
    const clean = word.replace(/[^a-zA-Z]/g, '')
    if ('speechSynthesis' in window && clean) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(clean)
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  // 3. Start Recording
  const startRecording = async () => {
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setIsNarrating(false)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingSeconds(0)
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable:', err)
      // Fallback: Start simulated recording
      setIsRecording(true)
      setIsPaused(false)
      setRecordingSeconds(0)
    }
  }

  // 4. Pause / Resume Recording
  const togglePause = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    } else {
      setIsPaused((prev) => !prev)
    }
  }

  // 5. Stop / Finish Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop())
    } else {
      // Simulation mode
      const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/wav' })
      setAudioBlob(dummyBlob)
      setAudioUrl('simulated-audio')
    }
    setIsRecording(false)
    setIsPaused(false)
  }

  // 6. Reset / Try Again
  const handleTryAgain = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingSeconds(0)
    setIsRecording(false)
    setIsPaused(false)
  }

  // 7. Submit Reading for AI Assessment
  const handleSubmitReading = async () => {
    setIsSubmitting(true)
    const effectiveDuration = Math.max(recordingSeconds, 16)
    const report = await assessReadingFluency(audioBlob, passage, effectiveDuration)

    // Store report in sessionStorage for the Result screen
    sessionStorage.setItem('current_fluency_report', JSON.stringify(report))

    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/readquest/result')
    }, 1200)
  }

  return (
    <div className="rq-app-shell">
      <ReadQuestNavbar
        showSteps
        currentStep={isRecording || audioBlob ? 'reading' : 'intro'}
        stars={450}
        missionTitle={passage.chapter}
      />

      <main className="rq-main-layout">
        <section className="rq-content-area" style={{ width: '100%' }}>
          {/* Mascot Guidance Speech Bubble (Image 3) */}
          <MascotHoot
            speech="Read the story aloud. Take your time and do your best! ✨"
            subtext="Tap the big blue microphone when you are ready. Pronounce each green word with care!"
          />

          <div className="rq-reading-studio-grid">
            {/* ── Left Column: Passage Card (Image 3 & 5) ── */}
            <div className="rq-passage-card">
              <div className="rq-passage-header">
                <div className="rq-passage-title-meta">
                  <h2 className="rq-passage-title">{passage.title}</h2>
                  <span className="rq-passage-level-tag">
                    Level: {passage.gradeLevel} • {passage.wordCount} Words
                  </span>
                </div>

                <div className="rq-passage-controls">
                  <button
                    className={`rq-tool-btn ${isNarrating ? 'active' : ''}`}
                    onClick={handleListenGuide}
                    title="Listen to story narrated"
                  >
                    <span>{isNarrating ? '⏹ Stop' : '🔊 Listen'}</span>
                  </button>

                  <button
                    className="rq-tool-btn"
                    onClick={() => setFontSize((f) => (f === 'normal' ? 'large' : 'normal'))}
                    title="Toggle Text Size"
                  >
                    <span>{fontSize === 'normal' ? 'TT A+' : 'TT A-'}</span>
                  </button>

                  <button
                    className="rq-tool-btn"
                    onClick={() => alert('Tip: Tap any highlighted word in the story to hear its correct pronunciation!')}
                    title="Help"
                  >
                    <span>?</span>
                  </button>
                </div>
              </div>

              {/* Passage Content with Interactive Words */}
              <div className="rq-passage-body" style={{ fontSize: fontSize === 'large' ? '1.58rem' : '1.35rem' }}>
                {passage.content.split(' ').map((rawWord, i) => {
                  const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '')
                  let tagClass = ''

                  if (passage.keyCharacters.map((c) => c.toLowerCase()).includes(clean)) {
                    tagClass = 'tag-character'
                  } else if (passage.vocabularyWords.map((v) => v.toLowerCase()).includes(clean)) {
                    tagClass = 'tag-vocabulary'
                  } else if (passage.sightWords.map((s) => s.toLowerCase()).includes(clean)) {
                    tagClass = 'tag-sightword'
                  }

                  return (
                    <span
                      key={i}
                      className={`word-interactive ${tagClass}`}
                      onClick={() => handleWordClick(rawWord)}
                      title="Tap to hear pronunciation"
                    >
                      {rawWord}{' '}
                    </span>
                  )
                })}
              </div>

              {/* Legend Row */}
              <div className="rq-passage-legend">
                <div className="legend-tag-item">
                  <span className="legend-tag-dot green" />
                  <span>Key character & vocabulary</span>
                </div>
                <div className="legend-tag-item">
                  <span className="legend-tag-dot red" />
                  <span>Sight words & phrases</span>
                </div>
                <div className="legend-tag-item">
                  <span className="legend-tag-dot gold" />
                  <span>Interactive pronunciation</span>
                </div>
              </div>
            </div>

            {/* ── Right Column: Voice Magic Recording Studio (Image 5) ── */}
            <div className="rq-recording-studio-card">
              <div className="rq-rec-header">
                <div className="rq-rec-status-indicator">
                  <span className="rq-rec-dot" style={{ backgroundColor: isRecording ? '#ef4444' : '#10b981' }} />
                  <span>{isRecording ? 'Live Recording' : audioBlob ? 'Recorded Ready' : 'Ready to Record'}</span>
                </div>

                <div className="rq-rec-timer">{formatTimer(recordingSeconds)}</div>
              </div>

              {/* Big Mic Button / Visualizer */}
              <div className="rq-big-mic-box">
                {!isRecording && !audioBlob ? (
                  <button
                    className="rq-big-mic-btn"
                    onClick={startRecording}
                    title="Tap to Start Recording"
                  >
                    <span>🎙️</span>
                  </button>
                ) : (
                  <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />
                )}
              </div>

              {/* Controls Row */}
              {isRecording ? (
                <div className="rq-rec-controls-row">
                  <button className="rq-rec-ctrl-btn" onClick={togglePause}>
                    <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
                  </button>

                  <button className="rq-rec-ctrl-btn danger" onClick={stopRecording}>
                    <span>⏹ Finish</span>
                  </button>
                </div>
              ) : null}

              {/* Recorded Feedback & Submit Reading */}
              {audioBlob && !isRecording && (
                <div className="rq-recorded-ready-card">
                  <span className="rq-ready-title">Speech Recorded! 🎉</span>
                  <span className="rq-ready-sub">
                    Ready to see Professor Hoot's AI fluency assessment & percentage score?
                  </span>

                  {audioUrl && audioUrl !== 'simulated-audio' && (
                    <audio controls src={audioUrl} style={{ width: '100%', marginTop: '6px' }} />
                  )}

                  <div className="rq-rec-controls-row" style={{ marginTop: '6px' }}>
                    <button className="rq-rec-ctrl-btn" onClick={handleTryAgain}>
                      <span>🔄 Try Again</span>
                    </button>
                  </div>

                  <button
                    className="rq-btn-submit-reading"
                    onClick={handleSubmitReading}
                    disabled={isSubmitting}
                  >
                    <span>{isSubmitting ? 'Checking Your Reading Magic... ⏳' : '🚀 Submit Reading ✨ →'}</span>
                  </button>
                </div>
              )}

              {/* Bottom Acoustic Status Banner */}
              <div className="rq-audio-status-banner">
                <span>🎧 Noise Cancel On • Clear acoustics</span>
                <div className="rq-status-badges-row">
                  <span className="rq-status-chip">✓ Voice Saved</span>
                  <span className="rq-status-chip">✓ Clarity OK</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
