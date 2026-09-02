// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface TeacherUser {
  id: string
  name: string
  email: string
  school: string
  phone: string
  image?: string
  role: 'teacher'
}

export interface ParentUser {
  id: string
  name: string
  email: string
  school: string
  grade: string
  child_age: number
  gender: string
  child_image?: string
  role: 'parent'
}

export type AuthUser = TeacherUser | ParentUser

export interface AuthResponse {
  success: boolean
  message: string
  token: string
  user: AuthUser
}

// ─── Form Data Types ─────────────────────────────────────────────────────────

export interface TeacherRegisterData {
  name: string
  school: string
  email: string
  phone: string
  password: string
  image?: string
}

export interface ParentRegisterData {
  parent_name: string
  parent_email: string
  password: string
  school: string
  child_age: number
  grade: string
  gender: string
  child_image?: string
}
