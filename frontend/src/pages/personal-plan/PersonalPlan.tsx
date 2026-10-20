import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, isAuthenticated } from '../../api/auth'
import { getMyProfile } from '../../api/profile'
import './PersonalPlan.css'

export default function PersonalPlan() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If not authenticated, redirect to role selection or login
    if (!isAuthenticated()) {
      navigate('/role')
      return
    }

    const localUser = getUser()
    setUser(localUser)

    getMyProfile(localUser?.email)
      .then((data) => {
        if (data) {
          setUser((prev: any) => ({ ...prev, ...data }))
        }
      })
      .catch((err) => {
        console.warn('Profile fetch note:', err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  const childName =
    user?.role === 'parent'
      ? `${user.parent_name || 'Student'}'s Child`
      : user?.name || 'Young Explorer'

  const gradeText = user?.grade ? `Grade ${user.grade}` : 'Grade 4'

  return (
    <div className="personal-plan-page">
      {/* Background glowing decorations */}
      <div className="plan-decor-shape plan-decor-1" />
      <div className="plan-decor-shape plan-decor-2" />
      <div className="plan-decor-shape plan-decor-3" />

      {/* ── Top Navigation Bar ── */}
      <header className="plan-nav-bar">
        <div className="plan-nav-inner">
          <div className="plan-nav-left">
            <button className="plan-back-btn" onClick={() => navigate('/profile')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              <span>Back to Profile</span>
            </button>
            <div className="plan-brand-tag">
              <span className="material-symbols-outlined" style={{ color: '#0058be' }}>auto_stories</span>
              <span>CAIRE Adaptive Learning</span>
            </div>
          </div>

          <div className="plan-nav-right">
            <span className="plan-user-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>school</span>
              <span>{childName} • {gradeText}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="plan-main-content">
        {/* Hero Banner */}
        <section className="plan-hero-banner">
          <div className="plan-hero-pill">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>route</span>
            <span>Personal Intervention Roadmap</span>
          </div>
          <h1 className="plan-hero-title">
            🌟 {childName}&apos;s Personalized Learning Plan
          </h1>
          <p className="plan-hero-sub">
            Welcome to your customized intervention workspace! Speech analysis, pause detection,
            and phonics practice activities will appear here as lessons are constructed.
          </p>
        </section>

        {/* Blank / Starter Canvas Section */}
        <section className="plan-canvas-card">
          <div className="plan-canvas-icon-wrap">
            <span className="material-symbols-outlined">psychology</span>
          </div>

          <h2 className="plan-canvas-heading">
            Adaptive Learning Module In Progress 🚀
          </h2>

          <p className="plan-canvas-desc">
            This personalized plan workspace is ready for upcoming tailored exercises.
            Each activity you build will connect here dynamically, and completed exercises
            will instantly reflect on your Profile page.
          </p>

          <div className="plan-canvas-tags">
            <span className="plan-feature-tag">
              <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>check_circle</span>
              Dynamic Speech Practice
            </span>
            <span className="plan-feature-tag">
              <span className="material-symbols-outlined" style={{ color: '#0284c7' }}>check_circle</span>
              Phoneme Fluency Tasks
            </span>
            <span className="plan-feature-tag">
              <span className="material-symbols-outlined" style={{ color: '#7c3aed' }}>check_circle</span>
              Auto-sync with Profile KPIs
            </span>
          </div>

          <div className="plan-canvas-actions">
            <button className="btn-plan-action-primary" onClick={() => navigate('/profile')}>
              <span className="material-symbols-outlined">person</span>
              <span>View My Profile</span>
            </button>
            <button className="btn-plan-action-secondary" onClick={() => navigate('/home')}>
              <span className="material-symbols-outlined">home</span>
              <span>Back to Home</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
