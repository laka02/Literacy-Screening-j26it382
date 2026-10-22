import React, { useState, useEffect, useRef } from 'react'
import './ReadingStudio.css'

// ── Types ──────────────────────────────────────────────────────────────────
interface ReadingActivity {
  id: number
  word: string
  phonics: string
  image: string
  sentence: string
  prompt: string
  tip: string
}

interface ReadingTaskData {
  type: string
  target_skill: string
  band: string
  activities: ReadingActivity[]
  total_activities: number
  pro_tip: string
  bridge_goal: string
  question: string
  options: string[]
  correct_index: number
  hint: string
}

interface ReadingStageItem {
  stage_number: number
  title: string
  difficulty: string
  description: string
  rules: string[]
  xp_reward: number
  stars: number
  locked: boolean
  status: string
  task_data: ReadingTaskData
}

interface ReadingStudioProps {
  stage: ReadingStageItem
  skillAvatar: string
  animalGuide: string
  skillColor: string
  childName: string
  onComplete: (stageNumber: number) => void
  onClose: () => void
}

// ── Reading Studio ─────────────────────────────────────────────────────────
export default function ReadingStudio({
  stage,
  skillAvatar,
  animalGuide,
  skillColor,
  childName,
  onComplete,
  onClose,
}: ReadingStudioProps) {
  const rawActivities = stage?.task_data?.activities
  const activities: ReadingActivity[] =
    rawActivities && rawActivities.length > 0
      ? (rawActivities as ReadingActivity[])
      : [
          {
            id: 1,
            word: 'BOOK',
            phonics: '/bʊk/',
            image: '📖',
            sentence: 'I open my favorite story book.',
            prompt: 'Look at the word and read it out loud!',
            tip: 'Make a quick /b/ sound and end with /k/.',
          },
          {
            id: 2,
            word: 'READ',
            phonics: '/riːd/',
            image: '📚',
            sentence: 'We read adventures together.',
            prompt: 'Say the word clearly into the microphone!',
            tip: 'Smile as you say the long /ee/ sound.',
          },
          {
            id: 3,
            word: 'STORY',
            phonics: '/ˈstɔː.ri/',
            image: '✨',
            sentence: 'Every book tells a wonderful story.',
            prompt: 'You are doing great, read one last word!',
            tip: 'Blend "st" smoothly at the start.',
          },
        ]
  const [activityIndex, setActivityIndex] = useState<number>(0)
  const [phase, setPhase] = useState<'listen' | 'speak' | 'result'>('listen')
  const [isListening, setIsListening] = useState<boolean>(false)
  const [speechResult, setSpeechResult] = useState<string>('')
  const [attempts, setAttempts] = useState<number>(0)
  const [showTip, setShowTip] = useState<boolean>(false)
  const [activityDone, setActivityDone] = useState<boolean[]>(
    new Array(activities.length).fill(false)
  )
  const [bridgeStep, setBridgeStep] = useState<number>(0)
  const [celebrateAll, setCelebrateAll] = useState<boolean>(false)
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const recognitionRef = useRef<any>(null)

  const currentActivity = activities[activityIndex] as ReadingActivity | undefined
  const totalSteps = activities.length
  const bridgeGoal = stage?.task_data?.bridge_goal || 'Cross the Jungle Bridge!'
  const proTip = stage?.task_data?.pro_tip || 'Practice saying words clearly and with confidence!'
  const band = stage?.task_data?.band || 'medium'
  const bandColor =
    band === 'low'
      ? '#ef4444'
      : band === 'medium'
      ? '#f59e0b'
      : '#10b981'

  // ── TTS Helper ────────────────────────────────────────────────────────────
  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.82
    utt.pitch = 1.15
    utt.volume = 1
    setIsSpeaking(true)
    utt.onend = () => {
      setIsSpeaking(false)
      if (onEnd) onEnd()
    }
    window.speechSynthesis.speak(utt)
  }

  // Auto-speak word when activity loads
  useEffect(() => {
    if (currentActivity && phase === 'listen') {
      const timer = setTimeout(() => {
        speak(currentActivity.word)
      }, 450)
      return () => clearTimeout(timer)
    }
  }, [activityIndex, phase])

  const handleListenWord = () => {
    if (!currentActivity) return
    speak(`${currentActivity.word}. ${currentActivity.sentence}`)
  }

  // ── Microphone STT ────────────────────────────────────────────────────────
  const handleStartSpeaking = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      handleAcceptSpeech(currentActivity?.word || '')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 3
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setAttempts((a) => a + 1)
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim().toUpperCase()
      setSpeechResult(transcript)
      handleAcceptSpeech(transcript)
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const handleStopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  // ── Evaluate speech ───────────────────────────────────────────────────────
  const handleAcceptSpeech = (transcript: string) => {
    setPhase('result')
    setSpeechResult(transcript)
    const target = (currentActivity?.word || '').toUpperCase()
    const targetTokens = target.split(/\s+/)
    const matched = targetTokens.every((t) => transcript.includes(t))

    if (matched) {
      speak(`Excellent! You said it perfectly! ${currentActivity?.word}!`)
      const newDone = [...activityDone]
      newDone[activityIndex] = true
      setActivityDone(newDone)
      setBridgeStep((b) => Math.min(b + 1, totalSteps))

      setTimeout(() => {
        if (activityIndex < activities.length - 1) {
          setActivityIndex((i) => i + 1)
          setPhase('listen')
          setSpeechResult('')
          setAttempts(0)
          setShowTip(false)
        } else {
          setCelebrateAll(true)
          speak(`Amazing! You completed all ${totalSteps} activities in this stage!`)
          setTimeout(() => {
            onComplete(stage.stage_number)
          }, 3200)
        }
      }, 1500)
    } else {
      setAttempts((a) => a + 1)
      speak(`Good try! Let's say it again: ${currentActivity?.word}`)
      setTimeout(() => {
        setPhase('speak')
        setSpeechResult('')
      }, 1700)
    }
  }

  const handleSkipAccept = () => {
    handleAcceptSpeech(currentActivity?.word || '')
  }

  const bridgePct = totalSteps > 0 ? Math.round((bridgeStep / totalSteps) * 100) : 0

  return (
    <div className="rs-overlay">
      {/* Background blobs */}
      <div className="rs-blob rs-blob-1" style={{ background: skillColor + '1a' }} />
      <div className="rs-blob rs-blob-2" style={{ background: bandColor + '14' }} />

      {/* ── Header ── */}
      <header className="rs-header">
        <button className="rs-back-btn" onClick={onClose} title="Back to Quest Map">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="rs-header-center">
          <h1 className="rs-title">
            {stage.title.replace(/^Stage \d+:\s*/, '')}
          </h1>
          <p className="rs-subtitle">
            Stage {stage.stage_number} &bull; {stage.difficulty}
          </p>
        </div>
        <div className="rs-xp-pill" style={{ background: skillColor + '20', color: skillColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>stars</span>
          <span>+{stage.xp_reward} XP</span>
        </div>
      </header>

      {/* ── Scrollable Main ── */}
      <main className="rs-main">

        {/* Bridge Progress */}
        <section className="rs-bridge-section">
          <div className="rs-bridge-label">
            <span>{bridgeGoal}</span>
            <span className="rs-bridge-count">{bridgeStep} / {totalSteps} steps</span>
          </div>
          <div className="rs-bridge-track">
            <div
              className="rs-bridge-fill"
              style={{ width: `${bridgePct}%`, background: `linear-gradient(90deg, ${skillColor}, ${bandColor})` }}
            />
            <div
              className="rs-bridge-mascot"
              style={{ left: `max(0px, calc(${bridgePct}% - 22px))` }}
            >
              <span>{skillAvatar}</span>
            </div>
            {activities.map((_, i) => (
              <div
                key={i}
                className={`rs-bridge-marker ${i < bridgeStep ? 'done' : ''}`}
                style={{ left: `${Math.round(((i + 1) / totalSteps) * 100)}%` }}
              >
                {i < bridgeStep ? '🌟' : '🪨'}
              </div>
            ))}
            <div className="rs-bridge-end">🏆</div>
          </div>
        </section>

        {/* Step Dots */}
        <div className="rs-steps-row">
          {activities.map((act, i) => (
            <div
              key={act.id}
              className={`rs-step-dot ${activityDone[i] ? 'done' : i === activityIndex ? 'active' : ''}`}
              style={
                i === activityIndex
                  ? { borderColor: skillColor, background: skillColor + '20' }
                  : {}
              }
            >
              {activityDone[i] ? (
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#16a34a' }}>
                  check
                </span>
              ) : (
                <span style={{ fontWeight: 800, fontSize: '13px' }}>{i + 1}</span>
              )}
            </div>
          ))}
          <span className="rs-steps-label">
            Activity {activityIndex + 1} of {totalSteps}
          </span>
        </div>

        {/* Activity Card */}
        {currentActivity && !celebrateAll && (
          <div className="rs-activity-card">
            <div className="rs-sticker rs-sticker-1">🌴</div>
            <div className="rs-sticker rs-sticker-2">⭐</div>
            <div className="rs-sticker rs-sticker-3">🎵</div>

            {/* Top: image bubble + guide speech */}
            <div className="rs-card-top">
              <div className="rs-word-emoji-bubble" style={{ borderColor: skillColor + '50' }}>
                <span className="rs-word-emoji">{currentActivity.image}</span>
              </div>
              <div className="rs-card-guide-bubble">
                <div className="rs-guide-avatar">{skillAvatar}</div>
                <div className="rs-guide-speech">
                  <strong>{animalGuide} says:</strong> {currentActivity.prompt}
                </div>
              </div>
            </div>

            {/* Target word */}
            <div className="rs-word-display" style={{ borderColor: skillColor + '50' }}>
              <div className="rs-word-text" style={{ color: skillColor }}>
                {currentActivity.word}
              </div>
              <div className="rs-phonics-text">{currentActivity.phonics}</div>
            </div>

            {/* Context sentence */}
            <div className="rs-sentence-box">
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7c3aed' }}>
                auto_stories
              </span>
              <em>{currentActivity.sentence}</em>
            </div>

            {/* Action buttons */}
            <div className="rs-action-row">
              <button
                className={`rs-btn-listen ${isSpeaking ? 'speaking' : ''}`}
                onClick={handleListenWord}
                title="Hear the word"
              >
                <span className="material-symbols-outlined">
                  {isSpeaking ? 'graphic_eq' : 'volume_up'}
                </span>
                <span>Listen</span>
              </button>

              {phase !== 'result' && (
                <button
                  className={`rs-btn-mic ${isListening ? 'listening' : ''}`}
                  style={{
                    background: isListening
                      ? '#ef4444'
                      : `linear-gradient(135deg, ${skillColor}, ${bandColor})`,
                  }}
                  onClick={
                    isListening
                      ? handleStopListening
                      : () => {
                          setPhase('speak')
                          handleStartSpeaking()
                        }
                  }
                  title={isListening ? 'Stop recording' : 'Tap and speak!'}
                >
                  <span className="material-symbols-outlined">
                    {isListening ? 'stop' : 'mic'}
                  </span>
                  <span>{isListening ? 'Listening…' : 'Tap & Speak!'}</span>
                  {isListening && <div className="rs-mic-pulse" />}
                </button>
              )}

              {phase === 'result' && speechResult && (
                <div className="rs-result-pill">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: '#16a34a', fontSize: '18px' }}
                  >
                    check_circle
                  </span>
                  <span>
                    You said: <strong>"{speechResult}"</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Tip + attempts */}
            <div className="rs-tip-row">
              {!showTip ? (
                <button className="rs-btn-tip" onClick={() => setShowTip(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                    lightbulb
                  </span>
                  <span>Pronunciation Tip</span>
                </button>
              ) : (
                <div className="rs-tip-box">
                  💡 <strong>Tip:</strong> {currentActivity.tip}
                </div>
              )}
              {attempts > 0 && (
                <span className="rs-attempts-badge">Try #{attempts + 1}</span>
              )}
            </div>

            {/* Skip / no mic */}
            <div className="rs-skip-row">
              <button className="rs-btn-skip" onClick={handleSkipAccept} title="Accept without mic">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                  skip_next
                </span>
                <span>I said it! (No Mic)</span>
              </button>
            </div>
          </div>
        )}

        {/* Celebration */}
        {celebrateAll && (
          <div className="rs-celebrate-card">
            <div className="rs-celebrate-stars">⭐ 🌟 ⭐</div>
            <div className="rs-celebrate-emoji">🎉</div>
            <h2 className="rs-celebrate-heading">Stage {stage.stage_number} Complete!</h2>
            <p className="rs-celebrate-sub">
              Incredible! <strong>{animalGuide}</strong> crossed the bridge!
              You earned <strong>+{stage.xp_reward} XP</strong> and{' '}
              <strong>3 golden stars 🏅</strong>!
            </p>
            <div className="rs-celebrate-trophy">🏆</div>
            <p className="rs-celebrate-note">Returning to your Quest Map…</p>
          </div>
        )}

        {/* Pro tip footer */}
        {!celebrateAll && (
          <div className="rs-pro-tip-footer">
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#7c3aed' }}>
              psychology
            </span>
            <span>
              <strong>Pro Tip:</strong> {proTip}
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
