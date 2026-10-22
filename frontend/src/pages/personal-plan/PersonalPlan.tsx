import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, isAuthenticated } from '../../api/auth'
import {
  getAvailableSkills,
  generatePlan,
  completeStageApi,
  SkillItem,
  AdaptivePlanResponse,
  StageItem,
} from '../../api/plan'
import ReadingStudio from './ReadingStudio'
import ListeningStudio from './listening/ListeningStudio'
import './PersonalPlan.css'

const ALPHABET_LIST = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]


const DEFAULT_SKILLS: SkillItem[] = [
  {
    id: 'writing',
    name: 'Writing',
    animal_guide: 'Leo the Lion',
    guide_avatar: '🦁',
    icon: 'draw',
    color: '#16a34a',
    current_score: 88,
    performance_band: 'high',
    tagline: 'Master letter alignment, smooth stroke physics & neat handwriting!',
    rules_applied: ['R01', 'R04', 'R08', 'R09'],
  },
  
  {
    id: 'reading',
    name: 'Reading',
    animal_guide: 'Ruby the Deer',
    guide_avatar: '🦌',
    icon: 'auto_stories',
    color: '#7c3aed',
    current_score: 84,
    performance_band: 'high',
    tagline: 'Read playful Sri Lankan adventure tales with minimal hesitation pauses!',
    rules_applied: ['R03', 'R07', 'R16', 'R33'],
  },
  
  {
    id: 'listening',
    name: 'Listening',
    animal_guide: 'Barnaby the Bear',
    guide_avatar: '🐻',
    icon: 'hearing',
    color: '#0284c7',
    current_score: 92,
    performance_band: 'high',
    tagline: 'Auditory processing, sound distinction & story comprehension challenges!',
    rules_applied: ['R02', 'R06', 'R18', 'R22'],
  },
]

export default function PersonalPlan() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Selected skill & generated plan state
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [activePlan, setActivePlan] = useState<AdaptivePlanResponse | null>(null)
  const [generating, setGenerating] = useState<boolean>(false)

  // Stage progress state for the active plan
  const [stagesProgress, setStagesProgress] = useState<{ [stageNum: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  })

  // Active game modal state
  const [activeGameStage, setActiveGameStage] = useState<StageItem | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showHint, setShowHint] = useState<boolean>(false)
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0)
  const [attemptsCount, setAttemptsCount] = useState<number>(1)

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState<boolean>(false)
  const [lastCompletedStage, setLastCompletedStage] = useState<StageItem | null>(null)

  // Handwriting Studio (Letter Quest) State
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [strokePointsCount, setStrokePointsCount] = useState<number>(0)
  const [penColor, setPenColor] = useState<string>('#0058be')
  const [activeWritingLetter, setActiveWritingLetter] = useState<string>('B')
  const [writingFeedback, setWritingFeedback] = useState<string>('Great! Keep practicing!')

  // Reset or initialize writing studio canvas when game stage opens
  useEffect(() => {
    if (activeGameStage) {
      const initialLetter = activeGameStage.task_data?.letter || 'B'
      setActiveWritingLetter(initialLetter)
      setStrokePointsCount(0)
      setWritingFeedback('Great! Keep practicing!')
      setTimeout(() => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }, 100)
    }
  }, [activeGameStage])

  // Canvas drawing coordinate mapper (responsive scaling)
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = penColor
    setIsDrawing(true)
    setStrokePointsCount((prev) => prev + 1)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setStrokePointsCount((prev) => prev + 1)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.closePath()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokePointsCount(0)
    setWritingFeedback('Canvas cleared! Try tracing again ✏️')
  }

  const handleSwitchLetter = (letter: string) => {
    setActiveWritingLetter(letter)
    setStrokePointsCount(0)
    setWritingFeedback(`Practicing letter ${letter}! Trace it on the canvas ✏️`)
    clearCanvas()
    handleSpeakText(`Letter ${letter}! Let's trace letter ${letter}!`)
  }

  const handleCheckWriting = async () => {
    if (strokePointsCount < 8) {
      setWritingFeedback('✏️ Trace the letter on the canvas above first!')
      handleSpeakText('Trace the letter first with your finger or mouse!')
      return
    }

    setWritingFeedback('🌟 Excellent! Letter traced with great accuracy! +10 Stars!')
    handleSpeakText(
      `Great handwriting! You conquered letter ${activeWritingLetter}! Stage completed!`
    )

    if (activeGameStage) {
      try {
        await completeStageApi(
          selectedSkill?.id || 'writing',
          activeGameStage.stage_number,
          activeGameStage.title,
          100,
          activeGameStage.xp_reward,
          hintsUsedCount,
          attemptsCount,
          currentUser?.email
        )
      } catch (e) {
        console.warn('Stage save warning:', e)
      }

      setStagesProgress((prev) => ({
        ...prev,
        [activeGameStage.stage_number]: true,
      }))

      setTimeout(() => {
        setLastCompletedStage(activeGameStage)
        setActiveGameStage(null)
        setShowCelebration(true)
      }, 850)
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/role')
      return
    }

    const localUser = getUser()
    setCurrentUser(localUser)

    getAvailableSkills(localUser?.email)
      .then((data) => {
        if (data && data.skills) {
          setSkills(data.skills)
        }
      })
      .catch((err) => {
        console.warn('Skills load error:', err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  // Select a skill and generate plan using expert rules
  const handleSelectSkill = async (skillItem: SkillItem) => {
    setSelectedSkill(skillItem)
    setGenerating(true)
    try {
      const planData = await generatePlan(
        skillItem.id,
        skillItem.current_score,
        undefined,
        currentUser?.grade || '4',
        currentUser?.email
      )
      setActivePlan(planData)
      setStagesProgress({ 1: false, 2: false, 3: false })
    } catch (err: any) {
      console.error('Plan generation error:', err)
      alert('Could not generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Switch skill to return to selection hub
  const handleBackToSkills = () => {
    setSelectedSkill(null)
    setActivePlan(null)
    setActiveGameStage(null)
    setShowCelebration(false)
  }

  // Launch playable mini-game activity
  const handleOpenGame = (stage: StageItem) => {
    setActiveGameStage(stage)
    setSelectedOption(null)
    setAnswerStatus('idle')
    setShowHint(false)
    setHintsUsedCount(0)
    setAttemptsCount(1)
  }

  // Speech synthesis audio prompt
  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 1.1
      window.speechSynthesis.speak(utterance)
    }
  }

  // Handle option selection
  const handleSelectOption = (idx: number) => {
    if (answerStatus === 'correct') return
    setSelectedOption(idx)

    if (activeGameStage) {
      const isCorrect = idx === activeGameStage.task_data.correct_index
      if (isCorrect) {
        setAnswerStatus('correct')
        handleSpeakText('Great job! That is correct!')

        // Complete stage in backend & trigger celebration
        setTimeout(async () => {
          try {
            await completeStageApi(
              selectedSkill?.id || 'reading',
              activeGameStage.stage_number,
              activeGameStage.title,
              100,
              activeGameStage.xp_reward,
              hintsUsedCount,
              attemptsCount,
              currentUser?.email
            )
          } catch (e) {
            console.warn('Stage save warning:', e)
          }

          setStagesProgress((prev) => ({
            ...prev,
            [activeGameStage.stage_number]: true,
          }))

          setLastCompletedStage(activeGameStage)
          setActiveGameStage(null)
          setShowCelebration(true)
        }, 800)
      } else {
        setAnswerStatus('wrong')
        setAttemptsCount((prev) => prev + 1)
        handleSpeakText('Try once more! You can do it!')
      }
    }
  }

  const childDisplayName =
    currentUser?.role === 'parent'
      ? `${currentUser.parent_name || 'Student'}'s Child`
      : currentUser?.name || 'Young Explorer'

  const gradeDisplay = currentUser?.grade ? `Grade ${currentUser.grade}` : 'Grade 4'

  return (
    <div className="personal-plan-page">
      {/* Background floating decor */}
      <div className="plan-decor-cloud cloud-1" />
      <div className="plan-decor-cloud cloud-2" />
      <div className="plan-decor-cloud cloud-3" />

      {/* ── Top Navigation Bar ── */}
      <header className="plan-nav-bar">
        <div className="plan-nav-inner">
          <div className="plan-nav-left">
            <button className="plan-back-btn" onClick={() => navigate('/profile')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_back
              </span>
              <span>Back to Profile</span>
            </button>
            <div className="plan-brand-tag">
              <span className="material-symbols-outlined" style={{ color: '#0058be' }}>
                auto_stories
              </span>
              <span>CAIRE Adaptive Quest</span>
            </div>
          </div>

          <div className="plan-nav-right">
            <span className="plan-user-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                school
              </span>
              <span>{childDisplayName} • {gradeDisplay}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="plan-main-content">
        {/* ══════════════════════════════════════════════════════════════════
           STEP 1: SKILL SELECTION HUB (When no skill is chosen yet)
           ══════════════════════════════════════════════════════════════════ */}
        {!selectedSkill && (
          <div>
            <div className="selection-hero-card">
              <div className="selection-title-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  explore
                </span>
                <span>Select Your Literacy Quest</span>
              </div>
              <h1 className="selection-main-heading">
                Where Should We Begin Our Adventure? 🗺️
              </h1>
              <p className="selection-sub-heading">
                Each literacy skill features its own friendly animal guide and an adaptive 3-stage
                roadmap calibrated by educational expert rules (R01–R40) to match your current level.
              </p>
            </div>

            <div className="skills-cards-grid">
              {(skills && skills.length > 0 ? skills : DEFAULT_SKILLS).map((skill) => (
                <div
                  key={skill.id}
                  className="skill-quest-card"
                  onClick={() => handleSelectSkill(skill)}
                >
                  <div>
                    <div className="skill-card-top">
                      <div
                        className="skill-avatar-bubble"
                        style={{ background: `${skill.color}18` }}
                      >
                        <span>{skill.guide_avatar}</span>
                      </div>
                      <span
                        className="skill-score-badge"
                        style={{ background: `${skill.color}20`, color: skill.color }}
                      >
                        {skill.current_score}% Score
                      </span>
                    </div>

                    <div className="skill-guide-name">Guide: {skill.animal_guide}</div>
                    <h3 className="skill-card-title">{skill.name}</h3>
                    <p className="skill-card-tagline">{skill.tagline}</p>
                  </div>

                  <button
                    className="btn-choose-quest"
                    style={{ background: skill.color }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectSkill(skill)
                    }}
                  >
                    <span>Start Quest Map</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           STEP 2: ADVENTURE ISLAND MAP (3 Stages)
           ══════════════════════════════════════════════════════════════════ */}
        {selectedSkill && activePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Map Header Bar */}
            <div className="map-header-bar">
              <div className="map-header-left">
                <div className="map-skill-avatar">
                  <span>{selectedSkill.guide_avatar}</span>
                </div>
                <div>
                  <h2 className="map-skill-title">{selectedSkill.name}</h2>
                  <p className="map-skill-sub">
                    Animal Guide: <strong>{selectedSkill.animal_guide}</strong> • Performance Band:{' '}
                    <span style={{ textTransform: 'capitalize', fontWeight: 800, color: selectedSkill.color }}>
                      {activePlan.evaluation.performance_band}
                    </span>{' '}
                    • Support Priority:{' '}
                    <span style={{ textTransform: 'capitalize', fontWeight: 800 }}>
                      {activePlan.evaluation.support_priority}
                    </span>
                  </p>
                </div>
              </div>

              <button className="btn-switch-skill" onClick={handleBackToSkills}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  tune
                </span>
                <span>Change Skill</span>
              </button>
            </div>

            {/* ── 1. CAIRE AI Recommendation Card (Storybook Adventure) ── */}
            <section className="journey-ai-card">
              <div className="journey-ai-glow-1" />
              <div className="journey-ai-glow-2" />

              <div className="journey-ai-peek">
                <span>🤖</span>
              </div>

              <div className="journey-ai-header">
                <div className="journey-ai-icon-box">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>smart_toy</span>
                </div>
                <h3 className="journey-ai-title">Today&apos;s Learning Adventure 🗺️</h3>
              </div>

              <p className="journey-ai-quote">
                CAIRE recommends: Based on your <strong>{selectedSkill.current_score}% Literacy Screening</strong>,
                let&apos;s conquer <strong>{selectedSkill.name}</strong> with <strong>{selectedSkill.animal_guide}</strong>! 🌟
              </p>

              <div className="journey-quick-chips">
                <button
                  className="journey-chip-btn"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a' }}
                  onClick={() => handleSpeakText(`Let's explore ${selectedSkill.name} with ${selectedSkill.animal_guide}!`)}
                >
                  <span>🟠</span>
                  <span>{selectedSkill.name} Quest</span>
                </button>
                <button
                  className="journey-chip-btn"
                  style={{ background: '#dbeafe', color: '#1e40af', border: '1.5px solid #bfdbfe' }}
                  onClick={() => {
                    const firstUnlocked = activePlan.stages.find(s => s.stage_number === 1 || stagesProgress[s.stage_number - 1])
                    if (firstUnlocked) handleOpenGame(firstUnlocked)
                  }}
                >
                  <span>🔵</span>
                  <span>Interactive Challenge</span>
                </button>
                <button
                  className="journey-chip-btn"
                  style={{ background: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #e9d5ff' }}
                  onClick={() => handleSpeakText(`${selectedSkill.animal_guide} is ready to guide you through three exciting adventure stages!`)}
                >
                  <span>🟣</span>
                  <span>Mascot Voice Tip</span>
                </button>
              </div>
            </section>

            {/* ── 2. Top 3 KPI Summary Cards ── */}
            <section className="journey-kpis-grid">
              <div className="journey-kpi-pill-card" style={{ borderColor: '#bfdbfe' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#dbeafe', color: '#0058be' }}>
                  <span className="material-symbols-outlined">graphic_eq</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#0058be' }}>Screening Score</div>
                  <div className="journey-kpi-pill-val">{selectedSkill.current_score}%</div>
                </div>
              </div>

              <div className="journey-kpi-pill-card" style={{ borderColor: '#fde68a' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <span className="material-symbols-outlined">edit_square</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#b45309' }}>Performance Level</div>
                  <div className="journey-kpi-pill-val" style={{ textTransform: 'capitalize' }}>
                    {activePlan.evaluation.performance_band}
                  </div>
                </div>
              </div>

              <div className="journey-kpi-pill-card" style={{ borderColor: '#e9d5ff' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#7e22ce' }}>Quest Progress</div>
                  <div className="journey-kpi-pill-val">
                    {Object.values(stagesProgress).filter(Boolean).length}/3 Cleared
                  </div>
                </div>
              </div>
            </section>

            {/* ── 3. Interactive Winding Journey Board ── */}
            <section className="adventure-journey-board">
              {/* Landscape decor elements */}
              <div className="journey-decor-landmarks">
                <span className="landmark-tree">🌴</span>
                <span className="landmark-river-water">🌊</span>
                <span className="landmark-castle-tower">🏰</span>
                <span className="landmark-mountain-peak">⛰️</span>
              </div>

              <div className="journey-board-header">
                <h3 className="journey-board-title">My Journey Path 🗺️</h3>
                <p className="journey-board-sub">
                  Tap each checkpoint to play and earn stars along the winding adventure trail!
                </p>
              </div>

              {/* Connecting Path SVG Curve (Background) */}
              <div className="journey-svg-track">
                <svg preserveAspectRatio="xMidYMin meet" viewBox="0 0 400 800">
                  <path
                    className="path-line"
                    d="M 170 40 Q 60 120 120 180 T 280 340 Q 350 430 130 520 T 200 690"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Journey Nodes Chain (Staggered Layout) */}
              <div className="journey-nodes-chain">
                {/* Node 0: Start Point (Completed) */}
                <div className="journey-node-row shift-left">
                  <div className="journey-bubble" style={{ borderColor: '#16a34a', background: '#dcfce7' }}>
                    <span>🌱</span>
                    <div className="journey-check-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                    </div>
                  </div>
                  <div className="journey-node-pill">
                    <span className="journey-node-title">Adventure Start</span>
                    <span className="journey-node-sub">Passport Ready ✨</span>
                  </div>
                </div>

                {/* Nodes 1 to 3: The 3 Stages */}
                {activePlan.stages.map((stage, idx) => {
                  const isCompleted = stagesProgress[stage.stage_number]
                  const isUnlocked =
                    stage.stage_number === 1 || stagesProgress[stage.stage_number - 1]
                  const isCurrent = isUnlocked && !isCompleted

                  // Alternating zig-zag offset (Stage 1 left, Stage 2 right, Stage 3 left)
                  const shiftClass = idx === 0 ? 'shift-left' : idx === 1 ? 'shift-right' : 'shift-left'
                  const nodeEmoji = idx === 0 ? '🦁' : idx === 1 ? '🛶' : '⭐'

                  return (
                    <div
                      key={stage.stage_number}
                      className={`journey-node-row ${shiftClass} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`}
                      onClick={() => {
                        if (isUnlocked) {
                          handleOpenGame(stage)
                        } else {
                          handleSpeakText(`Complete Stage ${stage.stage_number - 1} first to unlock this stage!`)
                        }
                      }}
                      title={isUnlocked ? `Click to play Stage ${stage.stage_number}` : `Locked — Complete Stage ${stage.stage_number - 1} first`}
                    >
                      {/* Pulse aura on current active stage */}
                      {isCurrent && <div className="journey-pulse-ring" />}

                      {/* Bouncing Here badge on current stage */}
                      {isCurrent && <div className="journey-here-badge">Here! 👇</div>}

                      {/* Circular Bubble Button */}
                      <div
                        className="journey-bubble"
                        style={{
                          borderColor: isCompleted ? '#16a34a' : isCurrent ? selectedSkill.color : '#94a3b8',
                          color: isCompleted ? '#16a34a' : selectedSkill.color,
                        }}
                      >
                        <span>{nodeEmoji}</span>

                        {isCompleted && (
                          <div className="journey-check-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="journey-lock-overlay">
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
                          </div>
                        )}
                      </div>

                      {/* Label Pill */}
                      <div className="journey-node-pill">
                        <span className="journey-node-title">
                          Stage {stage.stage_number}: {stage.title.replace(/^Stage \d+:\s*/, '')}
                        </span>
                        <span className="journey-node-sub">
                          {isCompleted ? 'Completed! 🌟 Replay' : isCurrent ? 'Tap to Play! 🚀' : 'Locked 🔒'} • +{stage.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Node 4: Final Achievement Milestone (Trophy 🏆) */}
                {(() => {
                  const allDone = stagesProgress[1] && stagesProgress[2] && stagesProgress[3]
                  return (
                    <div
                      className="journey-node-row shift-center"
                      onClick={() => {
                        if (allDone) {
                          setShowCelebration(true)
                          handleSpeakText('Congratulations! You completed the entire literacy quest! You are a reading champion!')
                        } else {
                          handleSpeakText('Complete all three stages to unlock the golden champion trophy!')
                        }
                      }}
                    >
                      <div className={`trophy-milestone-box ${allDone ? 'unlocked' : ''}`}>
                        <div className="trophy-sparkle-1">✨</div>
                        <div className="trophy-sparkle-2">✨</div>
                        <span>🏆</span>
                      </div>
                      <div className="trophy-pill-tag">
                        {allDone ? '🎉 Champion Quest Unlocked! 🎉' : 'Final Goal • Quest Trophy 🏆'}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
         STEP 3: PLAYABLE MINI-GAME / LETTER QUEST WRITING STUDIO
         ══════════════════════════════════════════════════════════════════ */}
      {activeGameStage && (
        (selectedSkill?.id === 'writing' || activeGameStage.task_data?.type === 'writing_trace') ? (
          /* Letter Quest Handwriting Studio (Matching child-friendly jungle theme) */
          <div className="letter-quest-overlay">
            {/* Top Navigation */}
            <header className="letter-quest-header">
              <button
                className="letter-quest-back-btn"
                onClick={() => setActiveGameStage(null)}
                title="Back to Quest Map"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="letter-quest-title">
                Letter Quest — Practice '{activeWritingLetter}'
              </h1>
              <div className="letter-quest-stars-pill">
                <span>120</span>
                <span className="material-symbols-outlined" style={{ color: '#eab308' }}>
                  stars
                </span>
              </div>
            </header>

            {/* Main Content */}
            <main className="letter-quest-main">
              {/* Progress Bar */}
              <div className="letter-quest-progress-wrap">
                <span className="letter-quest-progress-tag">
                  Letter {Math.max(1, ALPHABET_LIST.indexOf(activeWritingLetter) + 1)} of{' '}
                  {activeGameStage.task_data?.total_letters || 26}
                </span>
                <div className="letter-quest-progress-track">
                  <div
                    className="letter-quest-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((Math.max(1, ALPHABET_LIST.indexOf(activeWritingLetter) + 1)) /
                            (activeGameStage.task_data?.total_letters || 26)) *
                          100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* CAIRE Recommendation Card (Glassmorphism) */}
              <div className="letter-quest-caire-card">
                <div className="caire-avatar-floating">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0DpR-pjqWdo2m0MR_7NA7oPi5x-Lsv-W00qC8O4gH5ZFQ8seu2tT8Mt0Bj9cM5VtjiHhfXhXImR9W1zDTz-j-HTjd8rjzCVE3fiVLvpRrLWOM6nYaDmQ0ezsb5lAy0aZEUWPj95njPtiRAgPfbUc7GWHZ1PM6DAzZzT5JQ1GoQcy18MXGmaQw3eymIfOqnEHZWlNQJ19lc1m94EpTgsZap8WPkAKbTLN2_RpL2sQpbq_ouhBTtVc4Dg"
                    alt="CAIRE Robot Mascot"
                  />
                </div>
                <div className="caire-speech-content">
                  <strong>🤖 CAIRE says:</strong>
                  <p>
                    {selectedSkill?.current_score !== undefined && selectedSkill.current_score < 45
                      ? "Writing score < 45 detected: We're starting with letter stroke fundamentals before words! Trace smoothly along the lines."
                      : "Let's practice your writing skills! Trace each stroke smoothly along the handwriting lines."}
                  </p>
                </div>
              </div>

              {/* Main Bento Grid Layout */}
              <div className="letter-quest-bento-grid">
                {/* Left Column: Letter Display & Sound Card */}
                <div className="letter-quest-left-card">
                  {/* Floating 3D Stickers */}
                  <div className="floating-sticker sticker-1">⭐</div>
                  <div className="floating-sticker sticker-2">✏️</div>
                  <div className="floating-sticker sticker-3">🎨</div>

                  <button
                    className="btn-letter-sound"
                    onClick={() =>
                      handleSpeakText(
                        activeGameStage.task_data?.phonics_sound ||
                        `${activeWritingLetter} says /${activeWritingLetter.toLowerCase()}/. Listen and trace!`
                      )
                    }
                    title="Listen to Phonics Sound"
                  >
                    <span className="material-symbols-outlined">volume_up</span>
                  </button>

                  <div className="giant-letter-display">
                    <span>{activeWritingLetter}</span>
                    <span className="lower">{activeWritingLetter.toLowerCase()}</span>
                  </div>

                  <div className="letter-phonics-label">
                    {activeGameStage.task_data?.phonics_sound ||
                      `/${activeWritingLetter.toLowerCase()}/ as in Bear 🐻`}
                  </div>

                  {/* Quick A-Z Letter Selector Bar */}
                  <div className="letter-quick-strip">
                    <span className="letter-strip-title">Alphabet Quick Pick (A–Z)</span>
                    <div className="letter-strip-scroll">
                      {(activeGameStage.task_data?.letters_set || ALPHABET_LIST).map((ltr: string) => (
                        <button
                          key={ltr}
                          className={`letter-strip-btn ${activeWritingLetter === ltr ? 'active' : ''}`}
                          onClick={() => handleSwitchLetter(ltr)}
                        >
                          {ltr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Handwriting Ruled Tracing Canvas */}
                <div className="letter-quest-right-card">
                  {/* Guide/Instructions Header */}
                  <div className="handwriting-header">
                    <p className="handwriting-instruction-pill">
                      <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>
                        draw
                      </span>
                      <span>Trace the letter with your finger or mouse ✏️</span>
                    </p>

                    {/* Stroke Guide Mini */}
                    <div className="stroke-guide-mini">
                      <div className="stroke-step-item">
                        <span className="stroke-step-num" style={{ color: '#2563eb' }}>1</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#2563eb' }}>
                          arrow_downward
                        </span>
                      </div>
                      <div className="stroke-step-item">
                        <span className="stroke-step-num" style={{ color: '#ea580c' }}>2</span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '15px', color: '#ea580c', transform: 'rotate(90deg)' }}
                        >
                          turn_right
                        </span>
                      </div>
                      <div className="stroke-step-item">
                        <span className="stroke-step-num" style={{ color: '#eab308' }}>3</span>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '15px', color: '#eab308', transform: 'rotate(90deg)' }}
                        >
                          turn_right
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Ruled Handwriting Canvas Box */}
                  <div className="handwriting-canvas-card">
                    <div className="handwriting-lines-bg" />
                    <div className="dashed-midline-rule" />
                    <div className="faint-letter-guide">
                      {activeWritingLetter}
                    </div>
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={420}
                      className="tracing-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  {/* Canvas Toolbar */}
                  <div className="canvas-tools-bar">
                    <div className="pen-colors-row">
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#64748b' }}>
                        Ink:
                      </span>
                      {[
                        { color: '#0058be', name: 'Blue' },
                        { color: '#16a34a', name: 'Green' },
                        { color: '#9333ea', name: 'Purple' },
                        { color: '#ea580c', name: 'Orange' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          className={`pen-color-dot ${penColor === c.color ? 'selected' : ''}`}
                          style={{ backgroundColor: c.color }}
                          onClick={() => setPenColor(c.color)}
                          title={c.name}
                        />
                      ))}
                    </div>

                    <button className="btn-clear-canvas" onClick={clearCanvas}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        refresh
                      </span>
                      <span>Clear &amp; Retry</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Area */}
              <div className="letter-quest-bottom">
                <div className="letter-quest-encouragement-pill">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}
                  >
                    mood
                  </span>
                  <span>{writingFeedback}</span>
                  <span className="stars-add">+10 Stars</span>
                </div>

                <button className="chunky-btn-check" onClick={handleCheckWriting}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    fact_check
                  </span>
                  <span>Check My Writing</span>
                </button>
              </div>
            </main>
          </div>
        ) : activeGameStage.task_data?.type === 'reading_speak_repeat' ? (
          /* ── Reading Speak & Repeat Adventure Studio ── */
          <ReadingStudio
            stage={activeGameStage as any}
            skillAvatar={selectedSkill?.guide_avatar || '🦌'}
            animalGuide={selectedSkill?.animal_guide || 'Ruby the Deer'}
            skillColor={selectedSkill?.color || '#7c3aed'}
            childName={childDisplayName}
            onClose={() => setActiveGameStage(null)}
            onComplete={async (stageNumber) => {
              const currentStage = activeGameStage
              try {
                await completeStageApi(
                  selectedSkill?.id || 'reading',
                  stageNumber,
                  currentStage?.title || '',
                  100,
                  currentStage?.xp_reward || 75,
                  0,
                  1,
                  currentUser?.email
                )
              } catch (e) {
                console.warn('Stage save warning:', e)
              }
              setStagesProgress((prev) => ({ ...prev, [stageNumber]: true }))
              setLastCompletedStage(currentStage)
              setActiveGameStage(null)
              setShowCelebration(true)
            }}
          />
        ) : activeGameStage.task_data?.type === 'listening_comprehension' ? (
          /* ── Listening Comprehension Adventure Studio ── */
          <ListeningStudio
            stage={activeGameStage as any}
            skillAvatar={selectedSkill?.guide_avatar || '🐻'}
            animalGuide={selectedSkill?.animal_guide || 'Barnaby the Bear'}
            skillColor={selectedSkill?.color || '#0284c7'}
            childName={childDisplayName}
            onClose={() => setActiveGameStage(null)}
            onComplete={async (stageNumber) => {
              const currentStage = activeGameStage
              try {
                await completeStageApi(
                  selectedSkill?.id || 'listening',
                  stageNumber,
                  currentStage?.title || '',
                  100,
                  currentStage?.xp_reward || 75,
                  0,
                  1,
                  currentUser?.email
                )
              } catch (e) {
                console.warn('Stage save warning:', e)
              }
              setStagesProgress((prev) => ({ ...prev, [stageNumber]: true }))
              setLastCompletedStage(currentStage)
              setActiveGameStage(null)
              setShowCelebration(true)
            }}
          />
        ) : (
          /* Standard Quiz Modal for Speaking, Listening, and other skills */
          <div className="game-modal-backdrop" onClick={() => setActiveGameStage(null)}>
            <div className="game-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="game-modal-header">
                <span className="game-stage-pill">
                  Stage {activeGameStage.stage_number} • {activeGameStage.difficulty}
                </span>
                <button className="btn-game-close" onClick={() => setActiveGameStage(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Mascot Dialogue */}
              <div className="game-mascot-dialogue">
                <div className="game-mascot-avatar">{selectedSkill?.guide_avatar || '🦁'}</div>
                <div className="game-mascot-speech">
                  <strong>{selectedSkill?.animal_guide} says:</strong> &quot;Hello young explorer!
                  Look closely, listen to the words, and choose the best answer to clear this stage!&quot;
                </div>
              </div>

              {/* Question prompt */}
              <div className="game-question-box">
                <h3 className="game-question-text">{activeGameStage.task_data.question || 'Choose the correct answer:'}</h3>
                <button
                  className="btn-speak-question"
                  onClick={() => handleSpeakText(activeGameStage.task_data.question || '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    volume_up
                  </span>
                  <span>Listen to Question</span>
                </button>
              </div>

              {/* Options selection */}
              <div className="game-options-grid">
                {(activeGameStage.task_data.options || []).map((opt, idx) => {
                  let statusClass = ''
                  if (selectedOption === idx) {
                    statusClass = answerStatus === 'correct' ? 'correct' : 'wrong'
                  }
                  return (
                    <button
                      key={idx}
                      className={`btn-option-card ${statusClass}`}
                      onClick={() => handleSelectOption(idx)}
                    >
                      <span>{opt}</span>
                      {selectedOption === idx && answerStatus === 'correct' && (
                        <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>
                          check_circle
                        </span>
                      )}
                      {selectedOption === idx && answerStatus === 'wrong' && (
                        <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>
                          cancel
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Hint & Attempts Section */}
              <div className="game-hint-section">
                {!showHint ? (
                  <button
                    className="btn-game-hint"
                    onClick={() => {
                      setShowHint(true)
                      setHintsUsedCount((h) => h + 1)
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      lightbulb
                    </span>
                    <span>Ask {selectedSkill?.animal_guide.split(' ')[0]} for a Hint</span>
                  </button>
                ) : (
                  <div className="game-hint-box">
                    💡 <strong>Hint:</strong> {activeGameStage.task_data.hint}
                  </div>
                )}

                {attemptsCount > 1 && (
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    Attempt #{attemptsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      )}


      {/* ══════════════════════════════════════════════════════════════════
         STEP 4: CELEBRATION MODAL (Reward & Map Progression)
         ══════════════════════════════════════════════════════════════════ */}
      {showCelebration && lastCompletedStage && (
        <div className="celebration-modal-backdrop">
          <div className="celebration-modal-box">
            <div className="celebration-stars-row">
              <span>⭐</span>
              <span>🌟</span>
              <span>⭐</span>
            </div>

            <h2 className="celebration-heading">
              🎉 Stage {lastCompletedStage.stage_number} Conquered!
            </h2>
            <p className="celebration-sub">
              Fantastic work! <strong>{selectedSkill?.animal_guide}</strong> is super proud of your
              effort and focus!
            </p>

            <div className="celebration-reward-pill">
              <span>+{lastCompletedStage.xp_reward} XP Earned</span>
              <span>•</span>
              <span>3 Golden Stars 🏅</span>
            </div>

            <button
              className="btn-continue-map"
              onClick={() => {
                setShowCelebration(false)
                handleSpeakText('Great job! Moving to the next adventure on your map!')
              }}
            >
              <span>Return to Map &amp; Continue Quest</span>
              <span className="material-symbols-outlined">map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
