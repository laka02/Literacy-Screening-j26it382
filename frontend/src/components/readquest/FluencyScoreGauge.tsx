import React from 'react'
import { FluencyLevel } from '../../types/fluency'

interface FluencyScoreGaugeProps {
  score: number           // 0 - 100%
  level: FluencyLevel
  confidence: string
  wpmPercent: number
  accuracyPercent: number
  smoothnessPercent: number
}

export const FluencyScoreGauge: React.FC<FluencyScoreGaugeProps> = ({
  score,
  level,
  confidence,
  wpmPercent,
  accuracyPercent,
  smoothnessPercent
}) => {
  // SVG circular arc calculations
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  let levelColor = '#10b981'
  let levelBg = '#d1fae5'
  let levelText = 'HIGH FLUENCY • ON TRACK'

  if (level === 'Medium') {
    levelColor = '#0284c7'
    levelBg = '#e0f2fe'
    levelText = 'MEDIUM FLUENCY • STEADY GROWER'
  } else if (level === 'Low') {
    levelColor = '#f59e0b'
    levelBg = '#fef3c7'
    levelText = 'SUPPORT NEEDED • KEEP PRACTICING'
  }

  return (
    <div className="score-gauge-card">
      <div className="gauge-top-row">
        <div className="gauge-title-group">
          <span className="gauge-eyebrow">YOUR READING FLUENCY</span>
          <h2 className="gauge-headline">{levelText}</h2>
          <p className="gauge-subdesc">
            You are making wonderful progress! Keep practicing to become an even faster and smoother story explorer.
          </p>
        </div>

        <div className="confidence-pill" style={{ borderColor: levelColor }}>
          <span className="confidence-label">Today's Confidence</span>
          <strong className="confidence-val">{confidence}</strong>
        </div>
      </div>

      <div className="gauge-visual-row">
        {/* Semi-circular Circular SVG Progress Gauge */}
        <div className="circular-gauge-wrapper">
          <svg className="gauge-svg" width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0058be" />
                <stop offset="60%" stopColor="#0284c7" />
                <stop offset="100%" stopColor={levelColor} />
              </linearGradient>
            </defs>
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="gauge-bg-circle"
              stroke="#e2e8f0"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Foreground progress ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="gauge-progress-circle"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </svg>

          <div className="gauge-center-content">
            <span className="gauge-score-number">{score}%</span>
            <span className="gauge-score-label">RFCS Score</span>
            <span className="gauge-fraction">({score} / 100)</span>
          </div>
        </div>

        {/* Breakdown Percentage Bars (Speed, Accuracy, Smoothness) */}
        <div className="gauge-breakdown-col">
          <div className="breakdown-bar-item">
            <div className="bar-label-row">
              <span className="bar-name">🎯 Reading Accuracy</span>
              <strong className="bar-percentage">{accuracyPercent}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill accuracy"
                style={{ width: `${accuracyPercent}%`, backgroundColor: '#10b981' }}
              />
            </div>
          </div>

          <div className="breakdown-bar-item">
            <div className="bar-label-row">
              <span className="bar-name">🚀 Reading Speed (WPM)</span>
              <strong className="bar-percentage">{wpmPercent}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill speed"
                style={{ width: `${wpmPercent}%`, backgroundColor: '#0284c7' }}
              />
            </div>
          </div>

          <div className="breakdown-bar-item">
            <div className="bar-label-row">
              <span className="bar-name">🌊 Smoothness & Flow</span>
              <strong className="bar-percentage">{smoothnessPercent}%</strong>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill flow"
                style={{ width: `${smoothnessPercent}%`, backgroundColor: '#8b5cf6' }}
              />
            </div>
          </div>

          <div className="rfcs-rubric-badge" style={{ backgroundColor: levelBg, color: levelColor }}>
            <span>Predicted Level: <strong>{level} Fluency ({score}%)</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
