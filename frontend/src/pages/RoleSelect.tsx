import { useNavigate } from 'react-router-dom'

export default function RoleSelect() {
  const navigate = useNavigate()

  return (
    <div className="role-page">
      <div className="role-container">

        {/* Mini logo */}
        <div className="role-mini-logo">
          <span>📚</span>
          <h2>CAIRE</h2>
        </div>

        <h1 className="role-heading">Who Are You Today? 🤔</h1>
        <p className="role-sub">Choose your role to continue your learning journey 🌟</p>

        <div className="role-cards">

          {/* ── Teacher Card ── */}
          <div className="role-card teacher-card" onClick={() => navigate('/teacher/auth')}>
            <span className="card-bg-emoji">🎓</span>
            <span className="card-main-icon">👩‍🏫</span>
            <h3>Teacher</h3>
            <p>Manage students and guide their English learning journey</p>
            <div className="card-features">
              <div className="card-feature-item">📊 View student profiles</div>
              <div className="card-feature-item">✅ Approve learning plans</div>
              <div className="card-feature-item">📈 Track student progress</div>
            </div>
            <button className="card-action-btn">Enter as Teacher →</button>
          </div>

          {/* ── Parent Card ── */}
          <div className="role-card parent-card" onClick={() => navigate('/parent/auth')}>
            <span className="card-bg-emoji">🏠</span>
            <span className="card-main-icon">👨‍👩‍👧</span>
            <h3>Parent</h3>
            <p>Monitor your child's learning and celebrate their progress</p>
            <div className="card-features">
              <div className="card-feature-item">📖 View learning plans</div>
              <div className="card-feature-item">🌟 See progress charts</div>
              <div className="card-feature-item">💡 Get home tips</div>
            </div>
            <button className="card-action-btn">Enter as Parent →</button>
          </div>

        </div>

        <button className="role-back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
