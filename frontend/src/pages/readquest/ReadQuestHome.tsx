import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { MascotHoot } from '../../components/readquest/MascotHoot'
import { READING_PASSAGES } from '../../data/passages'
import './ReadQuest.css'

export default function ReadQuestHome() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('home')
  const currentMissionPassage = READING_PASSAGES[0] // "Max and the Red Ball"

  return (
    <div className="rq-app-shell">
      <ReadQuestNavbar stars={450} />

      <main className="rq-main-layout">
        {/* ── Left Sidebar (Adventure Menu) ── */}
        <aside className="rq-sidebar">
          <div className="rq-nav-card">
            <div className="rq-sidebar-header">Adventure Menu</div>
            <nav className="rq-sidebar-menu">
              <button
                className={`rq-menu-btn ${activeMenu === 'home' ? 'active' : ''}`}
                onClick={() => setActiveMenu('home')}
              >
                <span className="rq-menu-icon">🏠</span>
                <span>Home</span>
              </button>

              <button
                className={`rq-menu-btn ${activeMenu === 'reading' ? 'active' : ''}`}
                onClick={() => navigate('/readquest/mission/' + currentMissionPassage.id)}
              >
                <span className="rq-menu-icon">📖</span>
                <span>My Reading</span>
              </button>

              <button
                className={`rq-menu-btn ${activeMenu === 'progress' ? 'active' : ''}`}
                onClick={() => navigate('/readquest/progress')}
              >
                <span className="rq-menu-icon">🌱</span>
                <span>My Progress</span>
              </button>

              <button
                className={`rq-menu-btn ${activeMenu === 'rewards' ? 'active' : ''}`}
                onClick={() => setActiveMenu('rewards')}
              >
                <span className="rq-menu-icon">🏆</span>
                <span>Rewards</span>
                <span className="rq-badge-pill">New</span>
              </button>

              <button
                className={`rq-menu-btn ${activeMenu === 'profile' ? 'active' : ''}`}
                onClick={() => navigate('/readquest/progress')}
              >
                <span className="rq-menu-icon">👤</span>
                <span>Profile</span>
              </button>
            </nav>
          </div>

          {/* Professor Hoot Mascot Mini Card */}
          <MascotHoot
            mini
            speech="Reading gives you superpowers! Every word makes your voice stronger."
          />
        </aside>

        {/* ── Content Area (Image 2) ── */}
        <section className="rq-content-area">
          {/* Top greeting bubble */}
          <MascotHoot
            speech="Ready to explore today, Leo? Tommy the Rabbit has hidden magical sight words along the jungle path!"
            subtext="Listen carefully to word sounds and read at your own natural pace."
          />

          {/* Main Hero Card: Today's Reading Adventure */}
          <div className="rq-hero-mission-card">
            <div className="rq-hero-top-meta">
              <div className="rq-mission-chapter-tag">
                <span>🧭</span>
                <span>CURRENT MISSION • CHAPTER 4</span>
              </div>
              <span className="rq-readiness-pill">● GRADE 3-5 READINESS</span>
            </div>

            <h1 className="rq-hero-headline">Today's Reading Adventure 🌟</h1>
            <p className="rq-hero-desc">
              Join Tommy the Rabbit on a magical forest quest! Read simple sentences, discover fun words, and earn golden stars.
            </p>

            <div className="rq-hero-body-row">
              {/* Mascot 3D box */}
              <div className="rq-mascot-card-box">
                <span className="rq-mascot-emoji-big">🦉</span>
                <span className="rq-mascot-tag-btn">Let's Read!</span>
              </div>

              {/* Stats Grid */}
              <div className="rq-hero-stats-grid">
                <div className="rq-stat-pill-box">
                  <span className="rq-stat-pill-num">6</span>
                  <span className="rq-stat-pill-lbl">Adventures Done</span>
                </div>

                <div className="rq-stat-pill-box warm">
                  <span className="rq-stat-pill-num">3 Days 🔥</span>
                  <span className="rq-stat-pill-lbl">Current Streak</span>
                </div>

                <div className="rq-stat-pill-box emerald">
                  <span className="rq-stat-pill-num">70% 📈</span>
                  <span className="rq-stat-pill-lbl">Reading Progress</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="rq-mission-progress-bar-wrap">
              <div className="rq-mission-track">
                <div className="rq-mission-fill" style={{ width: '70%' }} />
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="rq-hero-btn-row">
              <button
                className="rq-btn-primary"
                onClick={() => navigate('/readquest/mission/' + currentMissionPassage.id)}
              >
                <span>📖</span>
                <span>Start Reading →</span>
              </button>

              <button
                className="rq-btn-secondary"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(currentMissionPassage.content)
                    u.rate = 0.9
                    window.speechSynthesis.speak(u)
                  }
                }}
              >
                <span>🎙️</span>
                <span>Listen & Speak</span>
              </button>
            </div>
          </div>

          {/* Bottom Dual Card Grid: Encouragement & Adventure Journey Path */}
          <div className="rq-dual-card-grid">
            <div className="rq-encourage-card">
              <div className="rq-encourage-icon">😊</div>
              <div className="rq-encourage-body">
                <h4>Keep Practicing! 🎉</h4>
                <p>"You are doing great! Let's practice one more story to level up your speaking speed."</p>
                <span className="rq-encourage-meta">● Recommended by CAIRE AI Tutor</span>
              </div>
            </div>

            <div className="rq-journey-card">
              <div className="rq-journey-header">
                <h4>💫 Adventure Journey Path</h4>
                <span className="rq-journey-step-tag">Step 3 of 4 Next</span>
              </div>

              <div className="rq-journey-track">
                <div className="rq-journey-node done">
                  <div className="rq-node-circle">✓</div>
                  <span className="rq-node-label">Start</span>
                </div>

                <div className="rq-journey-node done">
                  <div className="rq-node-circle">✓</div>
                  <span className="rq-node-label">Read</span>
                </div>

                <div className="rq-journey-node current">
                  <div className="rq-node-circle">▶</div>
                  <span className="rq-node-label">Practice</span>
                </div>

                <div className="rq-journey-node">
                  <div className="rq-node-circle">🔒</div>
                  <span className="rq-node-label">Finish 🏆</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
