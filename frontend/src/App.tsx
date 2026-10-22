import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import RoleSelect from './pages/RoleSelect'
import TeacherAuth from './pages/login/TeacherAuth'
import ParentAuth from './pages/login/ParentAuth'
import Home from './pages/Home/Home'
import Profile from './pages/profile/Profile'
import PersonalPlan from './pages/personal-plan/PersonalPlan'
import FreeActivities from './pages/free-activities/FreeActivities'

function PlaceholderDashboard({ role }: { role: string }) {
  const isTeacher = role === 'teacher'
  return (
    <div className="placeholder-dashboard">
      <div className="placeholder-card">
        <span className="placeholder-icon">{isTeacher ? '👩‍🏫' : '👨‍👩‍👧'}</span>
        <h1>{isTeacher ? 'Teacher Dashboard' : 'Parent Dashboard'}</h1>
        <p>🚧 Phase 2 — Coming Soon!</p>
        <p className="placeholder-sub">
          The {isTeacher ? 'Teacher' : 'Parent'} Dashboard with student profiles,
          learning plans and progress charts is being built next.
        </p>
        <button className="placeholder-btn" onClick={() => window.location.href = '/role'}>
          ← Back to Role Selection
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry screens */}
        <Route path="/" element={<Welcome />} />
        <Route path="/role" element={<RoleSelect />} />

        {/* Auth screens */}
        <Route path="/teacher/auth" element={<TeacherAuth />} />
        <Route path="/parent/auth" element={<ParentAuth />} />

        {/* Home Screen */}
        <Route path="/home" element={<Home />} />

        {/* Profile & KPI Progress Screen */}
        <Route path="/profile" element={<Profile />} />

        {/* Personalized Plan Workspace */}
        <Route path="/personal-plan" element={<PersonalPlan />} />

        {/* Free Trial Activities (no login required) */}
        <Route path="/free-activities" element={<FreeActivities />} />

        {/* Placeholder dashboards (Phase 2) */}
        <Route path="/teacher/dashboard" element={<PlaceholderDashboard role="teacher" />} />
        <Route path="/parent/dashboard" element={<PlaceholderDashboard role="parent" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
