/**
 * FreeActivities.tsx — Try Learning Free — Inline Playable Activities
 * Three fully interactive activities directly on the page (no modal needed):
 *   1. Writing  — Canvas letter trace (Leo the Lion)
 *   2. Reading  — Glow word + mic speak game (Ruby the Deer)
 *   3. Listening — TTS story + comprehension Q (Barnaby the Bear)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './FreeActivities.css'

// ─── Reading Words ────────────────────────────────────────────────────────────
const READING_WORDS = ['SUN', 'CAT', 'DOG', 'HAT', 'BIG']

// ─── Listening Story ──────────────────────────────────────────────────────────
const STORY_TEXT =
  'Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat carrots.'
const STORY_QUESTION = 'What does Tommy love to eat?'
const STORY_OPTIONS = ['Carrots', 'Pizza', 'Cake']
const STORY_CORRECT = 'Carrots'

// ─────────────────────────────────────────────────────────────────────────────
// Writing Activity — Canvas Trace
// ─────────────────────────────────────────────────────────────────────────────
function WritingSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const strokeCount = useRef(0)
  const [done, setDone] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.font = `bold ${Math.min(canvas.width, canvas.height) * 0.72}px Quicksand, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = '#fcd34d'
    ctx.lineWidth = 6
    ctx.setLineDash([14, 10])
    ctx.strokeText('A', canvas.width / 2, canvas.height / 2 + 6)
    ctx.setLineDash([])
    // Watermark hint
    ctx.fillStyle = 'rgba(217,119,6,0.12)'
    ctx.fillText('A', canvas.width / 2, canvas.height / 2 + 6)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      drawGuide()
    }
    resize()
    strokeCount.current = 0
    setDone(false)
  }, [drawGuide, resetKey])

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas || done) return
    isDrawing.current = true
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 11
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.setLineDash([])
    ctx.stroke()
    lastPos.current = pos
    strokeCount.current += 1
    if (strokeCount.current > 90 && !done) {
      setDone(true)
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(
          'Amazing! You wrote the letter A! Leo the Lion is so proud of you!'
        )
        utt.rate = 0.9
        utt.pitch = 1.1
        window.speechSynthesis.speak(utt)
      }
    }
  }

  const stopDraw = () => {
    isDrawing.current = false
    lastPos.current = null
  }

  const clearCanvas = () => {
    setResetKey((k) => k + 1)
  }

  return (
    <section className="fa-section fa-writing-section">
      {/* Section header */}
      <div className="fa-section-header">
        <div className="fa-section-icon-wrap" style={{ background: 'linear-gradient(135deg,#fff7ed,#fef3c7)' }}>
          <span className="fa-section-emoji">🦁</span>
        </div>
        <div>
          <span className="fa-skill-chip" style={{ background: '#fef3c7', color: '#d97706' }}>
            ✏️ WRITING
          </span>
          <h2 className="fa-section-title">Trace the Letter A</h2>
          <p className="fa-section-sub">Leo the Lion's Writing Adventure</p>
        </div>
      </div>

      <div className="fa-writing-body">
        {/* Instructions */}
        <div className="fa-writing-instructions">
          <p className="fa-instruction-lead">
            👆 Use your finger or mouse to trace the glowing letter on the canvas!
          </p>
          <div className="fa-steps-row">
            {['Start at the top', 'Stroke down-left', 'Stroke down-right', 'Add the crossbar!'].map(
              (s, i) => (
                <div key={i} className="fa-step-pill" style={{ background: '#fff7ed', borderColor: '#fcd34d' }}>
                  <span className="fa-step-num-circle" style={{ background: '#d97706', color: '#fff' }}>
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="fa-canvas-container">
          <canvas
            ref={canvasRef}
            className={`fa-trace-canvas ${done ? 'canvas-done' : ''}`}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            style={{ touchAction: 'none' }}
          />
          {done && (
            <div className="fa-canvas-celebration">
              <span className="fa-celebrate-emoji">⭐</span>
              <span>You traced the letter A!</span>
              <span className="fa-celebrate-emoji">⭐</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="fa-writing-actions">
          <button className="fa-action-pill danger" onClick={clearCanvas}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              restart_alt
            </span>
            Try Again
          </button>
          {done && (
            <div className="fa-star-badge">
              🏅 Leo says: <strong>Roar! Wonderful!</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reading Activity — Word Card + Mic
// ─────────────────────────────────────────────────────────────────────────────
function ReadingSection() {
  const [wordIdx, setWordIdx] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none')
  const [stars, setStars] = useState<boolean[]>(Array(READING_WORDS.length).fill(false))
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  const currentWord = READING_WORDS[wordIdx]
  const earnedCount = stars.filter(Boolean).length

  const handleMic = () => {
    type SpeechRecogCtor = new () => {
      lang: string
      interimResults: boolean
      maxAlternatives: number
      onstart: (() => void) | null
      onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null
      onend: (() => void) | null
      onerror: (() => void) | null
      start: () => void
      stop: () => void
    }
    const SpeechRecog: SpeechRecogCtor | undefined =
      (window as unknown as { SpeechRecognition?: SpeechRecogCtor; webkitSpeechRecognition?: SpeechRecogCtor })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecogCtor }).webkitSpeechRecognition

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    if (!SpeechRecog) {
      // Simulate success on devices without mic API
      setIsListening(true)
      setTimeout(() => {
        setIsListening(false)
        awardStar()
      }, 1400)
      return
    }

    const recog = new SpeechRecog()
    recog.lang = 'en-US'
    recog.interimResults = false
    recog.maxAlternatives = 1
    recog.onstart = () => setIsListening(true)
    recog.onresult = (e) => {
      const said = e.results[0][0].transcript.toUpperCase().trim()
      if (said.includes(currentWord)) {
        awardStar()
      } else {
        setFeedback('wrong')
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(
            Object.assign(new SpeechSynthesisUtterance(`Try again! Say: ${currentWord}`), {
              rate: 0.88,
              pitch: 1.1,
            })
          )
        }
      }
    }
    recog.onend = () => setIsListening(false)
    recog.onerror = () => { setIsListening(false); setFeedback('wrong') }
    recog.start()
    recognitionRef.current = recog
  }

  const awardStar = () => {
    setFeedback('correct')
    setStars((prev) => {
      const next = [...prev]
      next[wordIdx] = true
      return next
    })
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(
        Object.assign(new SpeechSynthesisUtterance(`Great job! ${currentWord}! You earned a star!`), {
          rate: 0.9,
          pitch: 1.15,
        })
      )
    }
  }

  const goTo = (idx: number) => {
    setWordIdx(idx)
    setFeedback('none')
  }

  return (
    <section className="fa-section fa-reading-section">
      <div className="fa-section-header">
        <div className="fa-section-icon-wrap" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
          <span className="fa-section-emoji">🦌</span>
        </div>
        <div>
          <span className="fa-skill-chip" style={{ background: '#dcfce7', color: '#16a34a' }}>
            📖 READING
          </span>
          <h2 className="fa-section-title">Say the Sunshine Word</h2>
          <p className="fa-section-sub">Ruby the Deer's Reading Game</p>
        </div>
      </div>

      <div className="fa-reading-body">
        {/* Stars progress */}
        <div className="fa-stars-track">
          {READING_WORDS.map((w, i) => (
            <button
              key={i}
              className={`fa-word-dot ${i === wordIdx ? 'active' : ''} ${stars[i] ? 'earned' : ''}`}
              onClick={() => goTo(i)}
              style={{ borderColor: i === wordIdx ? '#16a34a' : undefined }}
            >
              {stars[i] ? '⭐' : w}
            </button>
          ))}
        </div>

        {/* Word card */}
        <div className="fa-word-spotlight">
          <div className="fa-word-glow-card">
            <span className="fa-word-big">{currentWord}</span>
            <span className="fa-word-sub">Say this word out loud!</span>
          </div>

          {/* Mic button */}
          <button
            className={`fa-big-mic-btn ${isListening ? 'recording' : ''} ${stars[wordIdx] ? 'starred' : ''}`}
            onClick={handleMic}
            disabled={stars[wordIdx]}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 38, fontVariationSettings: "'FILL' 1" }}
            >
              {stars[wordIdx] ? 'star' : isListening ? 'stop_circle' : 'mic'}
            </span>
            <span className="fa-mic-label">
              {stars[wordIdx] ? '⭐ Word Earned!' : isListening ? 'Listening…' : 'Press & Speak'}
            </span>
            {isListening && (
              <span className="fa-mic-wave">
                <span /><span /><span /><span />
              </span>
            )}
          </button>

          {/* Feedback */}
          {feedback === 'correct' && (
            <div className="fa-feedback-banner success">
              ⭐ Amazing! You said <strong>{currentWord}</strong> perfectly!
            </div>
          )}
          {feedback === 'wrong' && (
            <div className="fa-feedback-banner try-again">
              🔄 Try again! Look at the word and say it clearly.
            </div>
          )}
        </div>

        {/* Nav arrows */}
        <div className="fa-word-nav">
          <button
            className="fa-nav-arrow"
            onClick={() => goTo(Math.max(0, wordIdx - 1))}
            disabled={wordIdx === 0}
          >
            ←
          </button>
          <span className="fa-nav-count">
            {earnedCount} / {READING_WORDS.length} words ⭐
          </span>
          <button
            className="fa-nav-arrow"
            onClick={() => goTo(Math.min(READING_WORDS.length - 1, wordIdx + 1))}
            disabled={wordIdx === READING_WORDS.length - 1}
          >
            →
          </button>
        </div>

        {earnedCount === READING_WORDS.length && (
          <div className="fa-complete-banner">
            🎉 Ruby is dancing! You said ALL the words! You're a Reading Star!
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Listening Activity — Story Player + Q
// ─────────────────────────────────────────────────────────────────────────────
function ListeningSection() {
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(STORY_TEXT)
    utt.rate = 0.8
    utt.pitch = 1.05
    utt.volume = 1
    setPlaying(true)
    utt.onend = () => { setPlaying(false); setHasPlayed(true) }
    utt.onerror = () => { setPlaying(false); setHasPlayed(true) }
    window.speechSynthesis.speak(utt)
  }

  const stopSpeak = () => {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])

  const handleAnswer = (opt: string) => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    const correct = opt === STORY_CORRECT
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(
        correct
          ? 'Fantastic! Yes! Tommy loves to eat carrots! Barnaby gives you a big hug!'
          : `Not quite! Tommy loves carrots! Listen to the story again and try!`
      )
      utt.rate = 0.88
      utt.pitch = 1.1
      window.speechSynthesis.speak(utt)
    }
  }

  const retry = () => {
    setSelected(null)
    setAnswered(false)
    setHasPlayed(false)
  }

  return (
    <section className="fa-section fa-listening-section">
      <div className="fa-section-header">
        <div className="fa-section-icon-wrap" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
          <span className="fa-section-emoji">🐻</span>
        </div>
        <div>
          <span className="fa-skill-chip" style={{ background: '#dbeafe', color: '#2563eb' }}>
            🎧 LISTENING
          </span>
          <h2 className="fa-section-title">Tommy's Little Story</h2>
          <p className="fa-section-sub">Barnaby the Bear's Listening Quest</p>
        </div>
      </div>

      <div className="fa-listening-body">
        {/* Story Player */}
        <div className={`fa-story-player-card ${playing ? 'is-playing' : ''}`}>
          <div className="fa-story-player-top">
            <div className="fa-story-icon-col">
              <button
                className={`fa-story-play-btn ${playing ? 'btn-stop' : 'btn-play'}`}
                onClick={playing ? stopSpeak : speak}
                title={playing ? 'Stop story' : 'Play story'}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}
                >
                  {playing ? 'pause_circle' : 'play_circle'}
                </span>
              </button>
              {playing && (
                <div className="fa-sound-wave">
                  <span /><span /><span /><span /><span />
                </div>
              )}
            </div>
            <div className="fa-story-info">
              <p className="fa-story-info-title">🐰 Tommy's Story</p>
              <p className="fa-story-info-status">
                {playing
                  ? '🔊 Listen carefully…'
                  : hasPlayed
                  ? '✅ Story played! Now answer below.'
                  : '👇 Press play to hear the story!'}
              </p>
              {!playing && (
                <button className="fa-replay-btn" onClick={speak}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    replay
                  </span>
                  {hasPlayed ? 'Replay Story' : 'Play Story'}
                </button>
              )}
            </div>
          </div>

          {/* Story text box */}
          <div className="fa-story-text-panel">
            <span className="fa-story-headphones-tag">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                headphones
              </span>
              Listen along
            </span>
            <p className="fa-story-text">{STORY_TEXT}</p>
          </div>
        </div>

        {/* Question */}
        <div className="fa-question-block">
          <h3 className="fa-q-title">🐻 {STORY_QUESTION}</h3>
          <div className="fa-options-col">
            {STORY_OPTIONS.map((opt) => {
              let cls = ''
              if (answered) {
                if (opt === STORY_CORRECT) cls = 'opt-correct'
                else if (opt === selected) cls = 'opt-wrong'
              }
              return (
                <button
                  key={opt}
                  className={`fa-opt-btn ${cls}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={answered}
                >
                  <span className="fa-opt-icon">
                    {answered && opt === STORY_CORRECT
                      ? '✅'
                      : answered && opt === selected
                      ? '❌'
                      : '🔵'}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`fa-answer-result ${selected === STORY_CORRECT ? 'correct' : 'wrong'}`}>
              {selected === STORY_CORRECT ? (
                <>
                  <span className="fa-result-big-emoji">🎉</span>
                  <span>
                    <strong>Perfect!</strong> Tommy loves carrots! Barnaby gives you a golden star!
                  </span>
                </>
              ) : (
                <>
                  <span className="fa-result-big-emoji">🔄</span>
                  <span>
                    <strong>Not quite!</strong> Listen to the story again — Tommy loves{' '}
                    <strong>carrots</strong>!
                  </span>
                </>
              )}
              {selected !== STORY_CORRECT && (
                <button className="fa-retry-btn" onClick={retry}>
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function FreeActivities() {
  const navigate = useNavigate()

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  return (
    <div className="fa-page">
      {/* ── Header ── */}
      <header className="fa-header">
        <button className="fa-back-btn" onClick={() => navigate('/home')}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          Back to Home
        </button>
        <div className="fa-header-center">
          <span style={{ fontSize: 22 }}>🎓</span>
          <span className="fa-brand-name">CAIRE Learning</span>
        </div>
        <span className="fa-free-badge">✨ FREE TRIAL</span>
      </header>

      {/* ── Hero ── */}
      <div className="fa-hero">
        <div className="fa-hero-animals">🦁&nbsp;&nbsp;🦌&nbsp;&nbsp;🐻</div>
        <h1 className="fa-hero-title">Try Learning Free!</h1>
        <p className="fa-hero-sub">
          Scroll down and start playing — <strong>no sign-up needed!</strong><br />
          Try Writing, Reading and Listening right here.
        </p>
      </div>

      {/* ── Activity Sections ── */}
      <div className="fa-sections-wrap">
        <WritingSection />
        <ReadingSection />
        <ListeningSection />
      </div>

      {/* ── Sign-up CTA ── */}
      <div className="fa-cta-wrap">
        <p className="fa-cta-text">
          🌟 Loving the activities? Create a free account to unlock your <strong>full personal learning plan!</strong>
        </p>
        <button
          className="fa-cta-btn"
          onClick={() => navigate('/role')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            person_add
          </span>
          Create Free Account
        </button>
      </div>
    </div>
  )
}
