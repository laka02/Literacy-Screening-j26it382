import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FLOWER_COLORS = [
  '#FF69B4','#FFD700','#FF4500','#9C27B0',
  '#00BCD4','#E91E63','#4CAF50','#FF8C00',
]

export default function Welcome() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`welcome-page${loaded ? ' loaded' : ''}`}>

      {/* ── Sun ── */}
      <div className="sun">
        <div className="sun-core" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="sun-ray"
            style={{ transform: `rotate(${i * 45}deg) translateY(50px)` }}
          />
        ))}
      </div>

      {/* ── Clouds ── */}
      <div className="cloud" style={{ top: '7%',  left: '-220px', animationDelay: '0s',    animationDuration: '36s' }} />
      <div className="cloud" style={{ top: '19%', left: '-300px', animationDelay: '-14s',  animationDuration: '44s' }} />
      <div className="cloud sm" style={{ top: '30%', left: '-160px', animationDelay: '-26s', animationDuration: '39s' }} />

      {/* ── Rainbow ── */}
      <div className="rainbow-arc" />

      {/* ── Floating Emoji Decorations ── */}
      {[
        { e:'🦋', t:'14%',  l:'9%',  d:'0s'   },
        { e:'🐦', t:'22%',  r:'13%', d:'-2s'  },
        { e:'🌸', t:'38%',  l:'4%',  d:'-4s'  },
        { e:'⭐', t:'18%',  r:'7%',  d:'-1s'  },
        { e:'🐝', t:'42%',  l:'7%',  d:'-3.5s'},
        { e:'✨', t:'9%',   l:'28%', d:'-5s'  },
        { e:'🌺', t:'26%',  r:'20%', d:'-2.5s'},
      ].map(({ e, t, l, r, d }, i) => (
        <div
          key={i}
          className="float-emoji"
          style={{ top: t, left: l, right: r, animationDelay: d }}
        >
          {e}
        </div>
      ))}

      {/* ── Ground Scene ── */}
      <div className="ground-scene">
        <div className="hill hill-back" />
        <div className="hill hill-mid" />
        <div className="hill hill-front" />

        {/* Left trees */}
        <div className="tree-group left-trees">
          <div className="tree">
            <div className="leaf leaf-3" />
            <div className="leaf leaf-2" />
            <div className="leaf leaf-1" />
            <div className="tree-trunk" />
          </div>
          <div className="tree large-tree" style={{ marginLeft: '-8px' }}>
            <div className="leaf leaf-3" />
            <div className="leaf leaf-2" />
            <div className="leaf leaf-1" />
            <div className="tree-trunk" />
          </div>
        </div>

        {/* Right trees */}
        <div className="tree-group right-trees">
          <div className="tree large-tree">
            <div className="leaf leaf-3" />
            <div className="leaf leaf-2" />
            <div className="leaf leaf-1" />
            <div className="tree-trunk" />
          </div>
          <div className="tree" style={{ marginLeft: '-8px' }}>
            <div className="leaf leaf-3" />
            <div className="leaf leaf-2" />
            <div className="leaf leaf-1" />
            <div className="tree-trunk" />
          </div>
        </div>

        {/* Flowers */}
        <div className="flowers-row">
          {FLOWER_COLORS.map((color, i) => (
            <div
              key={i}
              className="flower-wrap"
              style={{ animationDelay: `${i * 0.28}s` }}
            >
              <div className="flower-head" style={{ background: color }} />
              <div className="flower-center" />
              <div className="flower-stem" />
              <div className="flower-leaf" />
            </div>
          ))}
        </div>

        {/* Animals */}
        <div className="garden-animal" style={{ left: '4%', animationDelay: '0s' }}>🐰</div>
        <div className="garden-animal" style={{ right: '4%', animationDelay: '-1.1s' }}>🦊</div>
      </div>

      {/* ══ MAIN WELCOME CARD ══ */}
      <div className="welcome-card">
        <div className="logo-row">
          <span className="logo-book-icon">📚</span>
          <div className="logo-text-block">
            <h1 className="logo-title">CAIRE</h1>
            <div className="logo-bar" />
          </div>
        </div>

        <p className="tagline">Adaptive English Learning System</p>
        <span className="project-badge">🎓 SLIIT IT4010 Research Project — J26-IT-382</span>

        <div className="skill-row">
          <span className="skill-chip chip-w">✍️ Writing</span>
          <span className="skill-chip chip-s">🗣️ Speaking</span>
          <span className="skill-chip chip-l">👂 Listening</span>
          <span className="skill-chip chip-r">📖 Reading</span>
        </div>

        <p className="target-label">🌟 Supporting Grade 3–5 Students in Sri Lanka</p>

        <button className="start-btn" onClick={() => navigate('/role')}>
          <span>Let's Begin</span>
          <span className="rocket-icon">🚀</span>
        </button>
      </div>
    </div>
  )
}
