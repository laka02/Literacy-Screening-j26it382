import React from 'react'
import { FluencyMetrics } from '../../types/fluency'

interface ParentViewModalProps {
  isOpen: boolean
  onClose: () => void
  metrics?: FluencyMetrics
  studentName?: string
  passageTitle?: string
}

export const ParentViewModal: React.FC<ParentViewModalProps> = ({
  isOpen,
  onClose,
  metrics,
  studentName = 'Leo Explorer',
  passageTitle = 'My Family & Garden'
}) => {
  if (!isOpen) return null

  const m = metrics || {
    rfcs: 88,
    fluencyLevel: 'High',
    confidenceBadge: 'Super Reader ⚡',
    wpm: 96,
    wpmScore: 4.8,
    wpmPercent: 88,
    accuracyPercent: 94,
    accuracyScore: 4.7,
    wordErrorRate: 0.06,
    smoothnessScore: 4.4,
    smoothnessPercent: 84,
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

  return (
    <div className="parent-modal-overlay" onClick={onClose}>
      <div className="parent-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="parent-modal-header">
          <div className="header-left">
            <span className="parent-tag">👨‍👩‍👧 PARENT & TEACHER DASHBOARD</span>
            <h2 className="parent-title">{studentName}'s Reading Report</h2>
            <span className="parent-sub">Story: {passageTitle} • Grade 3-5 Screening</span>
          </div>
          <button className="parent-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="parent-summary-banner">
          <div className="summary-score-col">
            <span className="score-num">{m.rfcs}%</span>
            <span className="score-lbl">Composite Fluency</span>
          </div>
          <div className="summary-desc-col">
            <strong className="level-badge">{m.fluencyLevel} Reading Fluency • On Track! 🌟</strong>
            <p className="summary-text">
              {studentName} is reading smoothly at grade level with strong vocabulary comprehension and clear speech rhythm.
            </p>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="parent-metrics-grid">
          {/* 1. WPM */}
          <div className="parent-stat-card">
            <div className="stat-top">
              <span className="stat-icon">🚀</span>
              <span className="stat-label">Reading Speed (WPM)</span>
            </div>
            <strong className="stat-val">{m.wpm} <span className="unit">words/min</span></strong>
            <span className="stat-bench">Grade 3-5 Target: 70 - 100 WPM (Great!)</span>
          </div>

          {/* 2. Accuracy */}
          <div className="parent-stat-card">
            <div className="stat-top">
              <span className="stat-icon">🎯</span>
              <span className="stat-label">Reading Accuracy</span>
            </div>
            <strong className="stat-val">{m.accuracyPercent}% <span className="unit">clear</span></strong>
            <span className="stat-bench">Word Error Rate (WER): {m.wordErrorRate}</span>
          </div>

          {/* 3. Smoothness & Pauses */}
          <div className="parent-stat-card">
            <div className="stat-top">
              <span className="stat-icon">🌊</span>
              <span className="stat-label">Pauses & Flow</span>
            </div>
            <strong className="stat-val">{m.pauseCount} <span className="unit">pauses</span></strong>
            <span className="stat-bench">Avg Pause: {m.avgPauseDuration}s (Natural breathing)</span>
          </div>

          {/* 4. Total Duration */}
          <div className="parent-stat-card">
            <div className="stat-top">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Speaking Duration</span>
            </div>
            <strong className="stat-val">{m.totalDuration}s <span className="unit">total</span></strong>
            <span className="stat-bench">Completed within recommended window</span>
          </div>
        </div>

        {/* Parent Home Recommendation */}
        <div className="parent-advice-box">
          <h4 className="advice-title">💡 Home Practice Tip for Parents:</h4>
          <p className="advice-text">
            Continue encouraging {studentName} to read bedtime stories aloud for 5 minutes daily.
            Focus on expressive character voices to further enhance reading flow and pitch variation.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="parent-modal-footer">
          <button className="parent-btn-done" onClick={onClose}>
            Done & Back to Quest ✨
          </button>
        </div>
      </div>
    </div>
  )
}
