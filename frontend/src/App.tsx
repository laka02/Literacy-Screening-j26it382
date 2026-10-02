import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import RoleSelect from './pages/RoleSelect'
import TeacherAuth from './pages/login/TeacherAuth'
import ParentAuth from './pages/login/ParentAuth'
import Home from './pages/Home/Home'
import ReadQuestHome from './pages/readquest/ReadQuestHome'
import ReadingStudio from './pages/readquest/ReadingStudio'
import AssessmentResult from './pages/readquest/AssessmentResult'
import ProgressDashboard from './pages/readquest/ProgressDashboard'

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

        {/* ReadQuest — AI Reading Fluency Assessment & Profiling */}
        <Route path="/readquest" element={<ReadQuestHome />} />
        <Route path="/readquest/mission/:id" element={<ReadingStudio />} />
        <Route path="/readquest/read" element={<ReadingStudio />} />
        <Route path="/readquest/result" element={<AssessmentResult />} />
        <Route path="/readquest/progress" element={<ProgressDashboard />} />

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
