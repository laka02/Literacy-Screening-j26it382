import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { ParentViewModal } from '../../components/readquest/ParentViewModal'
import { READING_PASSAGES } from '../../data/passages'
import './ReadQuest.css'

export default function ReadQuestHome() {
  const navigate = useNavigate()
  const [showParentModal, setShowParentModal] = useState(false)

  return (
    <div className="rq-app-shell jungle-theme">
      <ReadQuestNavbar stars={450} />

      <main className="rq-home-layout">
        {/* ── Left Sidebar (Matching Reference Image 2) ── */}
        <aside className="rq-glass-sidebar">
          <div className="sidebar-brand-title">Adventure Reading</div>

          {/* User Profile Mini Badge (Matching Reference Image 2) */}
          <div className="sidebar-user-card">
            <img src="/lion-mascot.png" alt="Leo Explorer" className="sidebar-avatar-img" />
            <h3 className="sidebar-user-name">Leo Explorer</h3>
            <span className="sidebar-user-level">Level 4 Learner 🌟</span>
            <span className="sidebar-streak-badge">🔥 4 Days Streak</span>
          </div>

          {/* Navigation Menu */}
          <nav className="sidebar-nav-menu">
            <button
              className="sidebar-nav-btn active"
              onClick={() => navigate('/readquest')}
            >
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </button>

            <button
              className="sidebar-nav-btn"
              onClick={() => navigate('/readquest/mission/' + READING_PASSAGES[0].id)}
            >
              <span className="nav-icon">📖</span>
              <span>Reading Studio</span>
            </button>

            <button
              className="sidebar-nav-btn"
              onClick={() => navigate('/readquest/progress')}
            >
              <span className="nav-icon">🌱</span>
              <span>Star Garden</span>
            </button>

            <button
              className="sidebar-nav-btn parent-btn-highlight"
              onClick={() => setShowParentModal(true)}
            >
              <span className="nav-icon">👨‍👩‍👧</span>
              <span>Parent View</span>
            </button>

            <button
              className="sidebar-nav-btn"
              onClick={() => navigate('/home')}
            >
              <span className="nav-icon">🚪</span>
              <span>Exit to Portal</span>
            </button>
          </nav>
        </aside>

        {/* ── Center Content Area ── */}
        <section className="rq-home-content">
          {/* Top Activity Banner (Matching Reference Image 2) */}
          <div className="caire-activity-tag-row">
            <div className="activity-tag-pill">
              <span className="tag-icon">🤖</span>
              <span>CAIRE Learning Activity • Grade 3-5 Oral Reading</span>
            </div>
          </div>

          {/* Featured Mission Hero Glass Card */}
          <div className="reading-game-card hero-glass">
            <div className="hero-content-grid">
              <div className="hero-left-mascot">
                <div className="mascot-speech-bubble-blue">
                  <span>Ready to read with me? 🦁</span>
                </div>
                <img
                  src="/lion-mascot.png"
                  alt="Leo Explorer Mascot"
                  className="game-lion-mascot-img big"
                />
              </div>

              <div className="hero-right-details">
                <span className="mission-chapter-badge">TODAY'S ADVENTURE • CHAPTER 1</span>
                <h1 className="hero-story-title">{READING_PASSAGES[0].title}</h1>
                <p className="hero-story-teaser">
                  "{READING_PASSAGES[0].content.slice(0, 110)}..."
                </p>

                <div className="hero-story-meta-pills">
                  <span className="meta-pill">📝 {READING_PASSAGES[0].wordCount} Words</span>
                  <span className="meta-pill">⏱️ ~40 Seconds</span>
                  <span className="meta-pill">⭐ +50 Golden Stars</span>
                </div>

                <div className="hero-action-buttons">
                  <button
                    className="btn-tactile-blue-large"
                    onClick={() => navigate('/readquest/mission/' + READING_PASSAGES[0].id)}
                  >
                    <span className="mic-icon">🎙️</span>
                    <span>Start Reading Now →</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Help Lion Cross Bridge Tracker (Matching Reference Image 2) */}
            <div className="bridge-track-section" style={{ marginTop: '20px' }}>
              <span className="bridge-track-title">HELP LEO CROSS THE BRIDGE! 🦁</span>
              <div className="bridge-track-nodes">
                <div className="bridge-node done">
                  <span className="node-icon">✓</span>
                  <span className="node-label">Start</span>
                </div>
                <div className="bridge-line done" />
                <div className="bridge-node current">
                  <span className="node-icon">1</span>
                  <span className="node-label">Story 1</span>
                </div>
                <div className="bridge-line" />
                <div className="bridge-node locked">
                  <span className="node-icon">🔒</span>
                  <span className="node-label">Story 2</span>
                </div>
                <div className="bridge-line" />
                <div className="bridge-node locked">
                  <span className="node-icon">🔒</span>
                  <span className="node-label">Trophy 🏆</span>
                </div>
              </div>
            </div>
          </div>

          {/* All Stories Grid */}
          <div className="home-stories-grid">
            {READING_PASSAGES.map((p, idx) => (
              <div key={p.id} className="home-story-glass-card">
                <div className="card-top-icon">
                  <span className="book-emoji">{idx === 0 ? '🏡' : idx === 1 ? '🛍️' : '🐕'}</span>
                  <span className="story-idx-tag">STORY {idx + 1}</span>
                </div>
                <h3 className="story-name">{p.title}</h3>
                <p className="story-desc">"{p.content.slice(0, 80)}..."</p>
                <div className="story-meta-row">
                  <span>⏱️ ~{p.targetTimeSeconds}s</span>
                  <span>📝 {p.wordCount} Words</span>
                </div>
                <button
                  className="btn-story-start-tactile"
                  onClick={() => navigate('/readquest/mission/' + p.id)}
                >
                  <span>Read Story 📖</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Parent View Modal */}
      <ParentViewModal
        isOpen={showParentModal}
        onClose={() => setShowParentModal(false)}
      />
    </div>
  )
}
