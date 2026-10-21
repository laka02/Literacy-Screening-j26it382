import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { AudioVisualizer } from '../../components/readquest/AudioVisualizer'
import { MissionCompletedModal } from '../../components/readquest/MissionCompletedModal'
import { READING_PASSAGES } from '../../data/passages'
import { assessReadingFluency } from '../../services/fluencyService'
import './ReadQuest.css'

export default function ReadingStudio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Selected passage
  const passage = READING_PASSAGES.find((p) => p.id === id) || READING_PASSAGES[0]

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNarrating, setIsNarrating] = useState(false)
  const [showCompletedModal, setShowCompletedModal] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<any>(null)

  // Clean up on unmount - NO auto audio play on mount!
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

  // 1. Play full story aloud only when child explicitly clicks
  const handleListenStory = (rate = 0.9) => {
    if ('speechSynthesis' in window) {
      if (isNarrating) {
        window.speechSynthesis.cancel()
        setIsNarrating(false)
      } else {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(passage.content)
        utterance.rate = rate
        utterance.pitch = 1.05
        utterance.onend = () => setIsNarrating(false)
        setIsNarrating(true)
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  // 2. Click word to pronounce only when child explicitly taps it
  const handleWordClick = (word: string) => {
    const clean = word.replace(/[^a-zA-Z]/g, '')
    if ('speechSynthesis' in window && clean) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(clean)
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  // Helper voice instruction only on explicit click
  const handleHelperVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(
        'Listen carefully to the story, then tap the blue microphone to read aloud!'
      )
      u.rate = 0.9
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
        // Show Completed Popup Modal!
        setShowCompletedModal(true)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)
      setRecordingSeconds(0)
    } catch (err) {
      console.warn('Microphone permission not granted, simulation mode:', err)
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

  // 5. Finish Recording -> triggers onstop and opens Completed Modal
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (audioStream) audioStream.getTracks().forEach((t) => t.stop())
    } else {
      // Simulation mode
      const dummyBlob = new Blob(['sample-audio-data'], { type: 'audio/wav' })
      setAudioBlob(dummyBlob)
      setAudioUrl('simulated-audio')
      setShowCompletedModal(true)
    }
    setIsRecording(false)
    setIsPaused(false)
  }

  // 6. Reset / Try Again
  const handleTryAgain = () => {
    setShowCompletedModal(false)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingSeconds(0)
    setIsRecording(false)
    setIsPaused(false)
  }

  // 7. View Score -> Submit to AI Assessment
  const handleViewScore = async () => {
    setIsSubmitting(true)
    const effectiveDuration = Math.max(recordingSeconds, 20)
    const report = await assessReadingFluency(audioBlob, passage, effectiveDuration)

    sessionStorage.setItem('current_fluency_report', JSON.stringify(report))

    setTimeout(() => {
      setIsSubmitting(false)
      setShowCompletedModal(false)
      navigate('/readquest/result')
    }, 1000)
  }

  return (
    <div className="rq-app-shell jungle-theme">
      {/* Top Navbar */}
      <ReadQuestNavbar
        showSteps
        currentStep={isRecording || audioBlob ? 'reading' : 'intro'}
        stars={450}
        missionTitle={passage.title}
        progressPercent={isRecording ? 75 : audioBlob ? 90 : 50}
      />

      <main className="rq-game-container">
        {/* Floating CAIRE Helper Banner (Matching Reference Image 1) */}
        <div className="caire-helper-pill-banner">
          <div className="helper-left">
            <span className="helper-icon-circle">🤖</span>
            <span className="helper-text">
              <strong>CAIRE Helper:</strong> Listen carefully to the story, then tap the blue microphone to read aloud!
            </span>
          </div>
          <button
            className="helper-audio-btn"
            onClick={handleHelperVoice}
            title="Listen to instruction"
          >
            🔊
          </button>
        </div>

        {/* Main Floating Glass Game Card (Matching Reference Images 1 & 2) */}
        <div className="reading-game-card">
          <div className="reading-game-grid">
            {/* ── Left Column: Character Mascot & Listen Controls ── */}
            <div className="game-left-col">
              <div className="mascot-cutout-box">
                <div className="mascot-speech-bubble-blue">
                  <span>You've got this! ✨</span>
                </div>
                <img
                  src="/lion-mascot.png"
                  alt="Leo Explorer Mascot"
                  className="game-lion-mascot-img"
                />
              </div>

              {/* Mint Green Listen Button */}
              <button
                className={`btn-tactile-mint ${isNarrating ? 'playing' : ''}`}
                onClick={() => handleListenStory(0.9)}
              >
                <span>{isNarrating ? '⏹ Stop Voice' : '🔊 Listen to Story'}</span>
              </button>

              {/* Light Cyan Listen Slower Button */}
              <button
                className="btn-tactile-cyan"
                onClick={() => handleListenStory(0.72)}
              >
                <span>🐢 Listen Slower (0.75x)</span>
              </button>

              {/* Story Clue Card */}
              <div className="sentence-clue-card">
                <span className="clue-tag">💡 Story Clue:</span>
                <p className="clue-text">
                  "{passage.practicePhrases?.[0] || 'Read calmly with steady breath'}."
                </p>
              </div>
            </div>

            {/* ── Right Column: Story Text & Speaking Controls ── */}
            <div className="game-right-col">
              <div className="game-col-header">
                <span className="game-target-tag">
                  📖 Target: <strong>{passage.wordCount} words</strong> • Grade 3-5
                </span>
                <span className="timer-pill">
                  ⏱️ {formatTimer(recordingSeconds)}
                </span>
              </div>

              {/* Large Crisp Story Text Box */}
              <div className="story-display-frame">
                <div className="story-passage-text">
                  {passage.content.split(' ').map((rawWord, i) => {
                    const clean = rawWord.toLowerCase().replace(/[^a-z]/g, '')
                    let isKey = passage.keyCharacters.map((c) => c.toLowerCase()).includes(clean)
                    let isVocab = passage.vocabularyWords.map((v) => v.toLowerCase()).includes(clean)

                    let tagClass = ''
                    if (isKey) tagClass = 'word-highlight-key'
                    else if (isVocab) tagClass = 'word-highlight-vocab'

                    return (
                      <span
                        key={i}
                        className={`game-word-span ${tagClass}`}
                        onClick={() => handleWordClick(rawWord)}
                        title="Tap to hear word!"
                      >
                        {rawWord}{' '}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Audio Visualizer if Live */}
              {isRecording && (
                <div className="game-visualizer-strip">
                  <AudioVisualizer isRecording={isRecording} audioStream={audioStream} />
                </div>
              )}

              {/* Action Buttons Row (Matching Reference Tap & Speak) */}
              <div className="game-action-controls-row">
                {!isRecording ? (
                  <button
                    className="btn-tactile-blue-large"
                    onClick={startRecording}
                  >
                    <span className="mic-icon">🎙️</span>
                    <span>Tap & Speak</span>
                  </button>
                ) : (
                  <div className="recording-active-controls">
                    <button className="btn-rec-pause" onClick={togglePause}>
                      <span>{isPaused ? '▶ Resume' : '⏸ Pause'}</span>
                    </button>

                    <button className="btn-rec-finish" onClick={stopRecording}>
                      <span>⏹ Finish Reading ✨</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Reassurance Hint */}
              <div className="game-bottom-encouragement">
                <span>🌟 Great effort! Take your time — there is no rush at all!</span>
              </div>
            </div>
          </div>

          {/* ── Bottom Bridge Progression (Matching Reference Image 2) ── */}
          <div className="bridge-track-section">
            <span className="bridge-track-title">HELP LEO CROSS THE BRIDGE! 🦁</span>
            <div className="bridge-track-nodes">
              <div className="bridge-node done" title="Step 1: Choose Story">
                <span className="node-icon">✓</span>
                <span className="node-label">Story</span>
              </div>
              <div className="bridge-line done" />
              <div className={`bridge-node ${isRecording || audioBlob ? 'active' : 'current'}`} title="Step 2: Voice Magic">
                <span className="node-icon">2</span>
                <span className="node-label">Read Aloud</span>
              </div>
              <div className="bridge-line" />
              <div className="bridge-node locked" title="Step 3: Win Stars">
                <span className="node-icon">🔒</span>
                <span className="node-label">Stars 🏆</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Learning Pace */}
        <div className="game-bottom-bar">
          <span className="bottom-pace-tag">🌱 Learning at your own pace</span>
        </div>
      </main>

      {/* Completed Popup Modal (Required by user!) */}
      <MissionCompletedModal
        isOpen={showCompletedModal}
        durationSeconds={recordingSeconds || 22}
        wordCount={passage.wordCount}
        onViewScore={handleViewScore}
        onTryAgain={handleTryAgain}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
