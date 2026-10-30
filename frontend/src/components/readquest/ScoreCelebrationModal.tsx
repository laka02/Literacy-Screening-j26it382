import React from 'react'
import { FluencyProfileReport } from '../../types/fluency'

interface ScoreCelebrationModalProps {
  isOpen: boolean
  report: FluencyProfileReport | null
  onViewFullReport: () => void
  onTryAgain: () => void
}

export const ScoreCelebrationModal: React.FC<ScoreCelebrationModalProps> = ({
  isOpen,
  report,
  onViewFullReport,
  onTryAgain,
}) => {
  if (!isOpen || !report) return null

  const rfcs = Math.round(report.metrics.rfcs)
  const level = report.metrics.fluencyLevel
  const wcpm = report.metrics.featureVector?.wcpm ?? report.metrics.wpm
  const accuracy = Math.round(report.metrics.accuracyPercent)

  // Badge visual theme according to level
  const levelTheme =
    level === 'High'
      ? { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Super Star Explorer! 🚀', icon: '🌟' }
      : level === 'Medium'
      ? { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Great Explorer! 🦁', icon: '⭐' }
      : { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Rising Explorer! 🌱', icon: '🌱' }

  return (
    <div className="celebration-modal-overlay">
      <div className="celebration-modal-card bounce-in">
        {/* Floating Confetti / Sparkle Decor */}
        <div className="celebration-sparkles">
          <span>✨</span>
          <span>🎉</span>
          <span>⭐</span>
          <span>🎈</span>
        </div>

        {/* Mascot / Mail Badge Header */}
        <div className="celebration-icon-bubble">
          <div className="celebration-mail-badge">
            <span className="mail-icon">💌</span>
            <span className="mail-check-badge">✓</span>
          </div>
          <img src="/lion-mascot.png" alt="Leo Explorer" className="celebration-mascot-avatar" />
        </div>

        {/* Main Title & Congrats */}
        <div className="celebration-header-text">
          <span className="celebration-tag-pill" style={{ color: levelTheme.color, background: levelTheme.bg }}>
            {levelTheme.icon} {levelTheme.label}
          </span>
          <h2 className="celebration-title">Reading Score Ready! 🎉</h2>
          <p className="celebration-subtitle">
            Awesome reading, <strong>{report.studentName || 'Young Explorer'}</strong>! CAIRE has analyzed your voice magic!
          </p>
        </div>

        {/* Big Colorful Score Display */}
        <div className="celebration-score-container">
          <div className="celebration-score-circle">
            <span className="score-num">{rfcs}</span>
            <span className="score-unit">/100</span>
            <span className="score-label">Fluency Score</span>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="celebration-metrics-row">
          <div className="celebration-stat-box">
            <span className="stat-icon">🎯</span>
            <span className="stat-val">{accuracy}%</span>
            <span className="stat-desc">Accuracy</span>
          </div>

          <div className="celebration-stat-box">
            <span className="stat-icon">⚡</span>
            <span className="stat-val">{wcpm}</span>
            <span className="stat-desc">Words / Min</span>
          </div>

          <div className="celebration-stat-box">
            <span className="stat-icon">🏆</span>
            <span className="stat-val">+{report.starsEarned || 50}</span>
            <span className="stat-desc">Stars Won</span>
          </div>
        </div>

        {/* Friendly AI Encouragement Note */}
        {report.strengths && report.strengths.length > 0 && (
          <div className="celebration-encouragement-card">
            <span className="encouragement-sparkle">💬</span>
            <p className="encouragement-text">
              "{report.strengths[0]}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="celebration-action-buttons">
          <button className="btn-celebration-secondary" onClick={onTryAgain}>
            <span>🔄 Read Again</span>
          </button>

          <button className="btn-celebration-primary" onClick={onViewFullReport}>
            <span>View Full Magic Report 📊 →</span>
          </button>
        </div>
      </div>
    </div>
  )
}
