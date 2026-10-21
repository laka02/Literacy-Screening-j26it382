import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ParentViewModal } from './ParentViewModal'

interface ReadQuestNavbarProps {
  currentStep?: 'intro' | 'reading' | 'result'
  stars?: number
  showSteps?: boolean
  missionTitle?: string
  progressPercent?: number
}

export const ReadQuestNavbar: React.FC<ReadQuestNavbarProps> = ({
  currentStep,
  stars = 450,
  showSteps = false,
  missionTitle = 'Reading Adventure',
  progressPercent = 65
}) => {
  const navigate = useNavigate()
  const [showParentModal, setShowParentModal] = useState(false)

  return (
    <>
      <header className="rq-navbar glassmorphic-nav">
        {/* Left: Back Button & Title */}
        <div className="rq-navbar-left">
          {showSteps ? (
            <button
              className="rq-nav-back-circle-btn"
              onClick={() => navigate('/readquest')}
              title="Back to Story Quests"
              aria-label="Back to Story Quests"
            >
              ←
            </button>
          ) : (
            <button
              className="rq-nav-back-circle-btn"
              onClick={() => navigate('/home')}
              title="Return to Main Portal"
              aria-label="Main Portal"
            >
              🏠
            </button>
          )}

          <div className="rq-brand-group" onClick={() => navigate('/readquest')} title="ReadQuest Home">
            <h1 className="rq-brand-title">ReadQuest</h1>
            <span className="rq-grade-badge">Grade 3-5</span>
          </div>

          {showSteps && (
            <div className="rq-mission-pill-glass">
              <span className="pill-dot" />
              <span className="pill-text">{missionTitle}</span>
            </div>
          )}
        </div>

        {/* Center: Clean Progress Tracker matching Reference Image */}
        {showSteps && (
          <div className="rq-center-progress-bar-wrap">
            <div className="progress-labels-row">
              <span className="progress-step-text">
                {currentStep === 'intro' ? 'Step 1: Get Ready' : currentStep === 'reading' ? 'Step 2: Read Aloud 🎙️' : 'Step 3: Great Job! ⭐'}
              </span>
              <span className="progress-num-text">{progressPercent}%</span>
            </div>
            <div className="progress-track-cyan">
              <div
                className="progress-fill-cyan"
                style={{ width: `${currentStep === 'intro' ? 35 : currentStep === 'reading' ? 70 : 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Right: Parent View Button + Glowing Star Badge */}
        <div className="rq-navbar-right">
          {/* Dedicated Parent View Button */}
          <button
            className="rq-parent-view-btn"
            onClick={() => setShowParentModal(true)}
            title="View WPM, Accuracy & Parent Report"
          >
            <span>👨‍👩‍👧 Parent View</span>
          </button>

          {/* Quick Star Garden link */}
          <button
            className="rq-icon-link-btn"
            onClick={() => navigate('/readquest/progress')}
            title="Star Garden & Badges"
          >
            <span>🌱</span>
          </button>

          {/* Golden Star Circle Badge (matching reference top-right circle) */}
          <div
            className="rq-golden-star-badge"
            onClick={() => navigate('/readquest/progress')}
            title="Total Stars Collected"
          >
            <span className="star-icon">⭐</span>
            <span className="star-number">{stars}</span>
          </div>
        </div>
      </header>

      {/* Parent & Teacher View Modal */}
      <ParentViewModal
        isOpen={showParentModal}
        onClose={() => setShowParentModal(false)}
        passageTitle={missionTitle}
      />
    </>
  )
}
