import React from 'react'

interface MissionCompletedModalProps {
  isOpen: boolean
  durationSeconds: number
  wordCount: number
  onViewScore: () => void
  onTryAgain: () => void
  isSubmitting?: boolean
}

export const MissionCompletedModal: React.FC<MissionCompletedModalProps> = ({
  isOpen,
  durationSeconds,
  wordCount,
  onViewScore,
  onTryAgain,
  isSubmitting = false
}) => {
  if (!isOpen) return null

  return (
    <div className="completed-modal-overlay">
      <div className="completed-modal-card bounce-in">
        {/* Festive Mascot Badge */}
        <div className="completed-mascot-wrap">
          <img src="/lion-mascot.png" alt="Leo Explorer" className="completed-mascot-img" />
          <span className="completed-trophy-badge">🏆</span>
        </div>

        {/* Headline */}
        <h2 className="completed-headline">Reading Completed! 🎉</h2>
        <p className="completed-subtext">
          Awesome effort! You read all <strong>{wordCount} words</strong> with great confidence!
        </p>

        {/* Quick Stats Pill Row */}
        <div className="completed-stats-strip">
          <div className="completed-stat-pill">
            <span className="icon">⏱️</span>
            <span><strong>{durationSeconds}</strong> seconds</span>
          </div>
          <div className="completed-stat-pill">
            <span className="icon">⭐</span>
            <span><strong>+50</strong> Stars Earned</span>
          </div>
          <div className="completed-stat-pill">
            <span className="icon">🦁</span>
            <span><strong>Voice Saved</strong></span>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="completed-action-row">
          <button
            className="btn-completed-try-again"
            onClick={onTryAgain}
            disabled={isSubmitting}
          >
            <span>🔄 Read Again</span>
          </button>

          <button
            className="btn-completed-view-score"
            onClick={onViewScore}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Checking Voice Magic... ⏳' : 'Check My Reading Score 🚀 →'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
