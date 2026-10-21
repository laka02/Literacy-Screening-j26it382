import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { MascotHoot } from '../../components/readquest/MascotHoot'
import './ReadQuest.css'

export default function ProgressDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student')

  const weeklySessions = [
    { date: 'Oct 14', passage: 'Sunny Garden', wpm: 76, accuracy: 88, score: 79, level: 'Medium', stars: '⭐⭐⭐⭐' },
    { date: 'Oct 16', passage: 'Friendly Tommy', wpm: 84, accuracy: 91, score: 83, level: 'High', stars: '⭐⭐⭐⭐⭐' },
    { date: 'Oct 18', passage: 'The Little Stream', wpm: 90, accuracy: 92, score: 86, level: 'High', stars: '⭐⭐⭐⭐⭐' },
    { date: 'Oct 20', passage: 'My Family & Garden', wpm: 96, accuracy: 94, score: 88, level: 'High', stars: '⭐⭐⭐⭐⭐' }
  ]

  const badges = [
    { id: 1, title: 'Word Pioneer', icon: '🌟', desc: 'Read your very first story aloud', unlocked: true },
    { id: 2, title: '4-Day Streak', icon: '🔥', desc: 'Practiced 4 days in a row without missing', unlocked: true },
    { id: 3, title: 'Speedy Hare', icon: '🚀', desc: 'Read over 90 words per minute smoothly', unlocked: true },
    { id: 4, title: 'Crystal Clear', icon: '🎯', desc: 'Scored 94%+ reading accuracy in a story', unlocked: true },
    { id: 5, title: 'Jungle Master', icon: '👑', desc: 'Complete all 5 story missions in Grade 3-5', unlocked: false },
    { id: 6, title: '1,000 Star Hero', icon: '⭐', desc: 'Collect 1,000 golden reading stars', unlocked: false }
  ]

  const rubricMetrics = [
    { name: 'Word Accuracy', score: 4.8, max: 5, notes: 'Crisp phonetic pronunciation on key sight words' },
    { name: 'Reading Speed (WPM)', score: 4.5, max: 5, notes: 'Steady 96 Words Per Minute — Age appropriate' },
    { name: 'Smoothness & Rhythm', score: 4.4, max: 5, notes: 'Natural phrasing across 3-word chunks' },
    { name: 'Thoughtful Pauses', score: 4.2, max: 5, notes: 'Pauses at punctuation and full stops' },
    { name: 'Confidence & Fluency', score: 4.6, max: 5, notes: 'Expressive tone and high motivation' }
  ]

  return (
    <div className="rq-app-shell">
      <ReadQuestNavbar stars={500} />

      <main className="rq-main-layout">
        <section className="rq-content-area" style={{ width: '100%' }}>
          {/* ── Top Header ── */}
          <div className="rq-hero-mission-card">
            <div className="rq-celebrate-header">
              <span className="rq-quest-tag">MY STAR GARDEN 🌱</span>
              <div className="tab-pill-toggle">
                <button
                  className={`tab-toggle-btn ${activeTab === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveTab('student')}
                >
                  <span>Student View 🦁</span>
                </button>
                <button
                  className={`tab-toggle-btn ${activeTab === 'teacher' ? 'active' : ''}`}
                  onClick={() => setActiveTab('teacher')}
                >
                  <span>Teacher & Rubric View 👩‍🏫</span>
                </button>
              </div>
            </div>

            <h1 className="rq-hero-headline">Leo's Reading Star Garden 🌟</h1>
            <p className="rq-hero-desc">
              Watch your reading skills grow taller each week! Every story you read gives you stars and unlocks new badges.
            </p>

            <MascotHoot
              speech="Look how high your fluency tree has grown this week, Leo! You are reading at 96 Words Per Minute!"
              subtext="Consistent 5-minute daily practice keeps your reading skills sharp and confident."
            />

            {/* ── Student View ── */}
            {activeTab === 'student' ? (
              <div className="student-garden-wrap">
                {/* 1. Quick Stats Row */}
                <div className="garden-stats-banner">
                  <div className="garden-stat-box">
                    <span className="stat-emoji">⭐</span>
                    <div className="stat-meta">
                      <strong className="stat-big-val">500</strong>
                      <span className="stat-sub-label">Total Stars</span>
                    </div>
                  </div>

                  <div className="garden-stat-box warm">
                    <span className="stat-emoji">🔥</span>
                    <div className="stat-meta">
                      <strong className="stat-big-val">4 Days</strong>
                      <span className="stat-sub-label">Active Streak</span>
                    </div>
                  </div>

                  <div className="garden-stat-box emerald">
                    <span className="stat-emoji">📖</span>
                    <div className="stat-meta">
                      <strong className="stat-big-val">4 Stories</strong>
                      <span className="stat-sub-label">Completed</span>
                    </div>
                  </div>

                  <div className="garden-stat-box purple">
                    <span className="stat-emoji">🦁</span>
                    <div className="stat-meta">
                      <strong className="stat-big-val">Level 4</strong>
                      <span className="stat-sub-label">Super Reader</span>
                    </div>
                  </div>
                </div>

                {/* 2. Recent Story Adventures Read */}
                <div className="garden-section">
                  <div className="garden-section-header">
                    <h3 className="section-title">📈 Your Weekly Reading Growth</h3>
                    <span className="section-tag">Last 4 Stories</span>
                  </div>

                  <div className="weekly-cards-grid">
                    {weeklySessions.map((session, i) => (
                      <div key={i} className="session-card">
                        <span className="session-date">{session.date}</span>
                        <h4 className="session-title">{session.passage}</h4>

                        <div className="session-score-circle">
                          <span className="score-num">{session.score}%</span>
                          <span className="score-lbl">Score</span>
                        </div>

                        <div className="session-metrics-row">
                          <span>🚀 {session.wpm} WPM</span>
                          <span>🎯 {session.accuracy}% Clear</span>
                        </div>

                        <div className="session-stars-row">
                          <span>{session.stars}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Badges & Trophies Showcase */}
                <div className="garden-section">
                  <div className="garden-section-header">
                    <h3 className="section-title">🏅 My Badges & Trophies</h3>
                    <span className="section-tag">4 of 6 Unlocked</span>
                  </div>

                  <div className="badges-grid">
                    {badges.map((b) => (
                      <div key={b.id} className={`badge-card ${b.unlocked ? 'unlocked' : 'locked'}`}>
                        <div className="badge-icon-box">{b.icon}</div>
                        <h4 className="badge-title">{b.title}</h4>
                        <p className="badge-desc">{b.desc}</p>
                        <span className="badge-status-pill">
                          {b.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Teacher & Rubric View ── */
              <div className="teacher-rubric-wrap">
                <div className="rubric-header-box">
                  <div>
                    <h3 className="rubric-title">👩‍🏫 Teacher Fluency Rubric (1 - 5 Scale)</h3>
                    <p className="rubric-subtitle">
                      Evaluation based on standardized Grade 3-5 Oral Reading Fluency (ORF) benchmarks.
                    </p>
                  </div>
                  <div className="rubric-badge-total">
                    <span>Total Rubric Score: <strong>22.5 / 25</strong> (High Fluency)</span>
                  </div>
                </div>

                <div className="rubric-list">
                  {rubricMetrics.map((r, idx) => (
                    <div key={idx} className="rubric-row">
                      <div className="rubric-col-name">
                        <strong>{r.name}</strong>
                      </div>
                      <div className="rubric-col-notes">
                        <span>{r.notes}</span>
                      </div>
                      <div className="rubric-col-bar">
                        <div className="rubric-track">
                          <div
                            className="rubric-fill"
                            style={{ width: `${(r.score / r.max) * 100}%` }}
                          />
                        </div>
                        <strong className="rubric-score-num">{r.score} / {r.max}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rubric-summary-box">
                  <h4 className="summary-title">Adaptive Intervention Recommendation:</h4>
                  <p className="summary-text">
                    Leo demonstrates strong word decoding and natural rhythm. Recommended next step:
                    Practice expressive intonation and narrative dialogue passages to prepare for Grade 5 advanced reading.
                  </p>
                </div>
              </div>
            )}

            {/* Back Button */}
            <div className="garden-bottom-actions">
              <button
                className="rq-btn-primary"
                onClick={() => navigate('/readquest')}
              >
                <span>← Back to Story Adventures</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
