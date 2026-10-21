import React, { useEffect, useState } from 'react'
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
import './PersonalPlan.css'

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
    id: 'speaking',
    name: 'Speaking',
    animal_guide: 'Oliver the Owl',
    guide_avatar: '🦉',
    icon: 'record_voice_over',
    color: '#ea580c',
    current_score: 76,
    performance_band: 'medium',
    tagline: 'Echo voice challenge, phoneme clarity & natural sentence pacing!',
    rules_applied: ['R02', 'R05', 'R10', 'R23'],
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

            {/* Interactive 3-Stage Adventure Map */}
            <div className="adventure-map-container">
              <div className="map-island-bg" />

              {/* Landscape markers */}
              <span className="map-landmark-icon landmark-tree-1">🌴</span>
              <span className="map-landmark-icon landmark-river">🌊</span>
              <span className="map-landmark-icon landmark-castle">🏰</span>
              <span className="map-landmark-icon landmark-mountain">⛰️</span>

              <div className="map-stages-connector-line" />

              <div className="map-stages-path">
                {activePlan.stages.map((stage, idx) => {
                  const isCompleted = stagesProgress[stage.stage_number]
                  // Stage 1 unlocked by default; Stage 2 unlocked if stage 1 done; Stage 3 unlocked if stage 2 done
                  const isUnlocked =
                    stage.stage_number === 1 || stagesProgress[stage.stage_number - 1]

                  const diffClass =
                    idx === 0 ? 'stage-diff-easy' : idx === 1 ? 'stage-diff-med' : 'stage-diff-hard'

                  return (
                    <div
                      key={stage.stage_number}
                      className={`stage-node-card ${isCompleted ? 'completed' : ''} ${
                        isUnlocked && !isCompleted ? 'active' : ''
                      } ${!isUnlocked ? 'locked' : ''}`}
                    >
                      <div
                        className={`stage-pin-badge ${isCompleted ? 'completed' : ''} ${
                          !isUnlocked ? 'locked' : ''
                        }`}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined">check_circle</span>
                        ) : !isUnlocked ? (
                          <span className="material-symbols-outlined">lock</span>
                        ) : (
                          <span>{idx === 0 ? '🌱' : idx === 1 ? '🛶' : '⭐'}</span>
                        )}
                      </div>

                      <span className="stage-number-tag">Stage {stage.stage_number}</span>
                      <h4 className="stage-node-title">{stage.title}</h4>

                      <span className={`stage-difficulty-tag ${diffClass}`}>
                        {stage.difficulty}
                      </span>

                      <p className="stage-node-desc">{stage.description}</p>

                      <div className="stage-rewards-strip">
                        <span>+{stage.xp_reward} XP</span>
                        <span>•</span>
                        <span>⭐⭐⭐</span>
                      </div>

                      <button
                        className={`btn-play-stage ${isCompleted ? 'replay' : ''}`}
                        disabled={!isUnlocked}
                        onClick={() => handleOpenGame(stage)}
                      >
                        {isCompleted ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              refresh
                            </span>
                            <span>Play Again</span>
                          </>
                        ) : !isUnlocked ? (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              lock
                            </span>
                            <span>Complete Stage {stage.stage_number - 1} First</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                              play_arrow
                            </span>
                            <span>Start Stage {stage.stage_number}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Expert Guidance & Rules Inspector Card */}
            <div className="rules-applied-card">
              <div className="rules-card-header">
                <h3 className="rules-card-title">
                  <span className="material-symbols-outlined" style={{ color: '#0058be' }}>
                    policy
                  </span>
                  <span>Expert Rules Applied to this Roadmap</span>
                </h3>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                  CAIRE Adaptive Rule Engine (R01–R40)
                </span>
              </div>

              <div className="rules-chips-list">
                {activePlan.rules_manifest.map((r) => (
                  <div key={r.code} className="rule-chip-item" title={r.description}>
                    <span className="rule-code-tag">{r.code}</span>
                    <span>{r.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
         STEP 3: PLAYABLE MINI-GAME MODAL
         ══════════════════════════════════════════════════════════════════ */}
      {activeGameStage && (
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
              <h3 className="game-question-text">{activeGameStage.task_data.question}</h3>
              <button
                className="btn-speak-question"
                onClick={() => handleSpeakText(activeGameStage.task_data.question)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  volume_up
                </span>
                <span>Listen to Question</span>
              </button>
            </div>

            {/* Options selection */}
            <div className="game-options-grid">
              {activeGameStage.task_data.options.map((opt, idx) => {
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
                  <span>Ask {selectedSkill?.animal_guide.split(' ')[0]} for a Hint (Rule R18, R22)</span>
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
