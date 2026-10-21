import React, { useState } from 'react'
import { AlignedWord } from '../../types/fluency'

interface WordAlignmentViewProps {
  words: AlignedWord[]
  onWordClick?: (word: string) => void
}

export const WordAlignmentView: React.FC<WordAlignmentViewProps> = ({ words, onWordClick }) => {
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
  const skipCount = words.filter((w) => w.status === 'skipped').length
  const accuracyPercent = Math.round((correctCount / Math.max(words.length, 1)) * 100)

  return (
    <div className="word-alignment-container">
      {/* Friendly Child-Centric Header */}
      <div className="alignment-header">
        <div className="alignment-header-left">
          <div className="alignment-header-badge">📖 WORD FEEDBACK</div>
          <h3 className="alignment-title">How You Read Each Word ✨</h3>
          <p className="alignment-subtitle">
            Tap any word to hear how it sounds! Green words were read wonderfully.
          </p>
        </div>

        <div className="alignment-header-right">
          <div className="alignment-quick-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-text">{accuracyPercent}% Words Clear</span>
          </div>
        </div>
      </div>

      {/* Interactive Word Badges Grid */}
      <div className="alignment-word-grid">
        {words.map((item) => {
          let statusClass = 'status-correct'
          let tooltip = 'Read correctly! 🌟'

          if (item.status === 'substitution') {
            statusClass = 'status-substitution'
            tooltip = item.recognizedAs ? `You said: "${item.recognizedAs}" • Tap to listen!` : 'Practice this word • Tap to listen!'
          } else if (item.status === 'skipped') {
            statusClass = 'status-skipped'
            tooltip = 'Skipped word • Tap to hear pronunciation'
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
          <span className="legend-lbl"><strong>Great Job!</strong> ({correctCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot substitution" />
          <span className="legend-lbl"><strong>Practice Word</strong> ({subCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot skipped" />
          <span className="legend-lbl"><strong>Skipped</strong> ({skipCount})</span>
        </div>
        <div className="legend-tip">
          <span>💡 <strong>Tip:</strong> Tap any word above to hear the correct voice sound.</span>
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
                <span className="tech-value">OpenAI Whisper (Base)</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">String Alignment</span>
                <span className="tech-value">Levenshtein Edit Distance (WER)</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">Total Reference Words</span>
                <span className="tech-value">{words.length} Words</span>
              </div>
              <div className="tech-meta-card">
                <span className="tech-label">Phonetic Match Rate</span>
                <span className="tech-value">{accuracyPercent}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
