import axios from 'axios'
import { getToken } from './auth'

const api = axios.create({
  baseURL: '/api/plan',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface SkillItem {
  id: string
  name: string
  animal_guide: string
  guide_avatar: string
  icon: string
  color: string
  current_score: number
  performance_band: 'low' | 'medium' | 'high' | 'unknown'
  tagline: string
  rules_applied: string[]
}

export interface StageTaskData {
  type?: string
  letter?: string
  phonics_sound?: string
  target_word?: string
  word_meaning?: string
  total_letters?: number
  letters_set?: string[]
  svg_path?: string
  band?: string
  activities?: any[]
  bridge_goal?: string
  pro_tip?: string
  question?: string
  hint?: string
  options?: string[]
  correct_index?: number
  [key: string]: any
}

export interface StageItem {
  stage_number: number
  title: string
  difficulty: string
  description: string
  rules: string[]
  xp_reward: number
  stars: number
  locked: boolean
  status: string
  task_data: StageTaskData
}

export interface RuleManifestItem {
  code: string
  description: string
}

export interface AdaptivePlanResponse {
  skill: string
  meta: {
    title: string
    guide: string
    color: string
    icon: string
    rule_tag: string
  }
  evaluation: {
    performance_band: string
    support_priority: string
    suggested_activity_type: string
    reason: string[]
    rules_applied: string[]
    score_change?: number
  }
  grade: string
  current_score: number
  previous_score?: number
  stages: StageItem[]
  rules_manifest: RuleManifestItem[]
  completed_stages?: number[]
}

export const getAvailableSkills = async (email?: string) => {
  const params = email ? { email } : {}
  const res = await api.get('/skills', { params })
  return res.data
}

export const generatePlan = async (
  skill: string,
  score?: number | string,
  previousScore?: number | string,
  grade?: string | number,
  email?: string
): Promise<AdaptivePlanResponse> => {
  const params = email ? { email } : {}
  const res = await api.post(
    '/generate',
    {
      skill,
      skill_type: skill,
      score: score !== undefined && score !== null ? Number(score) : undefined,
      current_score: score !== undefined && score !== null ? Number(score) : undefined,
      previous_score:
        previousScore !== undefined && previousScore !== null
          ? Number(previousScore)
          : undefined,
      grade: grade !== undefined && grade !== null ? String(grade) : '4',
    },
    { params }
  )
  return res.data
}


export const completeStageApi = async (
  skill: string,
  stageNumber: number,
  stageTitle: string,
  score: number,
  xpEarned: number,
  hintsUsed: number,
  attempts: number,
  email?: string
) => {
  const params = email ? { email } : {}
  const res = await api.post(
    '/complete-stage',
    {
      skill,
      stage_number: stageNumber,
      stage_title: stageTitle,
      score,
      xp_earned: xpEarned,
      hints_used: hintsUsed,
      attempts,
    },
    { params }
  )
  return res.data
}
