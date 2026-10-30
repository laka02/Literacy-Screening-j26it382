// Types for AI-Based Reading Fluency Assessment & Profiling (ReadQuest)
// Matches Workflow Steps 1 - 11: Whisper ASR, Reference Text Alignment, Audio Analysis,
// Feature Extraction, ML Prediction & Fluency Profile Generation

export type FluencyLevel = 'Low' | 'Medium' | 'High'

export type WordAlignmentStatus =
  | 'correct'       // Word matched reference text (Green)
  | 'substitution'  // Mispronounced or substituted word (Coral/Red)
  | 'insertion'     // Extra word inserted (Amber/Orange)
  | 'deletion'      // Word omitted (Pink/Purple)
  | 'skipped'       // Word skipped by reader (Cyan/Blue)

export interface AlignedWord {
  id: string
  word: string
  status: WordAlignmentStatus
  recognizedAs?: string
  confidence?: number
  startTime?: number
  endTime?: number
  phoneticHint?: string
}

export interface ReadingPassage {
  id: string
  title: string
  chapter: string
  gradeLevel: string
  wordCount: number
  targetTimeSeconds: number
  characterName: string
  thumbnailUrl?: string
  content: string
  keyCharacters: string[]
  vocabularyWords: string[]
  sightWords: string[]
  practicePhrases: string[]
}

export interface StructuredFeatureVector {
  wpm: number                     // Words Per Minute
  readingAccuracyPercent: number  // Reading Accuracy (%)
  wordErrorRate: number           // Word Error Rate (WER)
  skipRatePercent: number         // Skip Rate (%)
  pauseCount: number              // Total pause count
  avgPauseDurationSec: number     // Average pause duration (sec)
  totalReadingDurationSec: number // Total reading duration (sec)
  wcpm?: number
  subRatePercent?: number
  totalPauseSec?: number
  longPauses?: number
}

export interface FluencyMetrics {
  // Composite Score
  rfcs: number                    // Reading Fluency Composite Score (0 - 100%)
  fluencyLevel: FluencyLevel      // 'Low' | 'Medium' | 'High'
  classProbabilities?: Record<string, number>
  confidenceBadge: string         // e.g., 'High Spirit ⚡' | 'On Track 🌟'

  // Speed
  wpm: number
  wpmScore: number                // 1 - 5 rating
  wpmPercent: number              // 0 - 100%

  // Accuracy
  accuracyPercent: number
  accuracyScore: number           // 1 - 5 rating
  wordErrorRate: number           // 0.0 - 1.0 (e.g. 0.06 = 6%)

  // Smoothness / Flow
  smoothnessScore: number         // 1 - 5 rating
  smoothnessPercent: number       // 0 - 100%
  pauseCount: number
  avgPauseDuration: number        // seconds

  // Timing
  totalDuration: number           // seconds
  featureVector: StructuredFeatureVector
}

export interface FluencyProfileReport {
  studentName: string
  studentAvatar: string
  passageId: string
  passageTitle: string
  date: string
  metrics: FluencyMetrics
  wordAlignment: AlignedWord[]
  
  // Feedback & Rubric
  strengths: string[]
  areasToImprove: string[]
  recommendations: string[]

  // Gamification rewards
  starsEarned: number
  totalStars: number
  streakDays: number
  unlockedBadge?: {
    id: string
    title: string
    icon: string
    description: string
  }
}
