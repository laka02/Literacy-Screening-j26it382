import React, { useState } from 'react'
import { AlignedWord } from '../../types/fluency'

interface WordAlignmentViewProps {
  words: AlignedWord[]
  accuracyPercent?: number
  onWordClick?: (word: string) => void
}

export const WordAlignmentView: React.FC<WordAlignmentViewProps> = ({
  words,
  accuracyPercent: propAccuracyPercent,
  onWordClick,
}) => {
  const [showTechDetails, setShowTechDetails] = useState(false)

  const handleWordSpeak = (word: string) => {
    if (onWordClick) {
      onWordClick(word)
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const clean = word.replace(/[^a-zA-Z]/g, '')
      const u = new SpeechSynthesisUtterance(clean || word)
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  const correctCount = words.filter((w) => w.status === 'correct').length
  const subCount = words.filter((w) => w.status === 'substitution').length
  const skipCount = words.filter((w) => w.status === 'skipped' || (w.status as string) === 'deletion').length
  const readingErrorCount = subCount + skipCount
  // Use backend accuracyPercent if provided (hits / N), otherwise fall back to local count
  const accuracyPercent =
    propAccuracyPercent !== undefined
      ? Math.round(propAccuracyPercent)
      : Math.round((correctCount / Math.max(words.length, 1)) * 100)

  return (
    <div className="word-alignment-container">
      {/* Friendly Child-Centric Header */}
      <div className="alignment-header">
        <div className="alignment-header-left">
          <div className="alignment-header-badge">📖 WORD FEEDBACK</div>
          <h3 className="alignment-title">How You Read Each Word ✨</h3>
          <p className="alignment-subtitle">
            Tap any word to hear how it sounds! Green words were read correctly. Red words highlight reading errors (substituted or omitted words) to practice.
          </p>
        </div>

        <div className="alignment-header-right">
          <div className="alignment-quick-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-text">{accuracyPercent}% Words Matched</span>
          </div>
        </div>
      </div>

      {/* Interactive Word Badges Grid */}
      <div className="alignment-word-grid">
        {words.map((item) => {
          let statusClass = 'status-correct'
          let tooltip = 'Correctly read! 🌟'

          if (item.status === 'substitution') {
            statusClass = 'status-substitution'
            tooltip = item.recognizedAs
              ? `Reading Error: Substituted with "${item.recognizedAs}" • Tap to listen!`
              : 'Reading Error: Substituted word • Tap to listen!'
          } else if (item.status === 'skipped' || (item.status as string) === 'deletion') {
            statusClass = 'status-skipped'
            tooltip = 'Reading Error: Omitted word • Tap to hear pronunciation'
          } else if (item.status === 'insertion') {
            statusClass = 'status-insertion'
            tooltip = 'Extra word spoken'
          }

          return (
            <button
              key={item.id}
              type="button"
              className={`aligned-word-badge ${statusClass}`}
              onClick={() => handleWordSpeak(item.word)}
              title={`${tooltip} (Click to listen)`}
              aria-label={`Word ${item.word}, status: ${item.status}`}
            >
              <span className="badge-word-text">{item.word}</span>
              {item.status === 'substitution' && item.recognizedAs && (
                <span className="sub-hint">🗣️ {item.recognizedAs}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Kid-Friendly Color Legend */}
      <div className="alignment-legend-row">
        <div className="legend-item">
          <span className="legend-dot correct" />
          <span className="legend-lbl"><strong>Correct Words</strong> ({correctCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot reading-error" />
          <span className="legend-lbl"><strong>Reading Errors</strong> ({readingErrorCount})</span>
        </div>
        <div className="legend-sub-breakdown">
          <span className="legend-sub-item">Substituted: {subCount}</span>
          <span className="legend-sub-item">Omitted: {skipCount}</span>
        </div>
        <div className="legend-tip">
          <span>💡 <strong>Tip:</strong> Tap any word above to hear the correct sound.</span>
        </div>
      </div>

      {/* Optional Technical Details (For Teacher / Supervisor) */}
      <div className="alignment-teacher-toggle-box">
        <button
          type="button"
          className="teacher-expand-btn"
          onClick={() => setShowTechDetails(!showTechDetails)}
        >
          <span>{showTechDetails ? '▲ Hide Researcher / ASR Alignment Details' : '🔬 View Researcher & ASR Alignment Details (Whisper + Levenshtein)'}</span>
        </button>

        {showTechDetails && (
          <div className="alignment-tech-drawer">
            <div className="tech-meta-grid">
              <div className="tech-meta-card">
                <span className="tech-label">ASR Model</span>
                <span className="tech-value">OpenAI Whisper</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">Text Alignment</span>
                <span className="tech-value">Levenshtein Edit Distance (WER)</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">Total Reference Words</span>
                <span className="tech-value">{words.length} Words</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">Word Match Rate</span>
                <span className="tech-value">{accuracyPercent}%</span>
              </div>
            </div>
            <p className="tech-note-sub">
              Note: Word-level feedback reflects reference text alignment against the recognized speech transcript (identifying substitutions and omissions as reading errors). Uncalibrated acoustic pronunciation scoring is excluded.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
