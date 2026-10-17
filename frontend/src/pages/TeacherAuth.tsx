import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherLogin, teacherRegister, saveAuth } from '../api/auth'

interface LoginForm  { email: string; password: string }
interface RegForm {
  name: string; school: string; email: string
  phone: string; password: string; confirm: string; image: string
}

export default function TeacherAuth() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [login, setLogin] = useState<LoginForm>({ email: '', password: '' })
  const [reg, setReg] = useState<RegForm>({
    name: '', school: '', email: '', phone: '', password: '', confirm: '', image: '',
  })

  const switchTab = (t: 'login' | 'register') => { setTab(t); setAlert(null) }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      setPreview(b64)
      setReg(p => ({ ...p, image: b64 }))
    }
    reader.readAsDataURL(file)
  }

  /* ── Login submit ── */
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setAlert(null)
    try {
      const res = await teacherLogin(login.email, login.password)
      saveAuth(res.token, 'teacher', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/teacher/dashboard'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Login failed' })
    } finally { setLoading(false) }
  }

  /* ── Register submit ── */
  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reg.password !== reg.confirm) {
      setAlert({ type: 'error', msg: 'Passwords do not match!' }); return
    }
    setLoading(true); setAlert(null)
    try {
      const res = await teacherRegister({
        name: reg.name, school: reg.school, email: reg.email,
        phone: reg.phone, password: reg.password,
        image: reg.image || undefined,
      })
      saveAuth(res.token, 'teacher', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/teacher/dashboard'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Registration failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page teacher-auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-left teacher-left">
        <div className="auth-left-inner">
          <div className="auth-left-role-icon">👩‍🏫</div>
          <h2>Welcome, Teacher!</h2>
          <p className="auth-left-desc">
            Help your Grade 3–5 students grow and thrive in their English learning journey
            using CAIRE's personalized plans.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">📊 View student learning profiles</div>
            <div className="auth-feature-item">✅ Approve & edit learning plans</div>
            <div className="auth-feature-item">📈 Track progress over time</div>
            <div className="auth-feature-item">🎯 Identify priority learning areas</div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="auth-deco-circle deco-c1" />
        <div className="auth-deco-circle deco-c2" />
        <div className="auth-deco-circle deco-c3" />
        <div className="auth-deco-emoji auth-deco-e1">🌟</div>
        <div className="auth-deco-emoji auth-deco-e2">📚</div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <button className="back-btn" onClick={() => navigate('/role')}>← Back</button>

        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
              Login
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
              Register
            </button>
          </div>

          {/* Alert */}
          {alert && (
            <div className={`auth-alert ${alert.type}`}>
              {alert.type === 'error' ? '❌' : '✅'} {alert.msg}
            </div>
          )}

          {/* ══ LOGIN FORM ══ */}
          {tab === 'login' && (
            <form onSubmit={onLogin}>
              <h3 className="form-title">🏫 Teacher Login</h3>
              <div className="form-group">
                <label>📧 Email Address</label>
                <input type="email" placeholder="teacher@school.lk" required
                  value={login.email} onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>🔒 Password</label>
                <input type="password" placeholder="Enter your password" required
                  value={login.password} onChange={e => setLogin(p => ({ ...p, password: e.target.value }))} />
              </div>
              <button type="submit" className="submit-btn teacher-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '🏫 Login as Teacher'}
              </button>
              <p className="switch-hint">
                Don't have an account?
                <button type="button" className="switch-link" onClick={() => switchTab('register')}>Register here</button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {tab === 'register' && (
            <form onSubmit={onRegister}>
              <h3 className="form-title">🎉 Create Teacher Account</h3>

              {/* Photo upload */}
              <div className="photo-upload-box" onClick={() => fileRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="Preview" />
                  : (
                    <div className="photo-placeholder">
                      <span>📷</span>
                      <p>Upload Photo<br />(Optional)</p>
                    </div>
                  )}
                <div className="upload-overlay">✏️</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>👤 Full Name *</label>
                  <input type="text" placeholder="Ms. Kumari Silva" required
                    value={reg.name} onChange={e => setReg(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>🏫 School Name *</label>
                  <input type="text" placeholder="Ananda Vidyalaya" required
                    value={reg.school} onChange={e => setReg(p => ({ ...p, school: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label>📧 Email Address *</label>
                <input type="email" placeholder="teacher@school.lk" required
                  value={reg.email} onChange={e => setReg(p => ({ ...p, email: e.target.value }))} />
              </div>

              <div className="form-group">
                <label>📞 Phone Number *</label>
                <input type="tel" placeholder="0771234567" required minLength={10} maxLength={15}
                  value={reg.phone} onChange={e => setReg(p => ({ ...p, phone: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🔒 Password *</label>
                  <input type="password" placeholder="Min 6 characters" required minLength={6}
                    value={reg.password} onChange={e => setReg(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>🔒 Confirm Password *</label>
                  <input type="password" placeholder="Repeat password" required
                    value={reg.confirm} onChange={e => setReg(p => ({ ...p, confirm: e.target.value }))} />
                </div>
              </div>

              <button type="submit" className="submit-btn teacher-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '🎉 Create Account'}
              </button>
              <p className="switch-hint">
                Already registered?
                <button type="button" className="switch-link" onClick={() => switchTab('login')}>Login here</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
