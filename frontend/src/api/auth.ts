import axios from 'axios'
import { AuthResponse, TeacherRegisterData, ParentRegisterData } from '../types'

// ─── Axios Instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Map FastAPI error detail into a plain Error object
api.interceptors.response.use(
  (res) => res,
  (err) => {
    let msg = 'Something went wrong. Please try again.'
    const detail = err.response?.data?.detail
    if (detail) {
      if (Array.isArray(detail)) {
        msg = detail
          .map((d: any) => d.msg?.replace(/^Value error,\s*/i, '') || JSON.stringify(d))
          .join('\n')
      } else if (typeof detail === 'string') {
        msg = detail
      } else if (typeof detail === 'object') {
        msg = detail.msg || JSON.stringify(detail)
      }
    } else if (err.response?.data?.message) {
      msg = err.response.data.message
    } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
      msg = 'Cannot connect to backend server. Please verify backend is running on http://127.0.0.1:8000.'
    } else if (err.message) {
      msg = err.message
    }
    return Promise.reject(new Error(msg))
  },
)

// ─── Teacher Auth ────────────────────────────────────────────────────────────
export const teacherRegister = async (data: TeacherRegisterData): Promise<AuthResponse> => {
  const res = await api.post('/auth/teacher/register', data)
  return res.data
}

export const teacherLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post('/auth/teacher/login', { email, password })
  return res.data
}

// ─── Parent Auth ─────────────────────────────────────────────────────────────
export const parentRegister = async (data: ParentRegisterData): Promise<AuthResponse> => {
  const res = await api.post('/auth/parent/register', data)
  return res.data
}

export const parentLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post('/auth/parent/login', { parent_email: email, password })
  return res.data
}

// ─── Token Storage ───────────────────────────────────────────────────────────
export const saveAuth = (token: string, role: string, user: object) => {
  localStorage.setItem('caire_token', token)
  localStorage.setItem('caire_role', role)
  localStorage.setItem('caire_user', JSON.stringify(user))
}

export const getToken = () => localStorage.getItem('caire_token')
export const getRole = () => localStorage.getItem('caire_role')
export const getUser = () => {
  const u = localStorage.getItem('caire_user')
  return u ? JSON.parse(u) : null
}
export const clearAuth = () => {
  localStorage.removeItem('caire_token')
  localStorage.removeItem('caire_role')
  localStorage.removeItem('caire_user')
}
