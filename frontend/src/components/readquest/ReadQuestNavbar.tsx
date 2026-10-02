import React from 'react'
import { useNavigate } from 'react-router-dom'

interface ReadQuestNavbarProps {
  currentStep?: 'intro' | 'reading' | 'result'
  stars?: number
  showSteps?: boolean
  missionTitle?: string
}

export const ReadQuestNavbar: React.FC<ReadQuestNavbarProps> = ({
  currentStep,
  stars = 450,
  showSteps = false,
  missionTitle = 'Reading Mission 1'
}) => {
  const navigate = useNavigate()
  const [soundEnabled, setSoundEnabled] = React.useState(true)

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev)
    if ('speechSynthesis' in window) {
      if (soundEnabled) {
        window.speechSynthesis.cancel()
      } else {
        const u = new SpeechSynthesisUtterance('Audio guide enabled!')
        u.rate = 1
        window.speechSynthesis.speak(u)
      }
    }
  }

  return (
    <header className="rq-navbar">
      <div className="rq-navbar-left">
        {showSteps && (
          <button className="rq-nav-back-btn" onClick={() => navigate('/readquest')} title="Back to Adventures">
            ←
          </button>
        )}

        <div className="rq-brand-group" onClick={() => navigate('/readquest')}>
          <div className="rq-logo-icon">📖</div>
          <div className="rq-brand-meta">
            <div className="rq-brand-row">
              <span className="rq-brand-title">ReadQuest</span>
              <span className="rq-grade-badge">GRADE 3-5</span>
            </div>
            <span className="rq-brand-sub">My Reading Adventure • CAIRE English</span>
          </div>
        </div>

        {showSteps && (
          <div className="rq-mission-pill">
            <span className="rq-pill-icon">🌴</span>
            <span>{missionTitle}</span>
          </div>
        )}
      </div>

      {showSteps && (
        <div className="rq-step-tracker">
          <div className={`rq-step-item ${currentStep === 'intro' ? 'active' : 'completed'}`}>
            <span className="rq-step-num">1</span>
            <span className="rq-step-label">Story Intro</span>
          </div>
          <div className="rq-step-divider" />
          <div className={`rq-step-item ${currentStep === 'reading' ? 'active' : currentStep === 'result' ? 'completed' : ''}`}>
            <span className="rq-step-num">2</span>
            <span className="rq-step-label">Voice Magic</span>
          </div>
          <div className="rq-step-divider" />
          <div className={`rq-step-item ${currentStep === 'result' ? 'active' : ''}`}>
            <span className="rq-step-num">3</span>
            <span className="rq-step-label">Star Result</span>
          </div>
        </div>
      )}

      <div className="rq-navbar-right">
        <div className="rq-star-counter">
          <span className="rq-star-icon">⭐</span>
          <span className="rq-star-val">{stars} Stars</span>
        </div>

        <button
          className={`rq-icon-btn ${soundEnabled ? 'active' : ''}`}
          onClick={toggleSound}
          title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        <button className="rq-icon-btn" onClick={() => navigate('/home')} title="Return to Portal">
          🏠
        </button>

        <div className="rq-user-avatar" onClick={() => navigate('/readquest/progress')} title="My Profile & Progress">
          <span className="rq-avatar-emoji">🦁</span>
          <div className="rq-user-text">
            <span className="rq-user-name">Leo Explorer</span>
            <span className="rq-user-lvl">Level 4 Reader</span>
          </div>
        </div>
      </div>
    </header>
  )
}
