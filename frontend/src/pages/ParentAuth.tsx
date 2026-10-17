import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parentLogin, parentRegister, saveAuth } from '../api/auth'

interface LoginForm { email: string; password: string }
interface RegForm {
  parent_name: string; parent_email: string; password: string; confirm: string
  school: string; child_age: string; grade: string; gender: string; child_image: string
}

export default function ParentAuth() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [login, setLogin] = useState<LoginForm>({ email: '', password: '' })
  const [reg, setReg] = useState<RegForm>({
    parent_name: '', parent_email: '', password: '', confirm: '',
    school: '', child_age: '', grade: '', gender: '', child_image: '',
  })

  const switchTab = (t: 'login' | 'register') => { setTab(t); setAlert(null) }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      setPreview(b64)
      setReg(p => ({ ...p, child_image: b64 }))
    }
    reader.readAsDataURL(file)
  }

  /* ── Login submit ── */
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setAlert(null)
    try {
      const res = await parentLogin(login.email, login.password)
      saveAuth(res.token, 'parent', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/parent/dashboard'), 1400)
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
    if (!reg.grade) {
      setAlert({ type: 'error', msg: 'Please select your child\'s grade.' }); return
    }
    if (!reg.gender) {
      setAlert({ type: 'error', msg: 'Please select your child\'s gender.' }); return
    }
    setLoading(true); setAlert(null)
    try {
      const res = await parentRegister({
        parent_name: reg.parent_name,
        parent_email: reg.parent_email,
        password: reg.password,
        school: reg.school,
        child_age: parseInt(reg.child_age),
        grade: reg.grade,
        gender: reg.gender,
        child_image: reg.child_image || undefined,
      })
      saveAuth(res.token, 'parent', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/parent/dashboard'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Registration failed' })
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page parent-auth-page">

      {/* ── Left Panel ── */}
      <div className="auth-left parent-left">
        <div className="auth-left-inner">
          <div className="auth-left-role-icon">👨‍👩‍👧</div>
          <h2>Welcome, Parent!</h2>
          <p className="auth-left-desc">
            Stay connected to your child's English learning journey. See their progress,
            activities, and personalised plans all in one place.
          </p>
          <div className="auth-feature-list">
            <div className="auth-feature-item">📖 View your child's learning plan</div>
            <div className="auth-feature-item">🌟 Track progress week by week</div>
            <div className="auth-feature-item">💡 Get home practice suggestions</div>
            <div className="auth-feature-item">🎉 Celebrate achievements together</div>
          </div>
        </div>
        <div className="auth-deco-circle deco-c1" />
        <div className="auth-deco-circle deco-c2" />
        <div className="auth-deco-circle deco-c3" />
        <div className="auth-deco-emoji auth-deco-e1">🌟</div>
        <div className="auth-deco-emoji auth-deco-e2">🎈</div>
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
              <h3 className="form-title">👨‍👩‍👧 Parent Login</h3>
              <div className="form-group">
                <label>📧 Parent Email Address</label>
                <input type="email" placeholder="parent@email.com" required
                  value={login.email} onChange={e => setLogin(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>🔒 Password</label>
                <input type="password" placeholder="Enter your password" required
                  value={login.password} onChange={e => setLogin(p => ({ ...p, password: e.target.value }))} />
              </div>
              <button type="submit" className="submit-btn parent-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '👨‍👩‍👧 Login as Parent'}
              </button>
              <p className="switch-hint">
                New here?
                <button type="button" className="switch-link" onClick={() => switchTab('register')}>Create an account</button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {tab === 'register' && (
            <form onSubmit={onRegister}>
              <h3 className="form-title">🌟 Create Parent Account</h3>

              {/* ── Parent Information ── */}
              <p className="form-section-label">👨‍👩‍👧 Parent Information</p>

              <div className="form-group">
                <label>👤 Your Full Name *</label>
                <input type="text" placeholder="Mr. / Mrs. Perera" required
                  value={reg.parent_name} onChange={e => setReg(p => ({ ...p, parent_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>📧 Your Email Address *</label>
                <input type="email" placeholder="parent@email.com" required
                  value={reg.parent_email} onChange={e => setReg(p => ({ ...p, parent_email: e.target.value }))} />
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

              {/* ── Child Information ── */}
              <p className="form-section-label">👦 Child Information</p>

              {/* Child photo upload */}
              <div className="photo-upload-box" onClick={() => fileRef.current?.click()}>
                {preview
                  ? <img src={preview} alt="Child preview" />
                  : (
                    <div className="photo-placeholder">
                      <span>🧒</span>
                      <p>Child's Photo<br />(Optional)</p>
                    </div>
                  )}
                <div className="upload-overlay">✏️</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
              </div>

              <div className="form-group">
                <label>🏫 Child's School Name *</label>
                <input type="text" placeholder="Ananda Vidyalaya" required
                  value={reg.school} onChange={e => setReg(p => ({ ...p, school: e.target.value }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🎂 Child's Age *</label>
                  <input type="number" placeholder="8" required min={7} max={12}
                    value={reg.child_age} onChange={e => setReg(p => ({ ...p, child_age: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>📚 Grade *</label>
                  <select value={reg.grade} onChange={e => setReg(p => ({ ...p, grade: e.target.value }))} required>
                    <option value="">Select grade</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>⚥ Gender *</label>
                <select value={reg.gender} onChange={e => setReg(p => ({ ...p, gender: e.target.value }))} required>
                  <option value="">Select gender</option>
                  <option value="male">👦 Male</option>
                  <option value="female">👧 Female</option>
                </select>
              </div>

              <button type="submit" className="submit-btn parent-submit" disabled={loading}>
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
