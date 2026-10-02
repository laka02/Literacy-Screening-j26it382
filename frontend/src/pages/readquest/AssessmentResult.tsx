import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { MascotHoot } from '../../components/readquest/MascotHoot'
import { FluencyScoreGauge } from '../../components/readquest/FluencyScoreGauge'
import { WordAlignmentView } from '../../components/readquest/WordAlignmentView'
import { FluencyProfileReport } from '../../types/fluency'
import { READING_PASSAGES } from '../../data/passages'
import './ReadQuest.css'

export default function AssessmentResult() {
  const navigate = useNavigate()
  const [report, setReport] = useState<FluencyProfileReport | null>(null)
  const [showMLFeatures, setShowMLFeatures] = useState(false)

  useEffect(() => {
    // Retrieve latest report from sessionStorage or fallback to demo report
    const stored = sessionStorage.getItem('current_fluency_report')
    if (stored) {
      try {
        setReport(JSON.parse(stored))
      } catch {
        setReport(null)
      }
    }

    // Play celebration audio message
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Fantastic effort, Leo! You read with great courage and energy. Look at your reading score!')
      u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
  }, [])

  // Default fallback data if navigated directly
  const defaultPassage = READING_PASSAGES[0]
  const metrics = report?.metrics || {
    rfcs: 88,
    fluencyLevel: 'High' as const,
    confidenceBadge: 'High Spirit ⚡',
    wpm: 96,
    wpmScore: 4.5,
    wpmPercent: 86,
    accuracyPercent: 94,
    accuracyScore: 4.8,
    wordErrorRate: 0.06,
    smoothnessScore: 4.2,
    smoothnessPercent: 82,
    pauseCount: 3,
    avgPauseDuration: 0.8,
    totalDuration: 22,
    featureVector: {
      wpm: 96,
      readingAccuracyPercent: 94,
      wordErrorRate: 0.06,
      skipRatePercent: 0,
      pauseCount: 3,
      avgPauseDurationSec: 0.8,
      totalReadingDurationSec: 22
    }
  }

  const wordAlignment = report?.wordAlignment || defaultPassage.content.split(' ').map((word, i) => ({
    id: `w-${i}`,
    word,
    status: (i === 4 ? 'substitution' : 'correct') as any,
    recognizedAs: i === 4 ? 'puppy' : undefined
  }))

  return (
    <div className="rq-app-shell">
      <ReadQuestNavbar
        showSteps
        currentStep="result"
        stars={500}
        missionTitle={report?.passageTitle || 'Max and the Red Ball'}
      />

      <main className="rq-main-layout">
        <section className="rq-content-area" style={{ width: '100%' }}>
          {/* ── Celebration Hero Card (Image 4) ── */}
          <div className="rq-result-celebrate-card">
            <div className="rq-celebrate-header">
              <span className="rq-quest-tag">QUEST ACCOMPLISHED! 🎉</span>
              <button
                className="rq-tool-btn"
                onClick={() => setShowMLFeatures((v) => !v)}
                title="View Machine Learning Feature Vector"
              >
                <span>🤖 {showMLFeatures ? 'Hide ML Features' : 'View ML Features'}</span>
              </button>
            </div>

            <h1 className="rq-celebrate-title">Great Job! 🎊</h1>
            <p className="rq-celebrate-sub">Reading Mission 1 Completed • Super Reader Progress</p>

            {/* Professor Hoot Mascot Speech (Image 4) */}
            <div style={{ marginTop: '16px' }}>
              <MascotHoot
                speech="Fantastic effort, Leo! 🌟 You read with great courage and energy. Look at all the magical stars and treasures you unlocked today!"
                badgeText="SUPER READER REVIEW"
              />
            </div>

            {/* Machine Learning Feature Vector Drawer (for ML integration) */}
            {showMLFeatures && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '20px',
                  marginTop: '18px'
                }}
              >
                <h4 style={{ color: '#0058be', marginBottom: '8px', fontWeight: 800 }}>
                  🤖 ML Feature Vector (Workflow Steps 6 & 8)
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                  Features extracted for Random Forest / XGBoost / Logistic Regression Fluency Level Classifier:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Words Per Min (WPM)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#0058be' }}>{metrics.featureVector.wpm}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Reading Accuracy</span>
                    <strong style={{ fontSize: '1.2rem', color: '#10b981' }}>{metrics.featureVector.readingAccuracyPercent}%</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Word Error Rate (WER)</span>
                    <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{metrics.featureVector.wordErrorRate}</strong>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Pause Count & Avg</span>
                    <strong style={{ fontSize: '1.2rem', color: '#8b5cf6' }}>{metrics.featureVector.pauseCount} ({metrics.featureVector.avgPauseDurationSec}s)</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ── Composite Score Gauge (Image 1 Step 10 & Image 4) ── */}
            <FluencyScoreGauge
              score={metrics.rfcs}
              level={metrics.fluencyLevel}
              confidence={metrics.confidenceBadge}
              wpmPercent={metrics.wpmPercent}
              accuracyPercent={metrics.accuracyPercent}
              smoothnessPercent={metrics.smoothnessPercent}
            />

            {/* ── 3 Key Metric Score Cards (Image 4) ── */}
            <div className="rq-metrics-3cards-grid" style={{ marginTop: '24px' }}>
              {/* Card 1: Reading Speed */}
              <div className="rq-metric-score-card">
                <div className="metric-card-top-row">
                  <div className="metric-icon-box">🚀</div>
                  <span className="metric-type-badge speed">Speed</span>
                </div>
                <h3 className="metric-name-title">Reading Speed</h3>
                <div className="metric-stars-row">
                  <span className="metric-stars-icons">⭐⭐⭐⭐☆</span>
                  <span className="metric-numeric-score">{metrics.wpmScore} / 5</span>
                  <span className="metric-percent-tag">{metrics.wpm} WPM ({metrics.wpmPercent}%)</span>
                </div>
                <div className="metric-feedback-box">
                  "Nice steady pace! Just right for understanding every adventure without feeling rushed."
                </div>
              </div>

              {/* Card 2: Reading Accuracy */}
              <div className="rq-metric-score-card">
                <div className="metric-card-top-row">
                  <div className="metric-icon-box">🎯</div>
                  <span className="metric-type-badge accuracy">Accuracy</span>
                </div>
                <h3 className="metric-name-title">Reading Accuracy</h3>
                <div className="metric-stars-row">
                  <span className="metric-stars-icons">⭐⭐⭐⭐⭐</span>
                  <span className="metric-numeric-score">{metrics.accuracyScore} / 5</span>
                  <span className="metric-percent-tag">{metrics.accuracyPercent}%</span>
                </div>
                <div className="metric-feedback-box">
                  "Super clear words! Pronounced 'Max' and 'garden' so nicely with crisp speech."
                </div>
              </div>

              {/* Card 3: Smooth Reading */}
              <div className="rq-metric-score-card">
                <div className="metric-card-top-row">
                  <div className="metric-icon-box">🌊</div>
                  <span className="metric-type-badge flow">Flow</span>
                </div>
                <h3 className="metric-name-title">Smooth Reading</h3>
                <div className="metric-stars-row">
                  <span className="metric-stars-icons">⭐⭐⭐⭐☆</span>
                  <span className="metric-numeric-score">{metrics.smoothnessScore} / 5</span>
                  <span className="metric-percent-tag">{metrics.smoothnessPercent}%</span>
                </div>
                <div className="metric-feedback-box">
                  "Great flow! Pauses were natural, thoughtful, and very calm throughout the sentences."
                </div>
              </div>
            </div>

            {/* ── Unlocked Rewards Row (Image 4) ── */}
            <div className="rq-rewards-row-card" style={{ marginTop: '24px' }}>
              <div className="reward-item-box">
                <div className="reward-icon-circle gold">⭐</div>
                <div className="reward-info-text">
                  <span className="reward-info-lbl">STARS EARNED TODAY</span>
                  <span className="reward-info-title">+50 Golden Stars!</span>
                </div>
              </div>

              <div className="reward-item-box">
                <div className="reward-icon-circle emerald">🏅</div>
                <div className="reward-info-text">
                  <span className="reward-info-lbl">SPECIAL BADGE UNLOCKED</span>
                  <span className="reward-info-title">Jungle Word Scout</span>
                </div>
              </div>

              <div className="reward-item-box">
                <div className="reward-icon-circle rose">🔥</div>
                <div className="reward-info-text">
                  <span className="reward-info-lbl">SUPER READER STREAK</span>
                  <span className="reward-info-title">4 Days Streak!</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Word-Level Reference Alignment View (Workflow Step 5A) ── */}
          <WordAlignmentView words={wordAlignment} />

          {/* ── Result Action Bar (Image 4) ── */}
          <div className="rq-result-bottom-bar">
            <div className="rq-action-group-left">
              <button
                className="rq-btn-secondary"
                onClick={() => navigate('/readquest/mission/' + (report?.passageId || defaultPassage.id))}
              >
                <span>🔄 Practice Story Again</span>
              </button>

              <button
                className="rq-tool-btn"
                onClick={() => navigate('/readquest/progress')}
              >
                <span>🌱 My Progress Garden</span>
              </button>
            </div>

            <div className="rq-action-group-right">
              <button
                className="rq-btn-primary"
                onClick={() => navigate('/readquest')}
              >
                <span>Continue Learning 🚀</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
