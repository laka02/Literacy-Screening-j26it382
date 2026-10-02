import React from 'react'
import { AlignedWord } from '../../types/fluency'

interface WordAlignmentViewProps {
  words: AlignedWord[]
  onWordClick?: (word: string) => void
}

export const WordAlignmentView: React.FC<WordAlignmentViewProps> = ({ words, onWordClick }) => {
  const handleWordSpeak = (word: string) => {
    if (onWordClick) {
      onWordClick(word)
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word)
      u.rate = 0.9
      window.speechSynthesis.speak(u)
    }
  }

  const correctCount = words.filter((w) => w.status === 'correct').length
  const subCount = words.filter((w) => w.status === 'substitution').length
  const skipCount = words.filter((w) => w.status === 'skipped').length

  return (
    <div className="word-alignment-container">
      <div className="alignment-header">
        <h3 className="alignment-title">📖 Word-Level Reference Text Alignment</h3>
        <span className="alignment-subtitle">Whisper ASR Speech Recognition & Levenshtein Matching</span>
      </div>

      <div className="alignment-word-grid">
        {words.map((item) => {
          let statusClass = 'status-correct'
          let tooltip = 'Pronounced correctly'

          if (item.status === 'substitution') {
            statusClass = 'status-substitution'
            tooltip = item.recognizedAs ? `Spoken as: "${item.recognizedAs}"` : 'Slight mispronunciation'
          } else if (item.status === 'skipped') {
            statusClass = 'status-skipped'
            tooltip = 'Skipped or omitted'
          } else if (item.status === 'insertion') {
            statusClass = 'status-insertion'
            tooltip = 'Extra word added'
          }

          return (
            <span
              key={item.id}
              className={`aligned-word-badge ${statusClass}`}
              onClick={() => handleWordSpeak(item.word)}
              title={`${tooltip} (Click to listen)`}
            >
              {item.word}
              {item.status === 'substitution' && item.recognizedAs && (
                <span className="sub-hint">({item.recognizedAs})</span>
              )}
            </span>
          )
        })}
      </div>

      <div className="alignment-legend-row">
        <div className="legend-item">
          <span className="legend-dot correct" />
          <span>Correct Words ({correctCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot substitution" />
          <span>Substitution / Error ({subCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot skipped" />
          <span>Skipped Words ({skipCount})</span>
        </div>
        <div className="legend-tip">
          <span>💡 Tap any word to hear pronunciation</span>
        </div>
      </div>
    </div>
  )
}
