import React from 'react'

interface MascotHootProps {
  speech: string
  subtext?: string
  badgeText?: string
  enableAudioVoice?: boolean
  mini?: boolean
}

export const MascotHoot: React.FC<MascotHootProps> = ({
  speech,
  subtext,
  badgeText = 'CAIRE READING COMPANION',
  enableAudioVoice = true,
  mini = false
}) => {
  const speakMessage = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(speech)
      utterance.rate = 0.95
      utterance.pitch = 1.15
      window.speechSynthesis.speak(utterance)
    }
  }

  if (mini) {
    return (
      <div className="mascot-mini-card">
        <div className="mascot-mini-avatar">🦉</div>
        <div className="mascot-mini-text">
          <strong>Professor Hoot</strong>
          <span>"{speech}"</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mascot-hoot-container">
      <div className="mascot-avatar-wrapper" onClick={speakMessage} title="Tap to hear Professor Hoot!">
        <div className="mascot-avatar-glow" />
        <div className="mascot-avatar-badge">🦉</div>
        <div className="mascot-status-dot" title="Listening actively" />
      </div>

      <div className="mascot-speech-bubble">
        <div className="mascot-bubble-header">
          <span className="mascot-sparkle">✨</span>
          <span className="mascot-badge-tag">{badgeText}</span>
          {enableAudioVoice && (
            <button className="mascot-audio-play-btn" onClick={speakMessage} title="Listen to Professor Hoot">
              🔊 Read Aloud
            </button>
          )}
        </div>
        <p className="mascot-speech-quote">"{speech}"</p>
        {subtext && <p className="mascot-subtext">{subtext}</p>}
      </div>
    </div>
  )
}
