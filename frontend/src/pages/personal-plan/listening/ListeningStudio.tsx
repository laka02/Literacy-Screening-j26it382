import React, { useState, useEffect } from 'react'
import './ListeningStudio.css'

interface PictureOption {
  label: string
  emoji: string
  img?: string
}

interface BlankSentence {
  prefix: string
  suffix: string
  correct: string
  options: string[]
}

interface SequenceStep {
  step: number
  label: string
  emoji: string
  img?: string
}

interface ListeningTaskData {
  type: string
  target_skill: string
  band: string
  scene_title?: string
  character?: string
  hero_image?: string
  story_text?: string
  highlight_word?: string
  sentence?: string
  audio_text?: string
  picture_options?: PictureOption[]
  blank_sentence?: BlankSentence
  sequence_steps?: SequenceStep[]
  questions?: any[]
  pro_tip?: string
  bridge_goal?: string
  [key: string]: any
}

interface ListeningStageItem {
  stage_number: number
  title: string
  difficulty: string
  description: string
  rules: string[]
  xp_reward: number
  stars: number
  locked: boolean
  status: string
  task_data: ListeningTaskData
}

interface ListeningStudioProps {
  stage: ListeningStageItem
  skillAvatar: string
  animalGuide: string
  skillColor: string
  childName: string
  onComplete: (stageNumber: number) => void
  onClose: () => void
}

export default function ListeningStudio({
  stage,
  skillAvatar,
  animalGuide,
  skillColor,
  childName,
  onComplete,
  onClose,
}: ListeningStudioProps) {
  const taskData = stage?.task_data || {}

  // Content extraction with resilient fallbacks
  const characterTitle = taskData.character || taskData.scene_title || '🐰 Tommy the Little Rabbit'
  const heroImage =
    taskData.hero_image ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCJbFzZmwGiE99Z2ai-PtBQ3egMU9hVLkkthqYpM369usNTXaIZ6cacXON1QZTYUMucYhfiF8nCAOVbia4duIUAyWzbxgyNr3Yn5opgURbnbHy8auyBIzEQNL5Yfd8Le2hfxz0-38uNv9v01bHfalcKA9kHrKz6ZM9-5XKGS3kgv1-P77TCVgEa9AQm9IrLjvl8rXm0r0wmGWYPzN7vkWMXaNSRnKTSboedNwxyqoZjcczsOBc06ikitg'
  const storyText =
    taskData.story_text ||
    'Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat carrots.'
  const highlightWord = taskData.highlight_word || 'carrots'
  const audioText =
    taskData.audio_text ||
    taskData.story_text ||
    'Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat sweet orange carrots.'

  // Picture Options for Activity 1
  const pictureOptions: PictureOption[] =
    taskData.picture_options && taskData.picture_options.length > 0
      ? taskData.picture_options
      : [
          {
            label: 'Carrot',
            emoji: '🥕',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg',
          },
          {
            label: 'Apple',
            emoji: '🍎',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg',
          },
          {
            label: 'Pizza',
            emoji: '🍕',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqJFohEZjKyDCC0CR17xgQPNSk5XlbvtKszrDcvxc1mCbec0FP0UEylnIkhfwLQr7aZTELrqJ9Vr5-A9vP7xPfxUciUwzh1JEQwFKNzIQ8e0U3X75lhn2BJCvWpUkRWgwFltXVTC4yr2aV8-ZmaNiZ4Ip7O_fniqC0IS3wtmRgSMji7dT_-x1m2Meq0WU1aVqCjT5bAFxp2U1TJgj1_KdRufMYT8NJuM7-Xom7mUrwP0EvH8LPr8qLDg',
          },
        ]

  // Blank Sentence for Activity 2
  const blankSentence: BlankSentence =
    taskData.blank_sentence || {
      prefix: 'Tommy is a little',
      suffix: '.',
      correct: 'Rabbit',
      options: ['Rabbit', 'Bear'],
    }

  // Sequence Steps for Activity 3
  const sequenceSteps: SequenceStep[] =
    taskData.sequence_steps && taskData.sequence_steps.length > 0
      ? taskData.sequence_steps
      : [
          {
            step: 1,
            label: 'Forest Path',
            emoji: '🌲',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6W0jz8BJDT9nK-pjnmrSAcxpnTFGdViDv-7xQrI58YESwPvLFif8dAgIpi54R-RZeejvWonVk1YwHDqXsGV7QLfKwUZzxw6uR65x9SApheLxluaQ6KLKH-LNJ8JIkOsjyKhzrnE9SUslL7eI_HxEFwzk9vRpuhCLMdk1m2LVjij3Rjxr8ZS6ohIPlv72d4G642dBsNdJ0nWblO1IdYb6Wu9PwO8b4SZ40wLeTk6qOReh82O0xHlfwUw',
          },
          { step: 2, label: 'Tommy Hopping', emoji: '🐰' },
          { step: 3, label: 'Eating Carrots', emoji: '🥕' },
        ]

  // Component Interactive States
  const [isReadingAloud, setIsReadingAloud] = useState<boolean>(false)
  const [selectedPic, setSelectedPic] = useState<number | null>(null)
  const [picStatus, setPicStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [wordStatus, setWordStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [orderedSteps, setOrderedSteps] = useState<number[]>([])
  const [showCelebration, setShowCelebration] = useState<boolean>(false)

  // TTS Reader
  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.84
    utterance.pitch = 1.05
    utterance.volume = 1

    setIsReadingAloud(true)

    utterance.onend = () => {
      setIsReadingAloud(false)
      if (onEnd) onEnd()
    }
    utterance.onerror = () => {
      setIsReadingAloud(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsReadingAloud(false)
  }

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Activity 1 Click Handler (Picture Option)
  const handleSelectPicture = (idx: number, opt: PictureOption) => {
    if (picStatus === 'correct') return
    setSelectedPic(idx)

    // First option (Carrot) is correct
    if (idx === 0 || opt.label.toLowerCase() === 'carrot') {
      setPicStatus('correct')
      speakText(`Yes! Tommy loves crunchy sweet carrots!`)
      checkAllActivitiesDone(true, wordStatus === 'correct')
    } else {
      setPicStatus('wrong')
      speakText(`Good try! But Tommy likes carrots best. Tap again!`)
    }
  }

  // Activity 2 Click Handler (Fill blank)
  const handleSelectWordChip = (word: string) => {
    if (wordStatus === 'correct') return
    setSelectedWord(word)

    if (word.toLowerCase() === blankSentence.correct.toLowerCase()) {
      setWordStatus('correct')
      speakText(`Awesome! Tommy is a little rabbit!`)
      checkAllActivitiesDone(picStatus === 'correct', true)
    } else {
      setWordStatus('wrong')
      speakText(`Tommy is a rabbit, not a bear! Try once more!`)
    }
  }

  // Activity 3 Sequence Click Handler
  const handleToggleSequence = (stepNum: number) => {
    if (orderedSteps.includes(stepNum)) {
      setOrderedSteps(orderedSteps.filter((s) => s !== stepNum))
    } else {
      const next = [...orderedSteps, stepNum]
      setOrderedSteps(next)
      speakText(`Step ${stepNum} placed!`)
    }
  }

  // Check if child has completed the core challenges
  const checkAllActivitiesDone = (isPicDone: boolean, isWordDone: boolean) => {
    if (isPicDone && isWordDone) {
      setTimeout(() => {
        setShowCelebration(true)
        speakText(`Fantastic job! You explored the whole story and earned your stars!`)
      }, 900)
    }
  }

  // Compute completion percentage
  let completedCount = 0
  if (picStatus === 'correct') completedCount += 1
  if (wordStatus === 'correct') completedCount += 1
  if (orderedSteps.length >= 2) completedCount += 1
  const progressPct = Math.min(100, Math.max(35, Math.round((completedCount / 3) * 100)))

  return (
    <div className="se-overlay">
      {/* ── Top App Bar ── */}
      <header className="se-topbar">
        <div className="se-topbar-left">
          <button
            aria-label="Go back to Quest Map"
            className="se-back-btn"
            onClick={onClose}
            title="Go back"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
              arrow_back
            </span>
          </button>
          <h1 className="se-topbar-title">Story Explorer</h1>
        </div>

        <div className="se-topbar-right">
          <div className="se-stars-pill">
            <span
              className="material-symbols-outlined text-tertiary font-bold"
              style={{ fontVariationSettings: "'FILL' 1", fontSize: '22px' }}
            >
              stars
            </span>
            <span>+{stage.xp_reward || 50} XP</span>
          </div>
        </div>
      </header>

      {/* ── Progress Bar ── */}
      <div className="se-progress-container">
        <div className="se-progress-track">
          <div className="se-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="se-progress-label">{progressPct}% Completed</p>
      </div>

      {/* ── Main Bento Grid ── */}
      <main className="se-main-grid">
        {/* Left Column: Story & Activities */}
        <section className="se-left-col">
          {/* Hero Story Card */}
          <div className="se-hero-card bento-border squishy-shadow">
            <h2 className="se-story-title">{characterTitle}</h2>

            <div className="se-hero-image-wrap bento-border">
              {heroImage ? (
                <img
                  alt="Story scene illustration"
                  className="se-hero-image"
                  src={heroImage}
                  onError={(e) => {
                    // Fallback to emoji bubble if image fails to load
                    ;(e.target as HTMLElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="se-hero-fallback-emoji">🐰🌸🌲</span>
              )}
            </div>

            {/* Auditory Story Player Container */}
            <div className={`se-listen-story-box ${isReadingAloud ? 'is-playing' : ''}`}>
              <div className="se-listen-bar">
                <div className="se-listen-tag">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    headphones
                  </span>
                  <span>Listen to Tommy's Story</span>
                </div>

                <button
                  type="button"
                  className={`se-audio-play-pill chunky-btn ${isReadingAloud ? 'playing' : ''}`}
                  onClick={isReadingAloud ? stopSpeaking : () => speakText(audioText)}
                  title={isReadingAloud ? 'Stop audio' : 'Listen to story'}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isReadingAloud ? 'volume_up' : 'play_arrow'}
                  </span>
                  <span>{isReadingAloud ? 'Playing Audio…' : 'Tap to Listen'}</span>
                  {isReadingAloud && (
                    <span className="se-mini-wave">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  )}
                </button>
              </div>

              <div
                className="se-story-auditory-wrap"
                onClick={() => speakText(audioText)}
                title="Tap anywhere to hear the story!"
              >
                <p className="se-story-text">
                  Tommy is a little rabbit. He lives near a green forest. Tommy loves to eat{' '}
                  <span
                    className="se-word-interactive"
                    onClick={(e) => {
                      e.stopPropagation()
                      speakText('carrots!')
                    }}
                    title="Tap to hear carrots!"
                  >
                    {highlightWord}
                    <span className="se-word-tooltip">tap for word</span>
                  </span>
                  .
                </p>
                <div className="se-audio-tap-hint">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    volume_up
                  </span>
                  <span>Tap to hear the full story read aloud!</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Activities Grid */}
          <div className="se-activities-grid">
            {/* Game 1: Multiple Choice with Visual Picture Cards */}
            <div className="se-activity-card bento-border squishy-shadow">
              <div className="se-activity-header">
                <span className="se-step-number">1</span>
                <h3 className="se-activity-title">What does Tommy like?</h3>
              </div>

              <div className="se-picture-options">
                {pictureOptions.map((opt, idx) => {
                  let statusClass = ''
                  if (selectedPic === idx) {
                    statusClass = picStatus === 'correct' ? 'correct' : 'wrong'
                  }

                  return (
                    <button
                      key={idx}
                      className={`se-pic-btn bento-border ${statusClass}`}
                      onClick={() => handleSelectPicture(idx, opt)}
                    >
                      {opt.img ? (
                        <img
                          alt={opt.label}
                          className="se-pic-img"
                          src={opt.img}
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="se-pic-fallback-emoji">{opt.emoji}</span>
                      )}
                      <span className="se-pic-label">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Game 2: Fill in the blank */}
            <div className="se-activity-card bento-border squishy-shadow">
              <div className="se-activity-header">
                <span className="se-step-number">2</span>
                <h3 className="se-activity-title">Fill in the missing word!</h3>
              </div>

              <div className="se-blank-game">
                <div className="se-sentence-slot-wrap">
                  <span>{blankSentence.prefix}</span>
                  <div
                    className={`se-drop-target ${
                      wordStatus === 'correct' ? 'filled-correct' : ''
                    }`}
                  >
                    {selectedWord ? (
                      <span>
                        {selectedWord === 'Rabbit' ? '🐰 ' : ''}
                        {selectedWord}
                      </span>
                    ) : (
                      <span>Drop here</span>
                    )}
                  </div>
                  <span>{blankSentence.suffix}</span>
                </div>

                <div className="se-chips-row">
                  {blankSentence.options.map((w, idx) => (
                    <button
                      key={idx}
                      className={`se-chip-btn chunky-btn ${
                        idx === 0 ? 'se-chip-primary' : 'se-chip-surface'
                      }`}
                      onClick={() => handleSelectWordChip(w)}
                    >
                      {w === 'Rabbit' && (
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                          cruelty_free
                        </span>
                      )}
                      <span>{w}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Game 3: Story Sequencing */}
            <div className="se-activity-card se-seq-card bento-border squishy-shadow">
              <div className="se-activity-header">
                <span className="se-step-number">3</span>
                <h3 className="se-activity-title">
                  Tap story pictures into the correct order.
                </h3>
              </div>

              <div className="se-seq-grid">
                {sequenceSteps.map((step) => {
                  const isDone = orderedSteps.includes(step.step)

                  return (
                    <div key={step.step} className="se-seq-slot">
                      <div className="se-seq-badge">{step.step}</div>
                      <div
                        className={`se-seq-box ${isDone ? 'done' : ''}`}
                        onClick={() => handleToggleSequence(step.step)}
                        title="Tap to mark step in sequence"
                      >
                        <span className="se-seq-emoji">{step.emoji}</span>
                        <span className="se-seq-caption">{step.label}</span>
                        {isDone && (
                          <span
                            className="material-symbols-outlined"
                            style={{ color: '#16a34a', marginTop: '6px' }}
                          >
                            check_circle
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Sidebar */}
        <aside className="se-right-col">
          {/* CAIRE AI Recommendation Card */}
          <div className="se-guide-card glass-overlay bento-border squishy-shadow">
            <div className="se-guide-avatar-float">
              <img
                alt="CAIRE AI Guide"
                className="se-guide-img"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq13cKy_RQeVrOTWUWsDIz_Nn84vxTX8f3DCsYbY7SQ6qVQRQmRLGuvSBgy8VXM4cck5rusmM7B4GLKRDqwEYfWuPYBHQ9Dks8Z_2Ut09E-l4J5n-P0CdbgmXX4ZDKRq2bIg9yanFzWa4hPgit2iGsSm79tLhOZTvow_qr6kuzNZ0gQdbNsUGNvwxF9ymGbwOQGvWVvFqsctWF_mdZG7Z0vE7pBdC2VsR4ljnmvBMfzRq8hR_Xtk-e0A"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = 'none'
                }}
              />
              <span style={{ fontSize: '38px' }}>🤖</span>
            </div>

            <div className="se-guide-body">
              <h3 className="se-guide-name">{animalGuide || 'Caire Guide'}</h3>

              <div className="se-adaptive-tag">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  trending_up
                </span>
                <span>Level: Adaptive</span>
              </div>

              <p className="se-guide-speech">
                Listen carefully to Tommy's story! Tap the speaker to hear it anytime, then solve the fun challenges below.
              </p>

              <button
                className={`se-btn-read-aloud chunky-btn ${
                  isReadingAloud ? 'speaking' : ''
                }`}
                onClick={isReadingAloud ? stopSpeaking : () => speakText(audioText)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isReadingAloud ? 'pause_circle' : 'volume_up'}
                </span>
                <span>{isReadingAloud ? 'Playing Audio…' : 'Listen to Story'}</span>
              </button>
            </div>
          </div>

          {/* Achievement Tile */}
          <div className="se-streak-card bento-border">
            <span className="material-symbols-outlined se-streak-bg-icon">
              military_tech
            </span>

            <div className="se-streak-badge">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1", fontSize: '26px' }}
              >
                local_fire_department
              </span>
            </div>

            <div>
              <h4 className="se-streak-title">Listening Streak!</h4>
              <p className="se-streak-sub">3 days in a row &bull; Level Up</p>
            </div>
          </div>
        </aside>
      </main>

      {/* ── Celebration Finish Modal ── */}
      {showCelebration && (
        <div className="se-celebrate-modal">
          <div className="se-celebrate-box squishy-shadow">
            <div className="se-celebrate-stars">⭐ 🌟 ⭐</div>
            <div className="se-celebrate-avatar">🐰🎉</div>
            <h2 className="se-celebrate-title">Stage {stage.stage_number} Complete!</h2>
            <p className="se-celebrate-desc">
              Hooray, <strong>{childName}</strong>! You mastered the story and solved all
              fun clues! You earned <strong>+{stage.xp_reward || 50} XP</strong> and{' '}
              <strong>3 Golden Stars 🏅</strong>!
            </p>
            <button
              className="se-btn-claim chunky-btn"
              onClick={() => onComplete(stage.stage_number)}
            >
              Continue Quest Map 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
