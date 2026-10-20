import axios from 'axios'
import { getToken } from './auth'

const api = axios.create({
  baseURL: '/api/profile',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token dynamically to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response error handler
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
    }
    return Promise.reject(new Error(msg))
  },
)

export interface ParentUpdateData {
  parent_name: string
  school: string
  child_age: number
  grade: '3' | '4' | '5'
  gender: 'male' | 'female'
  child_image?: string
}

export interface TeacherUpdateData {
  name: string
  school: string
  phone: string
  image?: string
}

export interface MetricItem {
  label: string
  value: string
}

export interface ComponentKPI {
  component_name: string
  member_title: string
  score_percentage: number
  risk_level: string
  color: string
  icon: string
  metrics: MetricItem[]
}

export interface BadgeItem {
  name: string
  icon: string
  description: string
  unlocked: boolean
}

export interface ExerciseItem {
  id: string
  title: string
  skill_category: string
  status: string
  score: number
  date: string
}

export interface ProgressResponse {
  plan_title: string
  student_name: string
  grade: string
  overall_score: number
  total_exercises: number
  completed_exercises: number
  completion_rate: number
  xp_points: number
  stars_count: number
  streak_days: number
  kpis: ComponentKPI[]
  badges: BadgeItem[]
  recent_exercises: ExerciseItem[]
}

export const getMyProfile = async (email?: string) => {
  const params = email ? { email } : {}
  const res = await api.get('/me', { params })
  return res.data
}

export const updateParentProfile = async (data: ParentUpdateData, email?: string) => {
  const params = email ? { email } : {}
  const res = await api.put('/parent', data, { params })
  return res.data
}

export const updateTeacherProfile = async (data: TeacherUpdateData, email?: string) => {
  const params = email ? { email } : {}
  const res = await api.put('/teacher', data, { params })
  return res.data
}

export const getProgressKPIs = async (email?: string): Promise<ProgressResponse> => {
  const params = email ? { email } : {}
  const res = await api.get('/progress', { params })
  return res.data
}

export interface RecordExerciseData {
  id?: string
  title: string
  skill_category: string
  score: number
  status?: string
  date?: string
}

export const recordCompletedExercise = async (data: RecordExerciseData, email?: string) => {
  const params = email ? { email } : {}
  const res = await api.post('/record-exercise', data, { params })
  return res.data
}

