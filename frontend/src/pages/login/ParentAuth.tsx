import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { parentLogin, parentRegister, saveAuth } from '../../api/auth'
import './login.css'

interface LoginForm { email: string; password: string }
interface RegForm {
  parent_name: string
  parent_email: string
  password: string
  confirm: string
  school: string
  child_age: string
  grade: string
  gender: string
  child_image: string
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
    parent_name: '',
    parent_email: '',
    password: '',
    confirm: '',
    school: '',
    child_age: '',
    grade: '',
    gender: '',
    child_image: '',
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
      setReg((p) => ({ ...p, child_image: b64 }))
    }
    reader.readAsDataURL(file)
  }

  /* ── Validate Registration Form ── */
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    // Name: Required, letters and spaces only (no numbers, no special characters)
    const trimmedName = reg.parent_name.trim()
    if (!trimmedName) {
      errors.parent_name = 'Parent name is required.'
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errors.parent_name = 'Name can only contain letters and spaces (no numbers or special characters allowed).'
    }

    // Email: Required, no #,!,<,>, must end with @gmail.com
    const trimmedEmail = reg.parent_email.trim().toLowerCase()
    if (!trimmedEmail) {
      errors.parent_email = 'Email address is required.'
    } else if (/[#!<>]/.test(trimmedEmail)) {
      errors.parent_email = "Email cannot contain '#', '!', '<', or '>'."
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(trimmedEmail)) {
      errors.parent_email = 'Email must end with @gmail.com (e.g., example@gmail.com).'
    }

    // Password: Minimum 6 characters (numbers, special characters, uppercase & lowercase allowed)
    if (!reg.password) {
      errors.password = 'Password is required.'
    } else if (reg.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
    }

    // Confirm Password
    if (reg.password !== reg.confirm) {
      errors.confirm = 'Passwords do not match!'
    }

    // School Name: Required
    if (!reg.school.trim()) {
      errors.school = 'School name is required.'
    }

    // Child Age: Required, between 7 and 12
    const ageNum = parseInt(reg.child_age, 10)
    if (!reg.child_age || isNaN(ageNum) || ageNum < 7 || ageNum > 12) {
      errors.child_age = 'Child age must be between 7 and 12 years.'
    }

    // Grade: Required
    if (!reg.grade) {
      errors.grade = "Please select your child's grade."
    }

    // Gender: Required
    if (!reg.gender) {
      errors.gender = "Please select your child's gender."
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
      const res = await parentLogin(login.email.trim(), login.password)
      saveAuth(res.token, 'parent', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/home'), 1400)
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
      const res = await parentRegister({
        parent_name: reg.parent_name.trim(),
        parent_email: reg.parent_email.trim().toLowerCase(),
        password: reg.password,
        school: reg.school.trim(),
        child_age: parseInt(reg.child_age, 10),
        grade: reg.grade,
        gender: reg.gender,
        child_image: reg.child_image || undefined,
      })
      saveAuth(res.token, 'parent', res.user)
      setAlert({ type: 'success', msg: res.message })
      setTimeout(() => navigate('/home'), 1400)
    } catch (err: unknown) {
      setAlert({ type: 'error', msg: err instanceof Error ? err.message : 'Registration failed' })
    } finally {
      setLoading(false)
    }
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
              <h3 className="form-title">👨‍👩‍👧 Parent Login</h3>
              <div className="form-group">
                <label>📧 Parent Email Address</label>
                <input
                  type="email"
                  placeholder="parent@gmail.com"
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
              <button type="submit" className="submit-btn parent-submit" disabled={loading}>
                {loading ? <span className="spinner" /> : '👨‍👩‍👧 Login as Parent'}
              </button>
              <p className="switch-hint">
                New here?
                <button type="button" className="switch-link" onClick={() => switchTab('register')}>
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* ══ REGISTER FORM ══ */}
          {tab === 'register' && (
            <form onSubmit={onRegister} noValidate>
              <h3 className="form-title">🌟 Create Parent Account</h3>

              {/* ── Parent Information ── */}
              <p className="form-section-label">👨‍👩‍👧 Parent Information</p>

              {/* Parent Name */}
              <div className="form-group">
                <label>👤 Your Full Name * (Letters only)</label>
                <input
                  type="text"
                  placeholder="Nimal Perera"
                  className={fieldErrors.parent_name ? 'field-error' : ''}
                  value={reg.parent_name}
                  onChange={(e) => {
                    const val = e.target.value
                    // Prevent typing numbers or special characters immediately
                    if (/^[A-Za-z\s]*$/.test(val)) {
                      setReg((p) => ({ ...p, parent_name: val }))
                      setFieldErrors((prev) => ({ ...prev, parent_name: '' }))
                    }
                  }}
                  required
                />
                {fieldErrors.parent_name && (
                  <div className="field-error-text">⚠️ {fieldErrors.parent_name}</div>
                )}
                <div className="field-hint-text">Only English letters and spaces (no numbers or special characters)</div>
              </div>

              {/* Parent Email */}
              <div className="form-group">
                <label>📧 Your Email Address * (Must end with @gmail.com)</label>
                <input
                  type="email"
                  placeholder="parent@gmail.com"
                  className={fieldErrors.parent_email ? 'field-error' : ''}
                  value={reg.parent_email}
                  onChange={(e) => {
                    const val = e.target.value
                    // Block '#', '!', '<', '>' from being entered
                    if (!/[#!<>]/.test(val)) {
                      setReg((p) => ({ ...p, parent_email: val }))
                      setFieldErrors((prev) => ({ ...prev, parent_email: '' }))
                    }
                  }}
                  required
                />
                {fieldErrors.parent_email && (
                  <div className="field-error-text">⚠️ {fieldErrors.parent_email}</div>
                )}
                <div className="field-hint-text">Must be a valid @gmail.com address (no #, !, &lt;, &gt;)</div>
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

              {/* ── Child Information ── */}
              <p className="form-section-label">👦 Child Information</p>

              {/* Child photo upload (Optional) */}
              <div className="photo-upload-box" onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} alt="Child preview" />
                ) : (
                  <div className="photo-placeholder">
                    <span>🧒</span>
                    <p>
                      Child's Photo
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

              {/* Child School */}
              <div className="form-group">
                <label>🏫 Child's School Name *</label>
                <input
                  type="text"
                  placeholder="Royal College"
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

              {/* Child Age & Grade */}
              <div className="form-row">
                <div className="form-group">
                  <label>🎂 Child's Age * (7-12)</label>
                  <input
                    type="number"
                    placeholder="8"
                    min={7}
                    max={12}
                    className={fieldErrors.child_age ? 'field-error' : ''}
                    value={reg.child_age}
                    onChange={(e) => {
                      setReg((p) => ({ ...p, child_age: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, child_age: '' }))
                    }}
                    required
                  />
                  {fieldErrors.child_age && (
                    <div className="field-error-text">⚠️ {fieldErrors.child_age}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>📚 Grade *</label>
                  <select
                    className={fieldErrors.grade ? 'field-error' : ''}
                    value={reg.grade}
                    onChange={(e) => {
                      setReg((p) => ({ ...p, grade: e.target.value }))
                      setFieldErrors((prev) => ({ ...prev, grade: '' }))
                    }}
                    required
                  >
                    <option value="">Select grade</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                  </select>
                  {fieldErrors.grade && (
                    <div className="field-error-text">⚠️ {fieldErrors.grade}</div>
                  )}
                </div>
              </div>

              {/* Gender */}
              <div className="form-group">
                <label>⚥ Gender *</label>
                <select
                  className={fieldErrors.gender ? 'field-error' : ''}
                  value={reg.gender}
                  onChange={(e) => {
                    setReg((p) => ({ ...p, gender: e.target.value }))
                    setFieldErrors((prev) => ({ ...prev, gender: '' }))
                  }}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">👦 Male</option>
                  <option value="female">👧 Female</option>
                </select>
                {fieldErrors.gender && (
                  <div className="field-error-text">⚠️ {fieldErrors.gender}</div>
                )}
              </div>

              <button type="submit" className="submit-btn parent-submit" disabled={loading}>
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
