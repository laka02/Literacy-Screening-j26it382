import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReadQuestNavbar } from '../../components/readquest/ReadQuestNavbar'
import { MascotHoot } from '../../components/readquest/MascotHoot'
import './ReadQuest.css'

export default function ProgressDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student')

  const weeklySessions = [
    { date: 'Oct 14', passage: 'Sunny Garden', wpm: 76, accuracy: 88, score: 79, level: 'Medium' },
    { date: 'Oct 16', passage: 'Friendly Tommy', wpm: 84, accuracy: 91, score: 83, level: 'High' },
    { date: 'Oct 18', passage: 'The Little Stream', wpm: 90, accuracy: 92, score: 86, level: 'High' },
    { date: 'Oct 20', passage: 'Max and the Red Ball', wpm: 96, accuracy: 94, score: 88, level: 'High' }
  ]

  const rubricMetrics = [
    { name: 'Accuracy', score: 4.8, max: 5, notes: 'Crisp phonetic pronunciation on sight words' },
    { name: 'Reading Speed', score: 4.5, max: 5, notes: 'Steady 96 Words Per Minute' },
    { name: 'Smoothness', score: 4.2, max: 5, notes: 'Expressive rhythm across 3-word chunks' },
    { name: 'Pausing', score: 4.0, max: 5, notes: 'Thoughtful breath pauses at punctuation' },
    { name: 'Overall Fluency', score: 4.6, max: 5, notes: 'Strong confidence and high engagement' }
  ]

  return (
    <div className="rq-app-shell">
      <ReadQuestNavbar stars={500} />

      <main className="rq-main-layout">
        <section className="rq-content-area" style={{ width: '100%' }}>
          <div className="rq-hero-mission-card">
            <div className="rq-celebrate-header">
              <span className="rq-quest-tag">PROGRESS & FLUENCY PROFILING</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`rq-tool-btn ${activeTab === 'student' ? 'active' : ''}`}
                  onClick={() => setActiveTab('student')}
                >
                  <span>Student View 🦁</span>
                </button>
                <button
                  className={`rq-tool-btn ${activeTab === 'teacher' ? 'active' : ''}`}
                  onClick={() => setActiveTab('teacher')}
                >
                  <span>Teacher & Rubric View 👩‍🏫</span>
                </button>
              </div>
            </div>

            <h1 className="rq-hero-headline">Leo's Reading Fluency Garden 🌱</h1>
            <p className="rq-hero-desc">
              Track reading speed, phonetic accuracy %, and adaptive English learning pathways.
            </p>

            <MascotHoot
              speech="Look how high your fluency tree has grown this week, Leo! You are reading at 96 Words Per Minute!"
              subtext="Consistent 5-minute daily practice keeps your reading skills sharp and confident."
            />

            {/* Weekly Progress Overview */}
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1c30', marginBottom: '14px' }}>
                📈 Weekly Reading Fluency Growth
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {weeklySessions.map((session, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>{session.date}</span>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0b1c30', margin: '4px 0' }}>
                      {session.passage}
                    </strong>
                    <div style={{ margin: '12px 0' }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0058be' }}>{session.score}%</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>
                        Composite RFCS
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      <span>🚀 {session.wpm} WPM</span>
                      <span>🎯 {session.accuracy}% Acc</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Assessment & Rubric (Step 7 in Workflow Diagram) */}
            {activeTab === 'teacher' && (
              <div style={{ marginTop: '32px', background: '#fafcff', border: '1px solid #d0e7ff', borderRadius: '20px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0058be' }}>
                      👩‍🏫 Teacher Fluency Rubric (Ground Truth Evaluation)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Matches Workflow Diagram Step 7: Rubric Scores (1 - 5) & Label Conversion (1-8: Low, 9-16: Medium, 17-25: High)
                    </p>
                  </div>
                  <span style={{ background: '#d1fae5', color: '#065f46', fontWeight: 800, padding: '6px 14px', borderRadius: '9999px', fontSize: '0.85rem' }}>
                    Total Score: 22.1 / 25 (High Fluency)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rubricMetrics.map((rubric, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fff',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ width: '180px' }}>
                        <strong style={{ color: '#0b1c30', fontSize: '0.95rem' }}>{rubric.name}</strong>
                      </div>
                      <div style={{ flex: 1, padding: '0 20px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{rubric.notes}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '100px', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${(rubric.score / rubric.max) * 100}%`, height: '100%', background: '#0058be' }} />
                        </div>
                        <strong style={{ color: '#0058be', fontSize: '0.9rem', width: '45px', textAlign: 'right' }}>
                          {rubric.score} / {rubric.max}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adaptive Learning Pathway (Step 11 in Workflow Diagram) */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0b1c30', marginBottom: '14px' }}>
                🧭 Recommended Adaptive Learning Pathway
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🎧</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e40af', margin: '6px 0' }}>Guided Phonics Listen</h4>
                  <p style={{ fontSize: '0.82rem', color: '#1e3a8a' }}>
                    Listen to Professor Hoot enunciate tricky vowel sounds in compound words.
                  </p>
                </div>

                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '1.4rem' }}>⚡</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#065f46', margin: '6px 0' }}>Speed Reader Quest</h4>
                  <p style={{ fontSize: '0.82rem', color: '#047857' }}>
                    Practice reading 3-word phrase cards in under 3 seconds to reach 105 WPM.
                  </p>
                </div>

                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '16px', padding: '18px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🏆</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#6b21a8', margin: '6px 0' }}>Jungle Story Quiz</h4>
                  <p style={{ fontSize: '0.82rem', color: '#581c87' }}>
                    Answer 3 fun comprehension questions to earn the Golden Explorer Trophy!
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button
                className="rq-btn-primary"
                onClick={() => navigate('/readquest')}
              >
                <span>← Back to Adventure Dashboard</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
