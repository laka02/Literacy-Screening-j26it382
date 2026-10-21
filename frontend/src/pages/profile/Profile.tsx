import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, getRole, saveAuth, getToken } from '../../api/auth'
import {
  getMyProfile,
  updateParentProfile,
  updateTeacherProfile,
  getProgressKPIs,
  ProgressResponse,
  ComponentKPI,
} from '../../api/profile'
import './profile.css'

const DEFAULT_KPIS: ComponentKPI[] = [
  {
    component_name: 'Writing',
    member_title: 'Research Component 1',
    score_percentage: 88,
    risk_level: 'Low Risk (Healthy)',
    color: '#16a34a',
    icon: 'draw',
    metrics: [
      { label: 'Stroke Accuracy', value: '91%' },
      { label: 'Letter Alignment', value: '85%' },
      { label: 'Grip Stamina', value: 'Normal' },
    ],
  },
  {
    component_name: 'Reading',
    member_title: 'Research Component 2',
    score_percentage: 84,
    risk_level: 'On Track (Progressing)',
    color: '#7c3aed',
    icon: 'auto_stories',
    metrics: [
      { label: 'Reading Speed', value: '84 WPM' },
      { label: 'Pause Duration', value: '1.2s Low' },
      { label: 'Phonics Accuracy', value: '88%' },
    ],
  },
  {
    component_name: 'Speaking',
    member_title: 'Research Component 3',
    score_percentage: 76,
    risk_level: 'Mild Need (Practicing)',
    color: '#ea580c',
    icon: 'record_voice_over',
    metrics: [
      { label: 'Phoneme Clarity', value: '74%' },
      { label: 'Vowel Intonation', value: '78%' },
      { label: 'Pronunciation', value: 'Good' },
    ],
  },
  {
    component_name: 'Listening',
    member_title: 'Research Component 4',
    score_percentage: 92,
    risk_level: 'Mastered (Advanced)',
    color: '#0284c7',
    icon: 'hearing',
    metrics: [
      { label: 'Sound Distinction', value: '94%' },
      { label: 'Auditory Processing', value: '90%' },
      { label: 'Comprehension', value: '92%' },
    ],
  },
]

export default function Profile() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>('parent')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<ProgressResponse | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editAlert, setEditAlert] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Parent form state
  const [parentForm, setParentForm] = useState({
    parent_name: '',
    school: '',
    child_age: 8,
    grade: '4' as '3' | '4' | '5',
    gender: 'male' as 'male' | 'female',
    child_image: '',
  })

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    school: '',
    phone: '',
    image: '',
  })

  useEffect(() => {
    loadProfileAndProgress()
  }, [])

  const loadProfileAndProgress = async () => {
    setLoading(true)
    const localUser = getUser()
    const localRole = getRole() || 'parent'
    setRole(localRole)

    if (localUser) {
      setUser(localUser)
      populateForm(localUser, localRole)
    }

    try {
      // Try to fetch latest from server
      const userEmail = localUser?.email || localUser?.parent_email
      const serverUser = await getMyProfile(userEmail)
      if (serverUser) {
        setUser(serverUser)
        populateForm(serverUser, localRole)
      }
    } catch {
      // Fallback to local user
    }

    try {
      const userEmail = localUser?.email || localUser?.parent_email
      const progData = await getProgressKPIs(userEmail)
      setProgress(progData)
    } catch {
      // progress will fallback gracefully if backend is offline
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (userData: any, userRole: string) => {
    if (userRole === 'teacher') {
      setTeacherForm({
        name: userData.name || '',
        school: userData.school || '',
        phone: userData.phone || '',
        image: userData.image || '',
      })
      setAvatarPreview(userData.image || null)
    } else {
      setParentForm({
        parent_name: userData.parent_name || userData.name || '',
        school: userData.school || '',
        child_age: userData.child_age || 8,
        grade: (userData.grade as any) || '4',
        gender: (userData.gender as any) || 'male',
        child_image: userData.child_image || '',
      })
      setAvatarPreview(userData.child_image || null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      setAvatarPreview(b64)
      if (role === 'teacher') {
        setTeacherForm((p) => ({ ...p, image: b64 }))
      } else {
        setParentForm((p) => ({ ...p, child_image: b64 }))
      }
    }
    reader.readAsDataURL(file)
  }

  /* ── Form Validation ── */
  const validateEditForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (role === 'teacher') {
      const trimmedName = teacherForm.name.trim()
      if (!trimmedName) {
        errors.name = 'Full name is required.'
      } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
        errors.name = 'Name can only contain letters and spaces (no numbers or special characters).'
      }

      if (!teacherForm.school.trim()) {
        errors.school = 'School name is required.'
      }

      const trimmedPhone = teacherForm.phone.trim()
      if (!trimmedPhone) {
        errors.phone = 'Phone number is required.'
      } else if (!/^\+?[0-9]{10,15}$/.test(trimmedPhone)) {
        errors.phone = 'Phone number must be between 10 and 15 digits.'
      }
    } else {
      const trimmedName = parentForm.parent_name.trim()
      if (!trimmedName) {
        errors.parent_name = 'Parent name is required.'
      } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
        errors.parent_name = 'Name can only contain letters and spaces (no numbers or special characters).'
      }

      if (!parentForm.school.trim()) {
        errors.school = 'Child school name is required.'
      }

      if (parentForm.child_age < 7 || parentForm.child_age > 12) {
        errors.child_age = 'Child age must be between 7 and 12 years.'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /* ── Submit Edit Profile ── */
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditAlert(null)

    if (!validateEditForm()) {
      setEditAlert({ type: 'error', msg: 'Please fix the highlighted errors before saving.' })
      return
    }

    setEditLoading(true)
    const token = getToken() || ''
    const userEmail = user?.email || user?.parent_email

    try {
      if (role === 'teacher') {
        const res = await updateTeacherProfile(teacherForm, userEmail)
        setUser(res.user)
        saveAuth(token, 'teacher', res.user)
        setEditAlert({ type: 'success', msg: 'Teacher profile updated successfully! 👩‍🏫' })
      } else {
        const res = await updateParentProfile(parentForm, userEmail)
        setUser(res.user)
        saveAuth(token, 'parent', res.user)
        setEditAlert({ type: 'success', msg: 'Parent & child details updated successfully! 🎉' })
      }
      setTimeout(() => {
        setIsEditOpen(false)
        setEditAlert(null)
      }, 1200)
    } catch (err: unknown) {
      setEditAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Update failed.' })
    } finally {
      setEditLoading(false)
    }
  }

  const isTeacher = role === 'teacher'
  const displayName = isTeacher
    ? user?.name || 'Teacher Member'
    : user?.parent_name || 'Parent Member'
  const displayEmail = user?.email || user?.parent_email || 'member@gmail.com'
  const displaySchool = user?.school || 'Primary School'
  const avatarImage = isTeacher ? user?.image : user?.child_image

  return (
    <div className="profile-page-container">
      {/* ── Background Floating Stickers ── */}
      <div className="profile-float-sticker p-sticker-1">🌟</div>
      <div className="profile-float-sticker p-sticker-2">🏆</div>
      <div className="profile-float-sticker p-sticker-3">📖</div>
      <div className="profile-float-sticker p-sticker-4">✏️</div>

      {/* ══════════════════════════════════════════════════════════════════
         1. FIXED HEADER
         ══════════════════════════════════════════════════════════════════ */}
      <header className="profile-header-bar">
        <div className="profile-header-inner">
          <button className="profile-nav-back" onClick={() => navigate('/home')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            <span>Back to Home</span>
          </button>

          <div className="profile-header-title">
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>account_circle</span>
            <span>{isTeacher ? 'Teacher Profile' : "Child & Parent Profile"}</span>
          </div>

          <button className="btn-edit-profile" onClick={() => setIsEditOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
            <span>Edit Profile</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
         2. MAIN CONTENT
         ══════════════════════════════════════════════════════════════════ */}
      <main className="profile-main-content">
        {/* ── Profile Hero Summary Card ── */}
        <section className="profile-hero-card">
          <div className="profile-avatar-info-cluster">
            <div className="profile-avatar-box">
              {avatarImage ? (
                <img src={avatarImage} alt={displayName} />
              ) : (
                <span className="profile-avatar-placeholder">
                  {isTeacher ? '👩‍🏫' : user?.gender === 'female' ? '👧' : '👦'}
                </span>
              )}
            </div>

            <div className="profile-info-texts">
              <div className="profile-name-row">
                <h1 className="profile-user-name">{displayName}</h1>
                <span className={`profile-role-chip ${isTeacher ? 'chip-teacher' : 'chip-parent'}`}>
                  {isTeacher ? '👩‍🏫 Teacher Account' : '👨‍👩‍👧 Parent Account'}
                </span>
              </div>

              <div className="profile-sub-details">
                <span className="profile-detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0058be' }}>mail</span>
                  {displayEmail}
                </span>

                <span className="profile-detail-pill">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#007953' }}>school</span>
                  {displaySchool}
                </span>

                {!isTeacher && (
                  <>
                    <span className="profile-detail-pill">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#d97706' }}>cake</span>
                      Child Age: {user?.child_age || 8} yrs
                    </span>
                    <span className="profile-detail-pill">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7c3aed' }}>auto_stories</span>
                      Grade {user?.grade || '4'}
                    </span>
                    <span className="profile-detail-pill">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0284c7' }}>face</span>
                      Gender: {user?.gender === 'female' ? 'Female 👧' : 'Male 👦'}
                    </span>
                  </>
                )}

                {isTeacher && user?.phone && (
                  <span className="profile-detail-pill">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0284c7' }}>call</span>
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="profile-hero-actions">
            <button className="btn-edit-profile" onClick={() => setIsEditOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
              <span>Edit Details</span>
            </button>
          </div>
        </section>

        {/* ── Stats Strip (XP, Stars, Streak, Overall Mastery) ── */}
        <section className="profile-stats-strip">
          <div className="stat-strip-card">
            <div className="stat-strip-icon" style={{ background: '#dbeafe', color: '#0284c7' }}>
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <div className="stat-strip-val">
                {progress?.overall_score ? `${progress.overall_score}%` : 'Pending'}
              </div>
              <div className="stat-strip-label">Overall Literacy Score</div>
            </div>
          </div>

          <div className="stat-strip-card">
            <div className="stat-strip-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <div>
              <div className="stat-strip-val">
                {progress?.completed_exercises ?? 0}
              </div>
              <div className="stat-strip-label">Completed Activities</div>
            </div>
          </div>

          <div className="stat-strip-card">
            <div className="stat-strip-icon" style={{ background: '#fef08a', color: '#a16207' }}>
              <span className="material-symbols-outlined">hotel_class</span>
            </div>
            <div>
              <div className="stat-strip-val">{progress?.stars_count ?? 0} ⭐</div>
              <div className="stat-strip-label">{progress?.xp_points ?? 0} XP Points</div>
            </div>
          </div>

          <div className="stat-strip-card">
            <div className="stat-strip-icon" style={{ background: '#ffedd5', color: '#c2410c' }}>
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <div>
              <div className="stat-strip-val">{progress?.streak_days ?? 0} Days</div>
              <div className="stat-strip-label">Learning Streak 🔥</div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
           3. SCREENING KPIS FROM OTHER RESEARCH MEMBERS' TASKS
           ══════════════════════════════════════════════════════════════════ */}
        <section className="profile-section-block">
          <div className="section-block-header">
            <div>
              <h2 className="section-block-title">
                <span className="material-symbols-outlined" style={{ color: '#0058be' }}>analytics</span>
                <span>Literacy Screening Results &amp; Research KPIs</span>
              </h2>
              <p className="section-block-sub">
                Evaluations across Writing, Reading, Speaking &amp; Listening research components
              </p>
            </div>
          </div>

          <div className="kpi-cards-grid">
            {(progress?.kpis && progress.kpis.length > 0 ? progress.kpis : DEFAULT_KPIS).map((kpi, idx) => (
              <div key={idx} className="kpi-card">
                <div>
                  <div className="kpi-card-top">
                    <div className="kpi-icon-bubble" style={{ background: `${kpi.color}18`, color: kpi.color }}>
                      <span className="material-symbols-outlined">{kpi.icon}</span>
                    </div>
                    <span
                      className="kpi-percentage-tag"
                      style={{ background: `${kpi.color}22`, color: kpi.color }}
                    >
                      {kpi.score_percentage}%
                    </span>
                  </div>

                  <div className="kpi-member-label">{kpi.member_title}</div>
                  <h3 className="kpi-component-title">{kpi.component_name}</h3>

                  <div className="kpi-bar-outer">
                    <div
                      className="kpi-bar-inner"
                      style={{ width: `${kpi.score_percentage}%`, background: kpi.color }}
                    />
                  </div>

                  <span
                    className="kpi-risk-pill"
                    style={{ background: `${kpi.color}15`, color: kpi.color }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span>
                    <span>{kpi.risk_level}</span>
                  </span>
                </div>

                <div className="kpi-submetrics-list">
                  {kpi.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="kpi-metric-row">
                      <span>{m.label}</span>
                      <span className="kpi-metric-val">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
           4. PERSONAL INTERVENTION PLAN & COMPLETED EXERCISES
           ══════════════════════════════════════════════════════════════════ */}
        <section className="profile-section-block">
          <div className="section-block-header">
            <div>
              <h2 className="section-block-title">
                <span className="material-symbols-outlined" style={{ color: '#0058be' }}>map</span>
                <span>Personal Intervention Plan &amp; Activities</span>
              </h2>
              <p className="section-block-sub">
                Tailored adaptive exercises dynamically updated based on speech recognition &amp; pause evaluations
              </p>
            </div>
          </div>

          <div className="profile-plan-grid">
            {/* Left Plan Card — Progress & Submissions Log */}
            <div className="plan-card-large">
              <div className="plan-header-row">
                <div>
                  <span className="plan-badge-tag">Current Adaptive Roadmap</span>
                  <h3 className="plan-title-text" style={{ marginTop: '6px' }}>
                    {progress?.plan_title || `${user?.grade ? `Grade ${user.grade}` : 'Grade 4'} Phonics & Fluency Roadmap`}
                  </h3>
                </div>
                <button className="btn-play-quest" onClick={() => navigate('/personal-plan')}>
                  Open Plan Workspace 🚀
                </button>
              </div>

              {/* Progress Overview with Circular Percentage Ring */}
              <div className="plan-progress-overview">
                <div
                  className="progress-circle-wrap"
                  style={{ ['--prog' as any]: `${progress?.completion_rate ?? 0}%` }}
                >
                  <div className="progress-circle-inner">
                    <span className="circle-percent-number">{progress?.completion_rate ?? 0}%</span>
                    <span className="circle-percent-sub">Done</span>
                  </div>
                </div>

                <div className="progress-overview-text">
                  <h4>
                    {(progress?.completed_exercises ?? 0) > 0
                      ? `${progress?.completed_exercises} Activities Completed`
                      : '0 Activities Completed'}
                  </h4>
                  <p>
                    {(progress?.completed_exercises ?? 0) > 0
                      ? `Great job! You have completed ${progress?.completed_exercises} tailored literacy and speech practice tasks.`
                      : 'Your personalized exercises will be tracked here dynamically as each task is completed.'}
                  </p>
                </div>
              </div>

              {/* Recent Completed Activities */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h4 style={{ fontFamily: 'Quicksand', fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    Completed Exercises ({progress?.recent_exercises?.length || 0})
                  </h4>
                  {progress?.recent_exercises && progress.recent_exercises.length > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>
                      Active Log
                    </span>
                  )}
                </div>

                {progress?.recent_exercises && progress.recent_exercises.length > 0 ? (
                  <div className="exercises-list-wrap">
                    {progress.recent_exercises.map((ex) => (
                      <div key={ex.id} className="exercise-row-item">
                        <div className="ex-left">
                          <span className={`ex-status-dot ${ex.status === 'Completed' ? '' : 'in-prog'}`} />
                          <div>
                            <div className="ex-name">{ex.title}</div>
                            <div className="ex-category">{ex.skill_category} • {ex.date}</div>
                          </div>
                        </div>
                        <span className="ex-score-tag">{ex.score}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-exercises-state">
                    <div className="empty-exercises-icon">
                      <span className="material-symbols-outlined">auto_stories</span>
                    </div>
                    <h5 className="empty-exercises-title">No Activities Completed Yet</h5>
                    <p className="empty-exercises-sub">
                      As your child begins and completes personalized speech, phonics, and reading activities,
                      their completed exercise reports, scores, and timestamps will appear here automatically.
                    </p>
                    <button
                      className="btn-start-quest"
                      onClick={() => navigate('/personal-plan')}
                    >
                      Start First Activity 🚀
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card — Entry Point to Personalized Plan */}
            <div className="plan-entry-card">
              <div className="plan-entry-header">
                <span className="plan-entry-badge">Personalized Roadmap 🗺️</span>
                <h3 className="plan-entry-title">
                  Start Your Learning Journey
                </h3>
                <p className="plan-entry-desc">
                  Step into interactive speech, phonics, and reading missions uniquely tailored for your child&apos;s literacy growth.
                </p>
              </div>

              <div className="plan-entry-features">
                <div className="plan-entry-feature-item">
                  <div className="plan-entry-feature-icon" style={{ background: '#dbeafe', color: '#0284c7' }}>
                    <span className="material-symbols-outlined">record_voice_over</span>
                  </div>
                  <div>
                    <div className="plan-feature-name">Speech &amp; Echo Reading</div>
                    <div className="plan-feature-sub">Real-time pronunciation and pause analysis</div>
                  </div>
                </div>

                <div className="plan-entry-feature-item">
                  <div className="plan-entry-feature-icon" style={{ background: '#fef08a', color: '#a16207' }}>
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div>
                    <div className="plan-feature-name">Adaptive Phonics Quests</div>
                    <div className="plan-feature-sub">Dynamic difficulty tailored to child&apos;s level</div>
                  </div>
                </div>

                <div className="plan-entry-feature-item">
                  <div className="plan-entry-feature-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                    <span className="material-symbols-outlined">sync_saved_locally</span>
                  </div>
                  <div>
                    <div className="plan-feature-name">Instant Progress Logging</div>
                    <div className="plan-feature-sub">Every completed activity updates profile metrics</div>
                  </div>
                </div>
              </div>

              <div className="plan-entry-action-wrap">
                <button
                  className="btn-start-my-plan"
                  onClick={() => navigate('/personal-plan')}
                >
                  <span>Start My Plan</span>
                  <span className="material-symbols-outlined">rocket_launch</span>
                </button>
                <div className="plan-entry-footnote">
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#16a34a' }}>verified_user</span>
                  <span>Personalized for {user?.grade ? `Grade ${user.grade}` : 'Grade 4'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
         5. INTERACTIVE EDIT PROFILE MODAL
         ══════════════════════════════════════════════════════════════════ */}
      {isEditOpen && (
        <div className="profile-modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">
                ✏️ Edit {isTeacher ? 'Teacher Profile' : 'Child & Parent Profile'}
              </h3>
              <button className="btn-modal-close" onClick={() => setIsEditOpen(false)}>
                ✕
              </button>
            </div>

            {editAlert && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginBottom: '18px',
                  background: editAlert.type === 'error' ? '#fee2e2' : '#dcfce7',
                  color: editAlert.type === 'error' ? '#991b1b' : '#14532d',
                  border: `1.5px solid ${editAlert.type === 'error' ? '#fca5a5' : '#86efac'}`,
                }}
              >
                {editAlert.type === 'error' ? '❌ ' : '✅ '}
                {editAlert.msg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} noValidate>
              {/* Photo Upload Box */}
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div
                  className="profile-avatar-box"
                  style={{ margin: '0 auto', cursor: 'pointer', border: '3px dashed #0058be' }}
                  onClick={() => fileRef.current?.click()}
                  title="Click to change photo"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" />
                  ) : (
                    <span className="profile-avatar-placeholder">
                      {isTeacher ? '👩‍🏫' : '🧒'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0058be',
                    fontFamily: 'Quicksand',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginTop: '8px',
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  📷 Change Photo (Optional)
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              {/* Teacher Form Fields */}
              {isTeacher ? (
                <>
                  <div className="modal-form-group">
                    <label>👤 Full Name * (Letters only)</label>
                    <input
                      type="text"
                      className={fieldErrors.name ? 'field-error' : ''}
                      value={teacherForm.name}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/^[A-Za-z\s]*$/.test(val)) {
                          setTeacherForm((p) => ({ ...p, name: val }))
                          setFieldErrors((prev) => ({ ...prev, name: '' }))
                        }
                      }}
                      required
                    />
                    {fieldErrors.name && <div className="modal-field-err">⚠️ {fieldErrors.name}</div>}
                  </div>

                  <div className="modal-form-group">
                    <label>🏫 School Name *</label>
                    <input
                      type="text"
                      className={fieldErrors.school ? 'field-error' : ''}
                      value={teacherForm.school}
                      onChange={(e) => {
                        setTeacherForm((p) => ({ ...p, school: e.target.value }))
                        setFieldErrors((prev) => ({ ...prev, school: '' }))
                      }}
                      required
                    />
                    {fieldErrors.school && <div className="modal-field-err">⚠️ {fieldErrors.school}</div>}
                  </div>

                  <div className="modal-form-group">
                    <label>📞 Phone Number * (10-15 digits)</label>
                    <input
                      type="tel"
                      className={fieldErrors.phone ? 'field-error' : ''}
                      value={teacherForm.phone}
                      onChange={(e) => {
                        setTeacherForm((p) => ({ ...p, phone: e.target.value }))
                        setFieldErrors((prev) => ({ ...prev, phone: '' }))
                      }}
                      required
                    />
                    {fieldErrors.phone && <div className="modal-field-err">⚠️ {fieldErrors.phone}</div>}
                  </div>
                </>
              ) : (
                /* Parent & Child Form Fields */
                <>
                  <div className="modal-form-group">
                    <label>👤 Parent Full Name * (Letters only)</label>
                    <input
                      type="text"
                      className={fieldErrors.parent_name ? 'field-error' : ''}
                      value={parentForm.parent_name}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/^[A-Za-z\s]*$/.test(val)) {
                          setParentForm((p) => ({ ...p, parent_name: val }))
                          setFieldErrors((prev) => ({ ...prev, parent_name: '' }))
                        }
                      }}
                      required
                    />
                    {fieldErrors.parent_name && (
                      <div className="modal-field-err">⚠️ {fieldErrors.parent_name}</div>
                    )}
                  </div>

                  <div className="modal-form-group">
                    <label>🏫 Child's School Name *</label>
                    <input
                      type="text"
                      className={fieldErrors.school ? 'field-error' : ''}
                      value={parentForm.school}
                      onChange={(e) => {
                        setParentForm((p) => ({ ...p, school: e.target.value }))
                        setFieldErrors((prev) => ({ ...prev, school: '' }))
                      }}
                      required
                    />
                    {fieldErrors.school && <div className="modal-field-err">⚠️ {fieldErrors.school}</div>}
                  </div>

                  <div className="modal-form-row">
                    <div className="modal-form-group">
                      <label>🎂 Child's Age * (7-12)</label>
                      <input
                        type="number"
                        min={7}
                        max={12}
                        className={fieldErrors.child_age ? 'field-error' : ''}
                        value={parentForm.child_age}
                        onChange={(e) =>
                          setParentForm((p) => ({ ...p, child_age: parseInt(e.target.value, 10) || 8 }))
                        }
                        required
                      />
                      {fieldErrors.child_age && (
                        <div className="modal-field-err">⚠️ {fieldErrors.child_age}</div>
                      )}
                    </div>

                    <div className="modal-form-group">
                      <label>📚 Grade *</label>
                      <select
                        value={parentForm.grade}
                        onChange={(e) => setParentForm((p) => ({ ...p, grade: e.target.value as any }))}
                        required
                      >
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label>⚥ Child's Gender *</label>
                    <select
                      value={parentForm.gender}
                      onChange={(e) => setParentForm((p) => ({ ...p, gender: e.target.value as any }))}
                      required
                    >
                      <option value="male">👦 Male</option>
                      <option value="female">👧 Female</option>
                    </select>
                  </div>
                </>
              )}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-save" disabled={editLoading}>
                  {editLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
