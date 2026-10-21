/**
 * frontend/src/services/fluencyService.ts
 * ─────────────────────────────────────────
 * Reading Fluency Assessment Service — CAIRE
 * Author: W.P.D.N. Samarasinghe — IT23362680
 *
 * Contract
 * ─────────
 * • assessReadingFluency() ALWAYS calls the FastAPI backend.
 * • If the backend returns an error, that error is surfaced to the caller —
 *   never silently replaced with simulated / fake data.
 * • Reference passage text is NEVER used as the speech transcript.
 * • Pause metrics come exclusively from Whisper word timestamps (backend).
 * • RFCS is calculated only on the backend (35/30/20/15 formula).
 * • Timeout is 120 s to accommodate CPU-based Whisper inference.
 */

import axios, { AxiosError } from 'axios'
import { FluencyProfileReport, ReadingPassage } from '../types/fluency'

// ── Configuration ────────────────────────────────────────────────────────────
const API_BASE_URL   = '/api/fluency'
/** 120 seconds — matches Whisper small model CPU inference time on a 30-60 s clip */
const ASSESS_TIMEOUT = 120_000

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Submit the student's recorded audio to the FastAPI backend for real
 * Whisper ASR + ML assessment.
 *
 * @param audioBlob      - The raw audio Blob from MediaRecorder (required)
 * @param passage        - The ReadingPassage that was read (for passage_id)
 * @param durationSeconds - Wall-clock recording time in seconds
 * @param studentId      - Optional student identifier for progress tracking
 *
 * @throws Error with a human-readable message if:
 *   - audioBlob is null (no recording was made)
 *   - The backend returns HTTP 4xx / 5xx
 *   - The network is unreachable
 */
export async function assessReadingFluency(
  audioBlob:       Blob | null,
  passage:         ReadingPassage,
  durationSeconds: number,
  studentId?:      string,
): Promise<FluencyProfileReport> {

  // Guard: audio is required — never use simulated data
  if (!audioBlob || audioBlob.size < 100) {
    throw new Error(
      'No audio recording found. Please tap the microphone button and read the passage aloud before submitting.'
    )
  }

  const formData = new FormData()
  formData.append('audio',      audioBlob, 'reading.wav')
  formData.append('passage_id', passage.id)
  formData.append('duration',   String(durationSeconds))
  if (studentId) {
    formData.append('student_id', studentId)
  }

  try {
    const response = await axios.post<FluencyProfileReport>(
      `${API_BASE_URL}/assess`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: ASSESS_TIMEOUT,
      }
    )

    if (!response.data || !response.data.metrics) {
      throw new Error('The server returned an unexpected response. Please try again.')
    }

    return response.data

  } catch (err) {
    // Re-throw with a clean message — never swallow errors silently
    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError<{ detail?: string }>
      if (axiosErr.code === 'ECONNABORTED') {
        throw new Error(
          `Assessment timed out after ${ASSESS_TIMEOUT / 1000} seconds. ` +
          'The Whisper model may still be loading. Please wait a moment and try again.'
        )
      }
      if (!axiosErr.response) {
        throw new Error(
          'Could not connect to the assessment server. ' +
          'Please make sure the backend is running (uvicorn main:app --reload).'
        )
      }
      const detail = axiosErr.response.data?.detail || axiosErr.message
      throw new Error(`Assessment failed: ${detail}`)
    }
    throw err
  }
}

/**
 * Fetch the Whisper model status from the backend.
 * Returns true if the model is loaded and ready, false otherwise.
 */
export async function checkWhisperStatus(): Promise<{ ready: boolean; detail?: string }> {
  try {
    const res = await axios.get<{ status: string; model?: string; detail?: string }>(
      `${API_BASE_URL}/whisper/status`,
      { timeout: 5000 }
    )
    return {
      ready:  res.data.status === 'ready',
      detail: res.data.model ?? res.data.detail,
    }
  } catch {
    return { ready: false, detail: 'Backend not reachable' }
  }
}

/**
 * Fetch available passages from the backend.
 */
export async function fetchPassages(): Promise<{ id: string; filename: string; text: string }[]> {
  const res = await axios.get<{ passages: { id: string; filename: string; text: string }[] }>(
    `${API_BASE_URL}/passages`,
    { timeout: 10_000 }
  )
  return res.data.passages
}
