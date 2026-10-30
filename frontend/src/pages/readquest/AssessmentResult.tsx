import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { FluencyScoreGauge } from '../../components/readquest/FluencyScoreGauge'
import { WordAlignmentView } from '../../components/readquest/WordAlignmentView'
import { ParentViewModal } from '../../components/readquest/ParentViewModal'
import { FluencyProfileReport } from '../../types/fluency'
import './ReadQuest.css'

export default function AssessmentResult() {
  const navigate = useNavigate()
  const [report, setReport] = useState<FluencyProfileReport | null>(null)
  const [showParentModal, setShowParentModal] = useState(false)

  // Retrieve report from sessionStorage - NO auto-play audio!
  useEffect(() => {
    const stored = sessionStorage.getItem('current_fluency_report')
    if (stored) {
      try {
        setReport(JSON.parse(stored))
      } catch {
        setReport(null)
      }
    }
  }, [])

  // If no real report exists, show an error — never display fake scores
  if (!report) {
    return (
      <div className="rq-app-shell jungle-theme">
        <ReadQuestNavbar
          showSteps
          currentStep="result"
          stars={0}
          missionTitle="Assessment"
          progressPercent={0}
        />
        <main className="rq-game-container">
          <div className="reading-game-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '3rem' }}>⚠️</p>
            <h2 style={{ color: '#e57373', marginBottom: 12 }}>No Assessment Data Found</h2>
            <p style={{ color: '#bbb', marginBottom: 24 }}>
              It looks like no completed reading assessment was found. Please go back, record
              your reading, and submit it to see your score.
            </p>
            <button
              className="btn-tactile-blue-large"
              onClick={() => navigate('/readquest')}
            >
              ← Back to Story Selection
            </button>
          </div>
        </main>
      </div>
    )
  }

  // report is guaranteed non-null here (early return above handles null)
  const metrics      = report.metrics
  const wordAlignment = report.wordAlignment

  const playCelebrationVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance('Fantastic reading, Leo! You earned 50 shiny stars today!')
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
  }

  return (
    <div className="rq-app-shell jungle-theme">
      <ReadQuestNavbar
        showSteps
        currentStep="result"
        stars={500}
        missionTitle={report.passageTitle}
        progressPercent={100}
      />

      <main className="rq-game-container">
        {/* Main Floating Glass Celebration Card */}
        <div className="reading-game-card">
          {/* Header Row */}
          <div className="result-celebration-header">
            <div className="celebration-left">
              <span className="quest-done-tag">QUEST ACCOMPLISHED! 🎊</span>
              <h1 className="celebration-title">Great Reading, Leo! 🌟</h1>
            </div>

            <div className="celebration-right-actions">
              <button
                className="btn-hear-cheer"
                onClick={playCelebrationVoice}
                title="Tap to hear cheer"
              >
                <span>🔊 Hear Cheer</span>
              </button>

              <button
                className="btn-parent-dashboard-pill"
                onClick={() => setShowParentModal(true)}
              >
                <span>👨‍👩‍👧 Parent View (WPM & Stats)</span>
              </button>
            </div>
          </div>

          {/* Center Mascot & Score Gauge Grid */}
          <div className="result-top-showcase-grid">
            {/* Mascot Trophy Display */}
            <div className="result-mascot-box">
              <img src="/lion-mascot.png" alt="Leo Explorer" className="result-mascot-img" />
              <div className="trophy-banner">
                <span className="trophy-emoji">🏆</span>
                <span className="trophy-text">{metrics.fluencyLevel} Fluency Reader</span>
              </div>
            </div>

            {/* Circular Speedometer Gauge */}
            <div className="result-gauge-box">
              <FluencyScoreGauge
                score={metrics.rfcs}
                level={metrics.fluencyLevel}
                confidence={metrics.confidenceBadge}
                wpmPercent={metrics.wpmPercent}
                accuracyPercent={metrics.accuracyPercent}
                smoothnessPercent={metrics.smoothnessPercent}
              />
            </div>
          </div>

          {/* 3 Simple Kid-Friendly Score Cards (Dynamic from ML Feature Extraction) */}
          <div className="result-3cards-row">
            <div className="result-score-chip speed">
              <span className="chip-icon">🚀</span>
              <div className="chip-meta">
                <span className="chip-label">Reading Speed</span>
                <strong className="chip-val">{metrics.wpm} Words / Min</strong>
                <span className="chip-rating">
                  {metrics.wpm >= 80 ? '⭐⭐⭐⭐⭐ High Speed' : metrics.wpm >= 50 ? '⭐⭐⭐⭐☆ Moderate Pace' : '⭐⭐⭐☆☆ Steady Pace'}
                </span>
              </div>
            </div>

            <div className="result-score-chip accuracy">
              <span className="chip-icon">🎯</span>
              <div className="chip-meta">
                <span className="chip-label">Word Accuracy</span>
                <strong className="chip-val">{metrics.accuracyPercent}% Clear</strong>
                <span className="chip-rating">
                  {metrics.accuracyPercent >= 90 ? '⭐⭐⭐⭐⭐ High Accuracy' : metrics.accuracyPercent >= 75 ? '⭐⭐⭐⭐☆ Good Accuracy' : '⭐⭐⭐☆☆ Needs Practice'}
                </span>
              </div>
            </div>

            <div className="result-score-chip flow">
              <span className="chip-icon">🌊</span>
              <div className="chip-meta">
                <span className="chip-label">Pause Control</span>
                <strong className="chip-val">{metrics.smoothnessPercent}% Score</strong>
                <span className="chip-rating">
                  {metrics.smoothnessPercent >= 80 ? '⭐⭐⭐⭐⭐ Natural Pauses' : metrics.smoothnessPercent >= 60 ? '⭐⭐⭐⭐☆ Occasional Pauses' : '⭐⭐⭐☆☆ Frequent Pauses'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Word Feedback */}
          <div className="result-words-section">
            <WordAlignmentView words={wordAlignment} accuracyPercent={metrics.accuracyPercent} />
          </div>

          {/* Bottom Action Bar */}
          <div className="result-bottom-action-bar">
            <button
              className="btn-tactile-secondary"
              onClick={() => navigate('/readquest/mission/' + report.passageId)}
            >
              <span>🔄 Read Again</span>
            </button>

            <button
              className="btn-tactile-blue-large"
              onClick={() => navigate('/readquest')}
            >
              <span>Explore Next Story 🚀 →</span>
            </button>
          </div>
        </div>
      </main>

      {/* Parent View Modal */}
      <ParentViewModal
        isOpen={showParentModal}
        onClose={() => setShowParentModal(false)}
        metrics={metrics}
        passageTitle={report.passageTitle}
      />
    </div>
  )
}
