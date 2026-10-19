import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { teacherLogin, teacherRegister, saveAuth } from '../../api/auth'
import './login.css'

interface LoginForm { email: string; password: string }
interface RegForm {
  name: string
  school: string
  email: string
  phone: string
  password: string
  confirm: string
  image: string
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
    name: '',
    school: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    image: '',
  })

  // Field validation error states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    setAlert(null)
    setFieldErrors({})
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const b64 = reader.result as string
      setPreview(b64)
      setReg((p) => ({ ...p, image: b64 }))
    }
    reader.readAsDataURL(file)
  }

  /* ── Validate Teacher Registration Form ── */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    // Name: Required, letters and spaces only
    const trimmedName = reg.name.trim()
    if (!trimmedName) {
      errors.name = 'Full name is required.'
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errors.name = 'Name can only contain letters and spaces (no numbers or special characters allowed).'
    }

    // School: Required
    if (!reg.school.trim()) {
      errors.school = 'School name is required.'
    }

    // Email: Required, no #,!,<,>, must end with @gmail.com
    const trimmedEmail = reg.email.trim().toLowerCase()
    if (!trimmedEmail) {
      errors.email = 'Email address is required.'
    } else if (/[#!<>]/.test(trimmedEmail)) {
      errors.email = "Email cannot contain '#', '!', '<', or '>'."
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(trimmedEmail)) {
      errors.email = 'Email must end with @gmail.com (e.g., teacher@gmail.com).'
    }

    // Phone: Required, 10-15 digits
    const trimmedPhone = reg.phone.trim()
    if (!trimmedPhone) {
      errors.phone = 'Phone number is required.'
    } else if (!/^\+?[0-9]{10,15}$/.test(trimmedPhone)) {
      errors.phone = 'Phone number must be between 10 and 15 digits (e.g., 0771234567).'
    }

    // Password: Min 6 characters
    if (!reg.password) {
      errors.password = 'Password is required.'
    } else if (reg.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
    }

    // Confirm Password
    if (reg.password !== reg.confirm) {
      errors.confirm = 'Passwords do not match!'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  /* ── Login submit ── */
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)
    try {
      const res = await teacherLogin(login.email.trim(), login.password)
      saveAuth(res.token, 'teacher', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/teacher/dashboard'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Login failed' })
    } finally {
      setLoading(false)
    }
  }

  /* ── Register submit ── */
  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAlert(null)

    if (!validateForm()) {
      setAlert({ type: 'error', msg: 'Please correct the highlighted errors in the form.' })
      return
    }

    setLoading(true)
    try {
      const res = await teacherRegister({
        name: reg.name.trim(),
        school: reg.school.trim(),
        email: reg.email.trim().toLowerCase(),
        phone: reg.phone.trim(),
        password: reg.password,
        image: reg.image || undefined,
      })
      saveAuth(res.token, 'teacher', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/teacher/dashboard'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Registration failed' })
    } finally {
      setLoading(false)
    }
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
        <div className="auth-deco-circle deco-c1" />
        <div className="auth-deco-circle deco-c2" />
        <div className="auth-deco-circle deco-c3" />
        <div className="auth-deco-emoji auth-deco-e1">🌟</div>
        <div className="auth-deco-emoji auth-deco-e2">📚</div>
      </div>

      {/* ── Right Panel ── */}
      <div className="auth-right">
        <button className="back-btn" onClick={() => navigate('/role')}>
          ← Back
        </button>

        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${tab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab${tab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
            >
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
            <form onSubmit={onLogin} noValidate>
              <h3 className="form-title">🏫 Teacher Login</h3>
              <div className="form-group">
                <label>📧 Email Address</label>
                <input
                  type="email"
                  placeholder="teacher@gmail.com"
                  required
                  value={login.email}
                  onChange={(e) => setLogin((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>🔒 Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={login.password}
                  onChange={(e) => setLogin((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
              <button type="submit" className="submit-btn teacher-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '🏫 Login as Teacher'}
              </button>
              <p className="switch-hint">
                Don't have an account?
                <button type="button" className="switch-link" onClick={() => switchTab('register')}>
                  Register here
                </button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {tab === 'register' && (
            <form onSubmit={onRegister} noValidate>
              <h3 className="form-title">🎉 Create Teacher Account</h3>

              {/* Photo upload (Optional) */}
              <div className="photo-upload-box" onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="Preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span>📷</span>
                    <p>
                      Upload Photo
                      <br />
                      (Optional)
                    </p>
                  </div>
                )}
                <div className="upload-overlay">✏️</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImage}
                />
              </div>

              {/* Name & School */}
              <div className="form-row">
                <div className="form-group">
                  <label>👤 Full Name * (Letters only)</label>
                  <input
                    type="text"
                    placeholder="Kumari Silva"
                    className={fieldErrors.name ? 'field-error' : ''}
                    value={reg.name}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^[A-Za-z\s]*$/.test(val)) {
                        setReg((p) => ({ ...p, name: val }))
                        setFieldErrors((prev) => ({ ...prev, name: '' }))
                      }
                    }}
                    required
                  />
                  {fieldErrors.name && (
                    <div className="field-error-text">⚠️ {fieldErrors.name}</div>
                  )}
                  <div className="field-hint-text">Only letters and spaces allowed</div>
                </div>

                <div className="form-group">
                  <label>🏫 School Name *</label>
                  <input
                    type="text"
                    placeholder="Ananda College"
                    className={fieldErrors.school ? 'field-error' : ''}
                    value={reg.school}
                    onChange={(e) => {
                      setReg((p) => ({ ...p, school: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, school: '' }))
                    }}
                    required
                  />
                  {fieldErrors.school && (
                    <div className="field-error-text">⚠️ {fieldErrors.school}</div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label>📧 Email Address * (Must end with @gmail.com)</label>
                <input
                  type="email"
                  placeholder="teacher@gmail.com"
                  className={fieldErrors.email ? 'field-error' : ''}
                  value={reg.email}
                  onChange={(e) => {
                    const val = e.target.value
                    if (!/[#!<>]/.test(val)) {
                      setReg((p) => ({ ...p, email: val }))
                      setFieldErrors((prev) => ({ ...prev, email: '' }))
                    }
                  }}
                  required
                />
                {fieldErrors.email && (
                  <div className="field-error-text">⚠️ {fieldErrors.email}</div>
                )}
                <div className="field-hint-text">Must be a valid @gmail.com address (no #, !, &lt;, &gt;)</div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>📞 Phone Number * (10-15 digits)</label>
                <input
                  type="tel"
                  placeholder="0771234567"
                  className={fieldErrors.phone ? 'field-error' : ''}
                  value={reg.phone}
                  onChange={(e) => {
                    setReg((p) => ({ ...p, phone: e.target.value }))
                    setFieldErrors((prev) => ({ ...prev, phone: '' }))
                  }}
                  required
                />
                {fieldErrors.phone && (
                  <div className="field-error-text">⚠️ {fieldErrors.phone}</div>
                )}
              </div>

              {/* Password & Confirm */}
              <div className="form-row">
                <div className="form-group">
                  <label>🔒 Password * (Min 6 chars)</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    className={fieldErrors.password ? 'field-error' : ''}
                    value={reg.password}
                    onChange={(e) => {
                      setReg((p) => ({ ...p, password: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, password: '' }))
                    }}
                    required
                  />
                  {fieldErrors.password && (
                    <div className="field-error-text">⚠️ {fieldErrors.password}</div>
                  )}
                  <div className="field-hint-text">Numbers, special chars, uppercase & lowercase allowed</div>
                </div>

                <div className="form-group">
                  <label>🔒 Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    className={fieldErrors.confirm ? 'field-error' : ''}
                    value={reg.confirm}
                    onChange={(e) => {
                      setReg((p) => ({ ...p, confirm: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, confirm: '' }))
                    }}
                    required
                  />
                  {fieldErrors.confirm && (
                    <div className="field-error-text">⚠️ {fieldErrors.confirm}</div>
                  )}
                </div>
              </div>

              <button type="submit" className="submit-btn teacher-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '🎉 Create Account'}
              </button>
              <p className="switch-hint">
                Already registered?
                <button type="button" className="switch-link" onClick={() => switchTab('login')}>
                  Login here
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
