import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, isAuthenticated } from '../../api/auth'
import {
  getAvailableSkills,
  generatePlan,
  completeStageApi,
  SkillItem,
  AdaptivePlanResponse,
  StageItem,
} from '../../api/plan'
import ReadingStudio from './ReadingStudio'
import ListeningStudio from './listening/ListeningStudio'
import './PersonalPlan.css'

const ALPHABET_LIST = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

interface LetterStroke {
  step: number
  instruction: string
  icon: string
  color: string
}

interface LetterMeta {
  word: string
  emoji: string
  phonics: string
  strokes: LetterStroke[]
}

const ALPHABET_DATA: Record<string, LetterMeta> = {
  A: {
    word: 'Apple',
    emoji: '🍎',
    phonics: '/æ/ as in Apple 🍎',
    strokes: [
      { step: 1, instruction: 'Left slant stroke from top', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Right slant stroke from top', icon: 'arrow_downward', color: '#f97316' },
      { step: 3, instruction: 'Cross bar at midline', icon: 'horizontal_rule', color: '#eab308' },
    ],
  },
  B: {
    word: 'Bear',
    emoji: '🐻',
    phonics: '/b/ as in Bear 🐻',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top rounded loop', icon: 'turn_right', color: '#ea580c' },
      { step: 3, instruction: 'Bottom rounded loop', icon: 'turn_right', color: '#eab308' },
    ],
  },
  C: {
    word: 'Cat',
    emoji: '🐱',
    phonics: '/k/ as in Cat 🐱',
    strokes: [
      { step: 1, instruction: 'Curve around from top to bottom', icon: 'rotate_left', color: '#3b82f6' },
    ],
  },
  D: {
    word: 'Dog',
    emoji: '🐶',
    phonics: '/d/ as in Dog 🐶',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Big curve from top to bottom', icon: 'turn_right', color: '#ea580c' },
    ],
  },
  E: {
    word: 'Elephant',
    emoji: '🐘',
    phonics: '/e/ as in Elephant 🐘',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top line across', icon: 'horizontal_rule', color: '#f97316' },
      { step: 3, instruction: 'Middle line across', icon: 'horizontal_rule', color: '#eab308' },
      { step: 4, instruction: 'Bottom line across', icon: 'horizontal_rule', color: '#16a34a' },
    ],
  },
  F: {
    word: 'Fish',
    emoji: '🐟',
    phonics: '/f/ as in Fish 🐟',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top line across', icon: 'horizontal_rule', color: '#f97316' },
      { step: 3, instruction: 'Middle line across', icon: 'horizontal_rule', color: '#eab308' },
    ],
  },
  G: {
    word: 'Giraffe',
    emoji: '🦒',
    phonics: '/g/ as in Giraffe 🦒',
    strokes: [
      { step: 1, instruction: 'Curve around like C', icon: 'rotate_left', color: '#3b82f6' },
      { step: 2, instruction: 'Inward horizontal bar', icon: 'horizontal_rule', color: '#ea580c' },
    ],
  },
  H: {
    word: 'Hat',
    emoji: '🎩',
    phonics: '/h/ as in Hat 🎩',
    strokes: [
      { step: 1, instruction: 'Left line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Right line down', icon: 'arrow_downward', color: '#f97316' },
      { step: 3, instruction: 'Middle bar across', icon: 'horizontal_rule', color: '#eab308' },
    ],
  },
  I: {
    word: 'Igloo',
    emoji: '❄️',
    phonics: '/ɪ/ as in Igloo ❄️',
    strokes: [
      { step: 1, instruction: 'Vertical line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top bar across', icon: 'horizontal_rule', color: '#f97316' },
      { step: 3, instruction: 'Bottom bar across', icon: 'horizontal_rule', color: '#eab308' },
    ],
  },
  J: {
    word: 'Jellyfish',
    emoji: '🪼',
    phonics: '/dʒ/ as in Jellyfish 🪼',
    strokes: [
      { step: 1, instruction: 'Straight down and hook left', icon: 'turn_left', color: '#3b82f6' },
      { step: 2, instruction: 'Top bar across', icon: 'horizontal_rule', color: '#f97316' },
    ],
  },
  K: {
    word: 'Kangaroo',
    emoji: '🦘',
    phonics: '/k/ as in Kangaroo 🦘',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Slant in to center', icon: 'south_west', color: '#f97316' },
      { step: 3, instruction: 'Slant out to base', icon: 'south_east', color: '#eab308' },
    ],
  },
  L: {
    word: 'Lion',
    emoji: '🦁',
    phonics: '/l/ as in Lion 🦁',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Line across along base', icon: 'horizontal_rule', color: '#f97316' },
    ],
  },
  M: {
    word: 'Monkey',
    emoji: '🐵',
    phonics: '/m/ as in Monkey 🐵',
    strokes: [
      { step: 1, instruction: 'Line down on left', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Slant down to center', icon: 'south_east', color: '#f97316' },
      { step: 3, instruction: 'Slant up to top right', icon: 'north_east', color: '#eab308' },
      { step: 4, instruction: 'Line down on right', icon: 'arrow_downward', color: '#16a34a' },
    ],
  },
  N: {
    word: 'Nest',
    emoji: '🪺',
    phonics: '/n/ as in Nest 🪺',
    strokes: [
      { step: 1, instruction: 'Line down on left', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Slant down across', icon: 'south_east', color: '#f97316' },
      { step: 3, instruction: 'Line down on right', icon: 'arrow_downward', color: '#eab308' },
    ],
  },
  O: {
    word: 'Owl',
    emoji: '🦉',
    phonics: '/ɒ/ as in Owl 🦉',
    strokes: [
      { step: 1, instruction: 'Circle curve all the way around', icon: 'rotate_left', color: '#3b82f6' },
    ],
  },
  P: {
    word: 'Panda',
    emoji: '🐼',
    phonics: '/p/ as in Panda 🐼',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top loop curve', icon: 'turn_right', color: '#f97316' },
    ],
  },
  Q: {
    word: 'Queen',
    emoji: '👑',
    phonics: '/kw/ as in Queen 👑',
    strokes: [
      { step: 1, instruction: 'Circle curve around', icon: 'rotate_left', color: '#3b82f6' },
      { step: 2, instruction: 'Small tail slash', icon: 'south_east', color: '#f97316' },
    ],
  },
  R: {
    word: 'Rabbit',
    emoji: '🐰',
    phonics: '/r/ as in Rabbit 🐰',
    strokes: [
      { step: 1, instruction: 'Straight line down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top loop curve', icon: 'turn_right', color: '#f97316' },
      { step: 3, instruction: 'Leg slant down right', icon: 'south_east', color: '#eab308' },
    ],
  },
  S: {
    word: 'Star',
    emoji: '⭐',
    phonics: '/s/ as in Star ⭐',
    strokes: [
      { step: 1, instruction: 'Curve left, then curve right', icon: 'gesture', color: '#3b82f6' },
    ],
  },
  T: {
    word: 'Tiger',
    emoji: '🐯',
    phonics: '/t/ as in Tiger 🐯',
    strokes: [
      { step: 1, instruction: 'Center line straight down', icon: 'arrow_downward', color: '#3b82f6' },
      { step: 2, instruction: 'Top hat bar across', icon: 'horizontal_rule', color: '#f97316' },
    ],
  },
  U: {
    word: 'Umbrella',
    emoji: '☂️',
    phonics: '/ʌ/ as in Umbrella ☂️',
    strokes: [
      { step: 1, instruction: 'Down, curve around base, up', icon: 'u_turn_right', color: '#3b82f6' },
    ],
  },
  V: {
    word: 'Violin',
    emoji: '🎻',
    phonics: '/v/ as in Violin 🎻',
    strokes: [
      { step: 1, instruction: 'Slant down to point', icon: 'south_east', color: '#3b82f6' },
      { step: 2, instruction: 'Slant up to right', icon: 'north_east', color: '#f97316' },
    ],
  },
  W: {
    word: 'Whale',
    emoji: '🐋',
    phonics: '/w/ as in Whale 🐋',
    strokes: [
      { step: 1, instruction: 'Slant down left', icon: 'south_east', color: '#3b82f6' },
      { step: 2, instruction: 'Slant up middle', icon: 'north_east', color: '#f97316' },
      { step: 3, instruction: 'Slant down right', icon: 'south_east', color: '#eab308' },
      { step: 4, instruction: 'Slant up right', icon: 'north_east', color: '#16a34a' },
    ],
  },
  X: {
    word: 'Xylophone',
    emoji: '🎶',
    phonics: '/ks/ as in Xylophone 🎶',
    strokes: [
      { step: 1, instruction: 'Slant across top left to bottom right', icon: 'south_east', color: '#3b82f6' },
      { step: 2, instruction: 'Slant across top right to bottom left', icon: 'south_west', color: '#f97316' },
    ],
  },
  Y: {
    word: 'Yak',
    emoji: '🐂',
    phonics: '/j/ as in Yak 🐂',
    strokes: [
      { step: 1, instruction: 'Short slant left to center', icon: 'south_east', color: '#3b82f6' },
      { step: 2, instruction: 'Short slant right to center', icon: 'south_west', color: '#f97316' },
      { step: 3, instruction: 'Vertical stem straight down', icon: 'arrow_downward', color: '#eab308' },
    ],
  },
  Z: {
    word: 'Zebra',
    emoji: '🦓',
    phonics: '/z/ as in Zebra 🦓',
    strokes: [
      { step: 1, instruction: 'Top line across', icon: 'horizontal_rule', color: '#3b82f6' },
      { step: 2, instruction: 'Slant down across', icon: 'south_west', color: '#f97316' },
      { step: 3, instruction: 'Bottom line across', icon: 'horizontal_rule', color: '#eab308' },
    ],
  },
}

interface StrokeArrow {
  step: number
  color: string
  d: string
  startX: number
  startY: number
}

const LETTER_STROKE_ARROWS: Record<string, StrokeArrow[]> = {
  A: [
    { step: 1, color: '#2563eb', d: 'M 400 110 L 325 320', startX: 400, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 400 110 L 475 320', startX: 408, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 355 225 L 445 225', startX: 355, startY: 225 },
  ],
  B: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 110 C 440 110, 440 210, 335 210', startX: 345, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 335 210 C 450 210, 450 320, 335 320', startX: 345, startY: 215 },
  ],
  C: [
    { step: 1, color: '#2563eb', d: 'M 465 140 C 375 95, 320 150, 320 215 C 320 285, 380 335, 465 290', startX: 465, startY: 135 },
  ],
  D: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 110 C 475 110, 475 320, 335 320', startX: 345, startY: 112 },
  ],
  E: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 112 L 460 112', startX: 345, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 335 210 L 435 210', startX: 345, startY: 210 },
    { step: 4, color: '#9333ea', d: 'M 335 318 L 460 318', startX: 345, startY: 318 },
  ],
  F: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 112 L 460 112', startX: 345, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 335 210 L 430 210', startX: 345, startY: 210 },
  ],
  G: [
    { step: 1, color: '#2563eb', d: 'M 465 140 C 375 95, 320 150, 320 215 C 320 285, 380 335, 465 290 L 465 220', startX: 465, startY: 135 },
    { step: 2, color: '#ea580c', d: 'M 465 220 L 415 220', startX: 465, startY: 215 },
  ],
  H: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 465 110 L 465 320', startX: 465, startY: 105 },
    { step: 3, color: '#16a34a', d: 'M 335 210 L 465 210', startX: 345, startY: 210 },
  ],
  I: [
    { step: 1, color: '#2563eb', d: 'M 400 115 L 400 315', startX: 400, startY: 110 },
    { step: 2, color: '#ea580c', d: 'M 350 112 L 450 112', startX: 350, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 350 318 L 450 318', startX: 350, startY: 318 },
  ],
  J: [
    { step: 1, color: '#2563eb', d: 'M 425 110 L 425 270 C 425 315, 350 325, 345 275', startX: 425, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 360 112 L 470 112', startX: 360, startY: 112 },
  ],
  K: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 465 110 L 340 215', startX: 465, startY: 105 },
    { step: 3, color: '#16a34a', d: 'M 340 215 L 465 320', startX: 345, startY: 215 },
  ],
  L: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 318 L 460 318', startX: 345, startY: 318 },
  ],
  M: [
    { step: 1, color: '#2563eb', d: 'M 325 110 L 325 320', startX: 325, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 325 110 L 400 260', startX: 330, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 400 260 L 475 110', startX: 400, startY: 260 },
    { step: 4, color: '#9333ea', d: 'M 475 110 L 475 320', startX: 475, startY: 105 },
  ],
  N: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 110 L 465 320', startX: 340, startY: 110 },
    { step: 3, color: '#16a34a', d: 'M 465 320 L 465 110', startX: 465, startY: 320 },
  ],
  O: [
    { step: 1, color: '#2563eb', d: 'M 400 110 C 320 110, 320 320, 400 320 C 480 320, 480 110, 400 110', startX: 400, startY: 105 },
  ],
  P: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 110 C 445 110, 445 215, 335 215', startX: 345, startY: 112 },
  ],
  Q: [
    { step: 1, color: '#2563eb', d: 'M 400 110 C 320 110, 320 320, 400 320 C 480 320, 480 110, 400 110', startX: 400, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 425 270 L 475 330', startX: 425, startY: 270 },
  ],
  R: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 335 110 C 445 110, 445 215, 335 215', startX: 345, startY: 112 },
    { step: 3, color: '#16a34a', d: 'M 395 215 L 465 320', startX: 395, startY: 215 },
  ],
  S: [
    { step: 1, color: '#2563eb', d: 'M 455 140 C 375 95, 335 160, 400 210 C 465 260, 420 330, 340 290', startX: 455, startY: 135 },
  ],
  T: [
    { step: 1, color: '#2563eb', d: 'M 400 112 L 400 320', startX: 400, startY: 110 },
    { step: 2, color: '#ea580c', d: 'M 325 112 L 475 112', startX: 325, startY: 112 },
  ],
  U: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 335 270 C 335 325, 465 325, 465 270 L 465 110', startX: 335, startY: 105 },
  ],
  V: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 400 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 400 320 L 465 110', startX: 400, startY: 320 },
  ],
  W: [
    { step: 1, color: '#2563eb', d: 'M 320 110 L 355 320', startX: 320, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 355 320 L 395 165', startX: 355, startY: 320 },
    { step: 3, color: '#16a34a', d: 'M 395 165 L 435 320', startX: 395, startY: 165 },
    { step: 4, color: '#9333ea', d: 'M 435 320 L 480 110', startX: 435, startY: 320 },
  ],
  X: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 465 320', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 465 110 L 335 320', startX: 465, startY: 105 },
  ],
  Y: [
    { step: 1, color: '#2563eb', d: 'M 335 110 L 400 210', startX: 335, startY: 105 },
    { step: 2, color: '#ea580c', d: 'M 465 110 L 400 210', startX: 465, startY: 105 },
    { step: 3, color: '#16a34a', d: 'M 400 210 L 400 320', startX: 400, startY: 210 },
  ],
  Z: [
    { step: 1, color: '#2563eb', d: 'M 335 115 L 465 115', startX: 335, startY: 115 },
    { step: 2, color: '#ea580c', d: 'M 465 115 L 335 315', startX: 465, startY: 115 },
    { step: 3, color: '#16a34a', d: 'M 335 315 L 465 315', startX: 335, startY: 315 },
  ],
}

/**
 * Pixel-level verification that checks if the student's canvas drawing
 * accurately traced the expected letter instead of scribbling or drawing outside.
 */
function evaluateLetterTracing(
  userCanvas: HTMLCanvasElement,
  letter: string
): { isAccurate: boolean; accuracy: number; coverage: number; precision: number; feedback: string } {
  const width = userCanvas.width
  const height = userCanvas.height

  // Render ground-truth guide mask on offscreen canvas
  const refCanvas = document.createElement('canvas')
  refCanvas.width = width
  refCanvas.height = height
  const refCtx = refCanvas.getContext('2d')
  if (!refCtx) {
    return { isAccurate: true, accuracy: 100, coverage: 1, precision: 1, feedback: 'Canvas unavailable' }
  }

  refCtx.clearRect(0, 0, width, height)
  refCtx.font = '800 240px Quicksand, Comic Sans MS, sans-serif'
  refCtx.textAlign = 'center'
  refCtx.textBaseline = 'middle'
  // Generous 44px tolerance line width for primary school children
  refCtx.lineWidth = 44
  refCtx.lineCap = 'round'
  refCtx.lineJoin = 'round'
  refCtx.strokeStyle = '#000000'
  refCtx.strokeText(letter, width / 2, height / 2)
  refCtx.fillStyle = '#000000'
  refCtx.fillText(letter, width / 2, height / 2)

  const refData = refCtx.getImageData(0, 0, width, height).data
  const userCtx = userCanvas.getContext('2d')
  if (!userCtx) {
    return { isAccurate: true, accuracy: 100, coverage: 1, precision: 1, feedback: 'User canvas unavailable' }
  }
  const userData = userCtx.getImageData(0, 0, width, height).data

  let targetPixels = 0
  let drawnPixels = 0
  let matchingPixels = 0

  // Downsample step for fast evaluation (< 3ms)
  const step = 6
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4
      const isTarget = refData[idx + 3] > 40
      const isDrawn = userData[idx + 3] > 40

      if (isTarget) targetPixels++
      if (isDrawn) drawnPixels++
      if (isTarget && isDrawn) matchingPixels++
    }
  }

  if (drawnPixels < 18) {
    return {
      isAccurate: false,
      accuracy: 0,
      coverage: 0,
      precision: 0,
      feedback: `✏️ Trace letter '${letter}' on the canvas first!`,
    }
  }

  const coverage = targetPixels > 0 ? matchingPixels / targetPixels : 0
  const precision = drawnPixels > 0 ? matchingPixels / drawnPixels : 0

  // Balanced accuracy: 60% weight on covering the letter, 40% on staying on the letter
  const rawScore = Math.round((coverage * 0.6 + precision * 0.4) * 100)
  const accuracy = Math.min(100, Math.max(5, rawScore))

  // Evaluation criteria:
  // Must cover at least 26% of letter shape, have at least 24% precision, and accuracy >= 34%
  const isAccurate = coverage >= 0.26 && precision >= 0.24 && accuracy >= 34

  let feedback = ''
  if (!isAccurate) {
    if (precision < 0.22 && coverage < 0.18) {
      feedback = `❌ Incorrect tracing (${accuracy}% Accuracy)! The drawing was outside letter '${letter}'. Follow the numbered arrows and trace inside the guide lines! ✏️`
    } else if (coverage < 0.26) {
      feedback = `❌ Incomplete tracing (${accuracy}% Accuracy)! You only traced part of letter '${letter}'. Follow arrows 1, 2, 3 to complete the whole letter! ✏️`
    } else {
      feedback = `❌ Inaccurate tracing (${accuracy}% Accuracy)! Stay closer to the guide lines for letter '${letter}'. Clear & try again! ✏️`
    }
  } else {
    feedback = `🌟 Great job! Traced with ${accuracy}% Accuracy! Letter '${letter}' mastered!`
  }

  return { isAccurate, accuracy, coverage, precision, feedback }
}


const DEFAULT_SKILLS: SkillItem[] = [
  {
    id: 'writing',
    name: 'Writing',
    animal_guide: 'Leo the Lion',
    guide_avatar: '🦁',
    icon: 'draw',
    color: '#16a34a',
    current_score: 88,
    performance_band: 'high',
    tagline: 'Master letter alignment, smooth stroke physics & neat handwriting!',
    rules_applied: ['R01', 'R04', 'R08', 'R09'],
  },
  
  {
    id: 'reading',
    name: 'Reading',
    animal_guide: 'Ruby the Deer',
    guide_avatar: '🦌',
    icon: 'auto_stories',
    color: '#7c3aed',
    current_score: 84,
    performance_band: 'high',
    tagline: 'Read playful Sri Lankan adventure tales with minimal hesitation pauses!',
    rules_applied: ['R03', 'R07', 'R16', 'R33'],
  },
  
  {
    id: 'listening',
    name: 'Listening',
    animal_guide: 'Barnaby the Bear',
    guide_avatar: '🐻',
    icon: 'hearing',
    color: '#0284c7',
    current_score: 92,
    performance_band: 'high',
    tagline: 'Auditory processing, sound distinction & story comprehension challenges!',
    rules_applied: ['R02', 'R06', 'R18', 'R22'],
  },
]

export default function PersonalPlan() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Selected skill & generated plan state
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)
  const [activePlan, setActivePlan] = useState<AdaptivePlanResponse | null>(null)
  const [generating, setGenerating] = useState<boolean>(false)

  // Stage progress state for the active plan
  const [stagesProgress, setStagesProgress] = useState<{ [stageNum: number]: boolean }>({
    1: false,
    2: false,
    3: false,
  })

  // Active game modal state
  const [activeGameStage, setActiveGameStage] = useState<StageItem | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [showHint, setShowHint] = useState<boolean>(false)
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0)
  const [attemptsCount, setAttemptsCount] = useState<number>(1)

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState<boolean>(false)
  const [lastCompletedStage, setLastCompletedStage] = useState<StageItem | null>(null)

  // Handwriting Studio (Letter Quest) State
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [strokePointsCount, setStrokePointsCount] = useState<number>(0)
  const [penColor, setPenColor] = useState<string>('#0058be')
  const [activeWritingLetter, setActiveWritingLetter] = useState<string>('A')
  const [completedWritingLetters, setCompletedWritingLetters] = useState<string[]>([])
  const [writingFeedback, setWritingFeedback] = useState<string>('Great! Keep practicing!')
  const [showLetterArrows, setShowLetterArrows] = useState<boolean>(true)
  const [writingAccuracyStatus, setWritingAccuracyStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [lastAccuracyScore, setLastAccuracyScore] = useState<number | null>(null)

  // Reset or initialize writing studio canvas when game stage opens
  useEffect(() => {
    if (activeGameStage) {
      const lettersList: string[] = activeGameStage.task_data?.letters_set || ALPHABET_LIST
      const initialLetter = activeGameStage.task_data?.letter || lettersList[0] || 'A'
      setActiveWritingLetter(initialLetter)
      setCompletedWritingLetters([])
      setStrokePointsCount(0)
      const meta = ALPHABET_DATA[initialLetter]
      const wordDesc = meta ? ` as in ${meta.word} ${meta.emoji}` : ''
      setWritingFeedback(`Let's begin Letter Quest! Trace '${initialLetter}'${wordDesc} to start ✏️`)
      setTimeout(() => {
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }, 100)
    }
  }, [activeGameStage])

  // Canvas drawing coordinate mapper (responsive scaling)
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = penColor
    setIsDrawing(true)
    setStrokePointsCount((prev) => prev + 1)
  }

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setStrokePointsCount((prev) => prev + 1)
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.closePath()
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokePointsCount(0)
    setWritingAccuracyStatus('idle')
    setLastAccuracyScore(null)
    setWritingFeedback('Canvas cleared! Try tracing again ✏️')
  }

  const handleSwitchLetter = (letter: string) => {
    setActiveWritingLetter(letter)
    setStrokePointsCount(0)
    setWritingAccuracyStatus('idle')
    setLastAccuracyScore(null)
    clearCanvas()
    const isDone = completedWritingLetters.includes(letter)
    const lettersList: string[] = activeGameStage?.task_data?.letters_set || ALPHABET_LIST
    const totalRequired = activeGameStage?.task_data?.total_letters || lettersList.length || 26
    const letterMeta = ALPHABET_DATA[letter]
    const wordExample = letterMeta ? `${letterMeta.word} ${letterMeta.emoji}` : letter

    if (isDone) {
      setWritingFeedback(
        `Letter '${letter}' is already completed (✓)! You can practice again ✏️ (${completedWritingLetters.length}/${totalRequired} done)`
      )
    } else {
      setWritingFeedback(
        `Tracing Letter '${letter}' as in ${wordExample}! Follow the numbered arrows ① ② ③ ✏️`
      )
    }

    const soundPrompt = letterMeta?.phonics || `Letter ${letter}! Let's trace letter ${letter}!`
    handleSpeakText(soundPrompt)
  }

  const handleNextLetter = () => {
    const lettersList: string[] = activeGameStage?.task_data?.letters_set || ALPHABET_LIST
    const curIndex = lettersList.indexOf(activeWritingLetter)
    const nextIdx = (curIndex + 1) % lettersList.length
    handleSwitchLetter(lettersList[nextIdx])
  }

  const handlePrevLetter = () => {
    const lettersList: string[] = activeGameStage?.task_data?.letters_set || ALPHABET_LIST
    const curIndex = lettersList.indexOf(activeWritingLetter)
    const prevIdx = (curIndex - 1 + lettersList.length) % lettersList.length
    handleSwitchLetter(lettersList[prevIdx])
  }

  // Teacher / Examiner demonstration helper to fast-fill 25 letters
  const handleDemoFillLetters = () => {
    const lettersList: string[] = activeGameStage?.task_data?.letters_set || ALPHABET_LIST
    const allExceptLast = lettersList.slice(0, lettersList.length - 1)
    const lastLetter = lettersList[lettersList.length - 1]
    setCompletedWritingLetters(allExceptLast)
    setActiveWritingLetter(lastLetter)
    clearCanvas()
    setWritingFeedback(
      `⚡ Demo Mode: 25 of 26 letters marked complete! Trace '${lastLetter}' to finish Stage 1! ✏️`
    )
    handleSpeakText(`Demo mode activated! Complete letter ${lastLetter} to finish Stage 1!`)
  }

  const handleCheckWriting = async () => {
    const canvas = canvasRef.current

    if (strokePointsCount < 8 || !canvas) {
      setWritingAccuracyStatus('incorrect')
      setLastAccuracyScore(0)
      setWritingFeedback(`✏️ Trace letter '${activeWritingLetter}' on the canvas first!`)
      handleSpeakText(`Trace letter ${activeWritingLetter} first with your finger or mouse!`)
      return
    }

    // ── Pixel-level accuracy check ──────────────────────────────────
    const { isAccurate, accuracy, feedback } = evaluateLetterTracing(canvas, activeWritingLetter)
    setLastAccuracyScore(accuracy)

    if (!isAccurate) {
      setWritingAccuracyStatus('incorrect')
      setWritingFeedback(feedback)
      handleSpeakText(
        `That tracing is ${accuracy} percent accurate. Follow the numbered arrows and trace inside the guide letter!`
      )
      return  // Do NOT advance — user must retry
    }

    // ── Tracing accepted ────────────────────────────────────────────
    setWritingAccuracyStatus('correct')

    const lettersList: string[] = activeGameStage?.task_data?.letters_set || ALPHABET_LIST
    const totalRequired = activeGameStage?.task_data?.total_letters || lettersList.length || 26

    const isAlreadyDone = completedWritingLetters.includes(activeWritingLetter)
    const updatedCompleted = isAlreadyDone
      ? completedWritingLetters
      : [...completedWritingLetters, activeWritingLetter]

    setCompletedWritingLetters(updatedCompleted)

    const isAllComplete = updatedCompleted.length >= totalRequired

    if (!isAllComplete) {
      const currentIndex = lettersList.indexOf(activeWritingLetter)
      const nextLetter =
        lettersList.find((l, idx) => idx > currentIndex && !updatedCompleted.includes(l)) ||
        lettersList.find((l) => !updatedCompleted.includes(l)) ||
        lettersList[(currentIndex + 1) % lettersList.length]

      const nextMeta = ALPHABET_DATA[nextLetter]
      const nextWord = nextMeta ? `${nextMeta.word} ${nextMeta.emoji}` : nextLetter

      setWritingFeedback(
        `🌟 Superb! Letter '${activeWritingLetter}' — ${accuracy}% Accuracy! (${updatedCompleted.length}/${totalRequired}) Next: '${nextLetter}' as in ${nextWord}! ✏️`
      )
      handleSpeakText(
        `Great handwriting! ${accuracy} percent accurate! You conquered letter ${activeWritingLetter}! Now let's trace letter ${nextLetter}!`
      )

      setTimeout(() => {
        setWritingAccuracyStatus('idle')
        setLastAccuracyScore(null)
        clearCanvas()
        setActiveWritingLetter(nextLetter)
      }, 900)
    } else {
      setWritingFeedback(
        `🏆 Incredible! All ${totalRequired} letters from A to Z conquered! Stage ${activeGameStage?.stage_number} Completed! +${activeGameStage?.xp_reward || 50} Stars! 🌟`
      )
      handleSpeakText(
        `Incredible work! You have conquered all 26 letters from A to Z! Stage completed!`
      )

      if (activeGameStage) {
        try {
          await completeStageApi(
            selectedSkill?.id || 'writing',
            activeGameStage.stage_number,
            activeGameStage.title,
            accuracy,
            activeGameStage.xp_reward,
            hintsUsedCount,
            attemptsCount,
            currentUser?.email
          )
        } catch (e) {
          console.warn('Stage save warning:', e)
        }

        setStagesProgress((prev) => ({
          ...prev,
          [activeGameStage.stage_number]: true,
        }))

        setTimeout(() => {
          setLastCompletedStage(activeGameStage)
          setActiveGameStage(null)
          setShowCelebration(true)
        }, 1200)
      }
    }
  }

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/role')
      return
    }

    const localUser = getUser()
    setCurrentUser(localUser)

    getAvailableSkills(localUser?.email)
      .then((data) => {
        if (data && data.skills) {
          setSkills(data.skills)
        }
      })
      .catch((err) => {
        console.warn('Skills load error:', err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  // Select a skill and generate plan using expert rules
  const handleSelectSkill = async (skillItem: SkillItem) => {
    setSelectedSkill(skillItem)
    setGenerating(true)
    try {
      const planData = await generatePlan(
        skillItem.id,
        skillItem.current_score,
        undefined,
        currentUser?.grade || '4',
        currentUser?.email
      )
      setActivePlan(planData)
      setStagesProgress({ 1: false, 2: false, 3: false })
    } catch (err: any) {
      console.error('Plan generation error:', err)
      alert('Could not generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Switch skill to return to selection hub
  const handleBackToSkills = () => {
    setSelectedSkill(null)
    setActivePlan(null)
    setActiveGameStage(null)
    setShowCelebration(false)
  }

  // Launch playable mini-game activity
  const handleOpenGame = (stage: StageItem) => {
    setActiveGameStage(stage)
    setSelectedOption(null)
    setAnswerStatus('idle')
    setShowHint(false)
    setHintsUsedCount(0)
    setAttemptsCount(1)
  }

  // Speech synthesis audio prompt
  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 1.1
      window.speechSynthesis.speak(utterance)
    }
  }

  // Handle option selection
  const handleSelectOption = (idx: number) => {
    if (answerStatus === 'correct') return
    setSelectedOption(idx)

    if (activeGameStage) {
      const isCorrect = idx === activeGameStage.task_data.correct_index
      if (isCorrect) {
        setAnswerStatus('correct')
        handleSpeakText('Great job! That is correct!')

        // Complete stage in backend & trigger celebration
        setTimeout(async () => {
          try {
            await completeStageApi(
              selectedSkill?.id || 'reading',
              activeGameStage.stage_number,
              activeGameStage.title,
              100,
              activeGameStage.xp_reward,
              hintsUsedCount,
              attemptsCount,
              currentUser?.email
            )
          } catch (e) {
            console.warn('Stage save warning:', e)
          }

          setStagesProgress((prev) => ({
            ...prev,
            [activeGameStage.stage_number]: true,
          }))

          setLastCompletedStage(activeGameStage)
          setActiveGameStage(null)
          setShowCelebration(true)
        }, 800)
      } else {
        setAnswerStatus('wrong')
        setAttemptsCount((prev) => prev + 1)
        handleSpeakText('Try once more! You can do it!')
      }
    }
  }

  const childDisplayName =
    currentUser?.role === 'parent'
      ? `${currentUser.parent_name || 'Student'}'s Child`
      : currentUser?.name || 'Young Explorer'

  const gradeDisplay = currentUser?.grade ? `Grade ${currentUser.grade}` : 'Grade 4'

  return (
    <div className="personal-plan-page">
      {/* Background floating decor */}
      <div className="plan-decor-cloud cloud-1" />
      <div className="plan-decor-cloud cloud-2" />
      <div className="plan-decor-cloud cloud-3" />

      {/* ── Top Navigation Bar ── */}
      <header className="plan-nav-bar">
        <div className="plan-nav-inner">
          <div className="plan-nav-left">
            <button className="plan-back-btn" onClick={() => navigate('/profile')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_back
              </span>
              <span>Back to Profile</span>
            </button>
            <div className="plan-brand-tag">
              <span className="material-symbols-outlined" style={{ color: '#0058be' }}>
                auto_stories
              </span>
              <span>CAIRE Adaptive Quest</span>
            </div>
          </div>

          <div className="plan-nav-right">
            <span className="plan-user-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                school
              </span>
              <span>{childDisplayName} • {gradeDisplay}</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="plan-main-content">
        {/* ══════════════════════════════════════════════════════════════════
           STEP 1: SKILL SELECTION HUB (When no skill is chosen yet)
           ══════════════════════════════════════════════════════════════════ */}
        {!selectedSkill && (
          <div>
            <div className="selection-hero-card">
              <div className="selection-title-badge">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  explore
                </span>
                <span>Select Your Literacy Quest</span>
              </div>
              <h1 className="selection-main-heading">
                Where Should We Begin Our Adventure? 🗺️
              </h1>
              <p className="selection-sub-heading">
                Each literacy skill features its own friendly animal guide and an adaptive 3-stage
                roadmap calibrated by educational expert rules (R01–R40) to match your current level.
              </p>
            </div>

            <div className="skills-cards-grid">
              {(skills && skills.length > 0 ? skills : DEFAULT_SKILLS).map((skill) => (
                <div
                  key={skill.id}
                  className="skill-quest-card"
                  onClick={() => handleSelectSkill(skill)}
                >
                  <div>
                    <div className="skill-card-top">
                      <div
                        className="skill-avatar-bubble"
                        style={{ background: `${skill.color}18` }}
                      >
                        <span>{skill.guide_avatar}</span>
                      </div>
                      <span
                        className="skill-score-badge"
                        style={{ background: `${skill.color}20`, color: skill.color }}
                      >
                        {skill.current_score}% Score
                      </span>
                    </div>

                    <div className="skill-guide-name">Guide: {skill.animal_guide}</div>
                    <h3 className="skill-card-title">{skill.name}</h3>
                    <p className="skill-card-tagline">{skill.tagline}</p>
                  </div>

                  <button
                    className="btn-choose-quest"
                    style={{ background: skill.color }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectSkill(skill)
                    }}
                  >
                    <span>Start Quest Map</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      arrow_forward
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
           STEP 2: ADVENTURE ISLAND MAP (3 Stages)
           ══════════════════════════════════════════════════════════════════ */}
        {selectedSkill && activePlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Map Header Bar */}
            <div className="map-header-bar">
              <div className="map-header-left">
                <div className="map-skill-avatar">
                  <span>{selectedSkill.guide_avatar}</span>
                </div>
                <div>
                  <h2 className="map-skill-title">{selectedSkill.name}</h2>
                  <p className="map-skill-sub">
                    Animal Guide: <strong>{selectedSkill.animal_guide}</strong> • Performance Band:{' '}
                    <span style={{ textTransform: 'capitalize', fontWeight: 800, color: selectedSkill.color }}>
                      {activePlan.evaluation.performance_band}
                    </span>{' '}
                    • Support Priority:{' '}
                    <span style={{ textTransform: 'capitalize', fontWeight: 800 }}>
                      {activePlan.evaluation.support_priority}
                    </span>
                  </p>
                </div>
              </div>

              <button className="btn-switch-skill" onClick={handleBackToSkills}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  tune
                </span>
                <span>Change Skill</span>
              </button>
            </div>

            {/* ── 1. CAIRE AI Recommendation Card (Storybook Adventure) ── */}
            <section className="journey-ai-card">
              <div className="journey-ai-glow-1" />
              <div className="journey-ai-glow-2" />

              <div className="journey-ai-peek">
                <span>🤖</span>
              </div>

              <div className="journey-ai-header">
                <div className="journey-ai-icon-box">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>smart_toy</span>
                </div>
                <h3 className="journey-ai-title">Today&apos;s Learning Adventure 🗺️</h3>
              </div>

              <p className="journey-ai-quote">
                CAIRE recommends: Based on your <strong>{selectedSkill.current_score}% Literacy Screening</strong>,
                let&apos;s conquer <strong>{selectedSkill.name}</strong> with <strong>{selectedSkill.animal_guide}</strong>! 🌟
              </p>

              <div className="journey-quick-chips">
                <button
                  className="journey-chip-btn"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a' }}
                  onClick={() => handleSpeakText(`Let's explore ${selectedSkill.name} with ${selectedSkill.animal_guide}!`)}
                >
                  <span>🟠</span>
                  <span>{selectedSkill.name} Quest</span>
                </button>
                <button
                  className="journey-chip-btn"
                  style={{ background: '#dbeafe', color: '#1e40af', border: '1.5px solid #bfdbfe' }}
                  onClick={() => {
                    const firstUnlocked = activePlan.stages.find(s => s.stage_number === 1 || stagesProgress[s.stage_number - 1])
                    if (firstUnlocked) handleOpenGame(firstUnlocked)
                  }}
                >
                  <span>🔵</span>
                  <span>Interactive Challenge</span>
                </button>
                <button
                  className="journey-chip-btn"
                  style={{ background: '#f3e8ff', color: '#6b21a8', border: '1.5px solid #e9d5ff' }}
                  onClick={() => handleSpeakText(`${selectedSkill.animal_guide} is ready to guide you through three exciting adventure stages!`)}
                >
                  <span>🟣</span>
                  <span>Mascot Voice Tip</span>
                </button>
              </div>
            </section>

            {/* ── 2. Top 3 KPI Summary Cards ── */}
            <section className="journey-kpis-grid">
              <div className="journey-kpi-pill-card" style={{ borderColor: '#bfdbfe' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#dbeafe', color: '#0058be' }}>
                  <span className="material-symbols-outlined">graphic_eq</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#0058be' }}>Screening Score</div>
                  <div className="journey-kpi-pill-val">{selectedSkill.current_score}%</div>
                </div>
              </div>

              <div className="journey-kpi-pill-card" style={{ borderColor: '#fde68a' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <span className="material-symbols-outlined">edit_square</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#b45309' }}>Performance Level</div>
                  <div className="journey-kpi-pill-val" style={{ textTransform: 'capitalize' }}>
                    {activePlan.evaluation.performance_band}
                  </div>
                </div>
              </div>

              <div className="journey-kpi-pill-card" style={{ borderColor: '#e9d5ff' }}>
                <div className="journey-kpi-pill-icon" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <div>
                  <div className="journey-kpi-pill-label" style={{ color: '#7e22ce' }}>Quest Progress</div>
                  <div className="journey-kpi-pill-val">
                    {Object.values(stagesProgress).filter(Boolean).length}/3 Cleared
                  </div>
                </div>
              </div>
            </section>

            {/* ── 3. Interactive Winding Journey Board ── */}
            <section className="adventure-journey-board">
              {/* Landscape decor elements */}
              <div className="journey-decor-landmarks">
                <span className="landmark-tree">🌴</span>
                <span className="landmark-river-water">🌊</span>
                <span className="landmark-castle-tower">🏰</span>
                <span className="landmark-mountain-peak">⛰️</span>
              </div>

              <div className="journey-board-header">
                <h3 className="journey-board-title">My Journey Path 🗺️</h3>
                <p className="journey-board-sub">
                  Tap each checkpoint to play and earn stars along the winding adventure trail!
                </p>
              </div>

              {/* Connecting Path SVG Curve (Background) */}
              <div className="journey-svg-track">
                <svg preserveAspectRatio="xMidYMin meet" viewBox="0 0 400 800">
                  <path
                    className="path-line"
                    d="M 170 40 Q 60 120 120 180 T 280 340 Q 350 430 130 520 T 200 690"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Journey Nodes Chain (Staggered Layout) */}
              <div className="journey-nodes-chain">
                {/* Node 0: Start Point (Completed) */}
                <div className="journey-node-row shift-left">
                  <div className="journey-bubble" style={{ borderColor: '#16a34a', background: '#dcfce7' }}>
                    <span>🌱</span>
                    <div className="journey-check-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                    </div>
                  </div>
                  <div className="journey-node-pill">
                    <span className="journey-node-title">Adventure Start</span>
                    <span className="journey-node-sub">Passport Ready ✨</span>
                  </div>
                </div>

                {/* Nodes 1 to 3: The 3 Stages */}
                {activePlan.stages.map((stage, idx) => {
                  const isCompleted = stagesProgress[stage.stage_number]
                  const isUnlocked =
                    stage.stage_number === 1 || stagesProgress[stage.stage_number - 1]
                  const isCurrent = isUnlocked && !isCompleted

                  // Alternating zig-zag offset (Stage 1 left, Stage 2 right, Stage 3 left)
                  const shiftClass = idx === 0 ? 'shift-left' : idx === 1 ? 'shift-right' : 'shift-left'
                  const nodeEmoji = idx === 0 ? '🦁' : idx === 1 ? '🛶' : '⭐'

                  return (
                    <div
                      key={stage.stage_number}
                      className={`journey-node-row ${shiftClass} ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`}
                      onClick={() => {
                        if (isUnlocked) {
                          handleOpenGame(stage)
                        } else {
                          handleSpeakText(`Complete Stage ${stage.stage_number - 1} first to unlock this stage!`)
                        }
                      }}
                      title={isUnlocked ? `Click to play Stage ${stage.stage_number}` : `Locked — Complete Stage ${stage.stage_number - 1} first`}
                    >
                      {/* Pulse aura on current active stage */}
                      {isCurrent && <div className="journey-pulse-ring" />}

                      {/* Bouncing Here badge on current stage */}
                      {isCurrent && <div className="journey-here-badge">Here! 👇</div>}

                      {/* Circular Bubble Button */}
                      <div
                        className="journey-bubble"
                        style={{
                          borderColor: isCompleted ? '#16a34a' : isCurrent ? selectedSkill.color : '#94a3b8',
                          color: isCompleted ? '#16a34a' : selectedSkill.color,
                        }}
                      >
                        <span>{nodeEmoji}</span>

                        {isCompleted && (
                          <div className="journey-check-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                          </div>
                        )}

                        {!isUnlocked && (
                          <div className="journey-lock-overlay">
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>lock</span>
                          </div>
                        )}
                      </div>

                      {/* Label Pill */}
                      <div className="journey-node-pill">
                        <span className="journey-node-title">
                          Stage {stage.stage_number}: {stage.title.replace(/^Stage \d+:\s*/, '')}
                        </span>
                        <span className="journey-node-sub">
                          {isCompleted ? 'Completed! 🌟 Replay' : isCurrent ? 'Tap to Play! 🚀' : 'Locked 🔒'} • +{stage.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Node 4: Final Achievement Milestone (Trophy 🏆) */}
                {(() => {
                  const allDone = stagesProgress[1] && stagesProgress[2] && stagesProgress[3]
                  return (
                    <div
                      className="journey-node-row shift-center"
                      onClick={() => {
                        if (allDone) {
                          setShowCelebration(true)
                          handleSpeakText('Congratulations! You completed the entire literacy quest! You are a reading champion!')
                        } else {
                          handleSpeakText('Complete all three stages to unlock the golden champion trophy!')
                        }
                      }}
                    >
                      <div className={`trophy-milestone-box ${allDone ? 'unlocked' : ''}`}>
                        <div className="trophy-sparkle-1">✨</div>
                        <div className="trophy-sparkle-2">✨</div>
                        <span>🏆</span>
                      </div>
                      <div className="trophy-pill-tag">
                        {allDone ? '🎉 Champion Quest Unlocked! 🎉' : 'Final Goal • Quest Trophy 🏆'}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
         STEP 3: PLAYABLE MINI-GAME / LETTER QUEST WRITING STUDIO
         ══════════════════════════════════════════════════════════════════ */}
      {activeGameStage && (
        (selectedSkill?.id === 'writing' || activeGameStage.task_data?.type === 'writing_trace') ? (
          /* Letter Quest Handwriting Studio (Matching child-friendly jungle theme) */
          <div className="letter-quest-overlay">
            {/* Top Navigation */}
            <header className="letter-quest-header">
              <button
                className="letter-quest-back-btn"
                onClick={() => setActiveGameStage(null)}
                title="Back to Quest Map"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="letter-quest-title">
                Letter Quest — Practice '{activeWritingLetter}'
              </h1>
              <div className="letter-quest-stars-pill">
                <span>{completedWritingLetters.length * 10}</span>
                <span className="material-symbols-outlined" style={{ color: '#eab308' }}>
                  stars
                </span>
              </div>
            </header>

            {/* Main Content */}
            <main className="letter-quest-main">
              {/* Progress Bar */}
              <div className="letter-quest-progress-wrap">
                <div className="letter-quest-progress-meta-row">
                  <span className="letter-quest-progress-tag">
                    ✏️ Tracing: <strong>Letter '{activeWritingLetter}'</strong> ({(activeGameStage.task_data?.letters_set || ALPHABET_LIST).indexOf(activeWritingLetter) + 1} of {activeGameStage.task_data?.total_letters || 26})
                  </span>
                  <span className="letter-quest-progress-tag tag-score">
                    ⭐ Progress: <strong>{completedWritingLetters.length} / {activeGameStage.task_data?.total_letters || 26}</strong> Completed
                  </span>
                </div>
                <div className="letter-quest-progress-track">
                  <div
                    className="letter-quest-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (completedWritingLetters.length /
                            (activeGameStage.task_data?.total_letters || 26)) *
                          100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* CAIRE Recommendation Card (Glassmorphism) */}
              <div className="letter-quest-caire-card">
                <div className="caire-avatar-floating">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0DpR-pjqWdo2m0MR_7NA7oPi5x-Lsv-W00qC8O4gH5ZFQ8seu2tT8Mt0Bj9cM5VtjiHhfXhXImR9W1zDTz-j-HTjd8rjzCVE3fiVLvpRrLWOM6nYaDmQ0ezsb5lAy0aZEUWPj95njPtiRAgPfbUc7GWHZ1PM6DAzZzT5JQ1GoQcy18MXGmaQw3eymIfOqnEHZWlNQJ19lc1m94EpTgsZap8WPkAKbTLN2_RpL2sQpbq_ouhBTtVc4Dg"
                    alt="CAIRE Robot Mascot"
                  />
                </div>
                <div className="caire-speech-content">
                  <strong>🤖 CAIRE says:</strong>
                  <p>
                    {completedWritingLetters.length === 0
                      ? "Welcome to Letter Quest! Write letters from A to Z. Complete all 26 letters to unlock Stage 2!"
                      : completedWritingLetters.length === (activeGameStage.task_data?.total_letters || 26) - 1
                      ? `Final stretch! Just 1 letter left to complete all 26 letters! Trace '${activeWritingLetter}' carefully!`
                      : `Super effort! You've completed ${completedWritingLetters.length} of ${activeGameStage.task_data?.total_letters || 26} letters! Keep going with '${activeWritingLetter}'!`}
                  </p>
                </div>
              </div>

              {/* Main Bento Grid Layout */}
              <div className="letter-quest-bento-grid">
                {(() => {
                  const lettersList = activeGameStage.task_data?.letters_set || ALPHABET_LIST
                  const totalRequired = activeGameStage.task_data?.total_letters || lettersList.length || 26
                  const currentMeta = ALPHABET_DATA[activeWritingLetter] || {
                    word: activeWritingLetter,
                    emoji: '✏️',
                    phonics: activeGameStage.task_data?.phonics_sound || `Practice writing '${activeWritingLetter}'`,
                    strokes: activeGameStage.task_data?.stroke_steps || [
                      { step: 1, instruction: 'Write clearly on the line', icon: 'draw', color: '#2563eb' },
                    ],
                  }

                  return (
                    <>
                      {/* Left Column: Letter Display & Sound Card */}
                      <div className="letter-quest-left-card">
                        {/* Floating 3D Stickers */}
                        <div className="floating-sticker sticker-1">⭐</div>
                        <div className="floating-sticker sticker-2">✏️</div>
                        <div className="floating-sticker sticker-3">🎨</div>

                        <button
                          className="btn-letter-sound"
                          onClick={() =>
                            handleSpeakText(
                              currentMeta.phonics ||
                              `${activeWritingLetter} says /${activeWritingLetter.toLowerCase()}/. Listen and trace!`
                            )
                          }
                          title="Listen to Phonics Sound"
                        >
                          <span className="material-symbols-outlined">volume_up</span>
                        </button>

                        <div className="giant-letter-display">
                          <span>{activeWritingLetter}</span>
                          <span className="lower">{activeWritingLetter.toLowerCase()}</span>
                        </div>

                        <div className="letter-phonics-label">
                          {currentMeta.phonics ||
                            `/${activeWritingLetter.toLowerCase()}/ as in Bear 🐻`}
                        </div>

                        {/* Quick A-Z Letter Selector Bar */}
                        <div className="letter-quick-strip">
                          <div className="letter-strip-header-row">
                            <span className="letter-strip-title">Alphabet Quick Pick (A–Z)</span>
                            <span className="letter-strip-count-badge">
                              {completedWritingLetters.length} / {totalRequired} Done
                            </span>
                          </div>
                          <div className="letter-strip-scroll">
                            {lettersList.map((ltr: string) => {
                              const isDone = completedWritingLetters.includes(ltr)
                              const isActive = activeWritingLetter === ltr
                              return (
                                <button
                                  key={ltr}
                                  className={`letter-strip-btn ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                                  onClick={() => handleSwitchLetter(ltr)}
                                  title={isDone ? `Letter ${ltr} (Completed ✓)` : `Letter ${ltr}`}
                                >
                                  <span>{ltr}</span>
                                  {isDone && <span className="letter-done-indicator">✓</span>}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Handwriting Ruled Tracing Canvas */}
                      <div className="letter-quest-right-card">
                        {/* Guide/Instructions Header with Navigation Arrows */}
                        <div className="handwriting-header">
                          <div className="handwriting-nav-controls">
                            <button
                              className="btn-letter-nav-arrow"
                              onClick={handlePrevLetter}
                              title="Previous letter"
                            >
                              <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <p className="handwriting-instruction-pill">
                              <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>
                                draw
                              </span>
                              <span>Trace letter '{activeWritingLetter}' along the guide lines ✏️</span>
                            </p>
                            <button
                              className="btn-letter-nav-arrow"
                              onClick={handleNextLetter}
                              title="Next letter"
                            >
                              <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                          </div>

                          {/* Stroke Guide Mini */}
                          <div className="stroke-guide-mini" title="Recommended Stroke Steps">
                            {(currentMeta.strokes || [
                              { step: 1, instruction: 'Trace stroke', icon: 'arrow_downward', color: '#2563eb' },
                            ]).map((st) => (
                              <div className="stroke-step-item" key={st.step}>
                                <span className="stroke-step-num" style={{ color: st.color }}>{st.step}</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: st.color }}>
                                  {st.icon}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Ruled Handwriting Canvas Box */}
                        <div
                          className={`handwriting-canvas-card${
                            writingAccuracyStatus === 'incorrect'
                              ? ' canvas-feedback-incorrect'
                              : writingAccuracyStatus === 'correct'
                              ? ' canvas-feedback-correct'
                              : ''
                          }`}
                        >
                          <div className="handwriting-lines-bg" />
                          <div className="dashed-midline-rule" />
                          <div
                            className="faint-letter-guide"
                            style={{ fontSize: activeWritingLetter.length > 2 ? '90px' : undefined }}
                          >
                            {activeWritingLetter}
                          </div>

                          {/* ── Stroke Direction Arrow Overlay ── */}
                          {showLetterArrows && LETTER_STROKE_ARROWS[activeWritingLetter] && (
                            <svg
                              className="letter-stroke-arrow-overlay"
                              viewBox="0 0 800 420"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <defs>
                                {LETTER_STROKE_ARROWS[activeWritingLetter].map((arrow) => (
                                  <marker
                                    key={`marker-${arrow.step}`}
                                    id={`arrowhead-${activeWritingLetter}-${arrow.step}`}
                                    markerWidth="7"
                                    markerHeight="7"
                                    refX="5"
                                    refY="3.5"
                                    orient="auto"
                                  >
                                    <polygon
                                      points="0 0, 7 3.5, 0 7"
                                      fill={arrow.color}
                                      opacity="0.85"
                                    />
                                  </marker>
                                ))}
                              </defs>

                              {LETTER_STROKE_ARROWS[activeWritingLetter].map((arrow) => (
                                <g key={`stroke-${arrow.step}`}>
                                  {/* Dashed animated guide path */}
                                  <path
                                    d={arrow.d}
                                    fill="none"
                                    stroke={arrow.color}
                                    strokeWidth="4"
                                    strokeOpacity="0.55"
                                    strokeDasharray="10 6"
                                    strokeLinecap="round"
                                    className="guide-dashed-arrow-path"
                                    markerEnd={`url(#arrowhead-${activeWritingLetter}-${arrow.step})`}
                                  />
                                  {/* Numbered start dot */}
                                  <circle
                                    cx={arrow.startX}
                                    cy={arrow.startY}
                                    r="13"
                                    fill={arrow.color}
                                    opacity="0.82"
                                  />
                                  <text
                                    x={arrow.startX}
                                    y={arrow.startY + 5}
                                    textAnchor="middle"
                                    fill="#ffffff"
                                    fontSize="13"
                                    fontWeight="900"
                                    fontFamily="Quicksand, sans-serif"
                                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                                  >
                                    {arrow.step}
                                  </text>
                                </g>
                              ))}
                            </svg>
                          )}

                          <canvas
                            ref={canvasRef}
                            width={800}
                            height={420}
                            className="tracing-canvas"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>

                        {/* Canvas Toolbar */}
                        <div className="canvas-tools-bar">
                          <div className="pen-colors-row">
                            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#64748b' }}>
                              Ink:
                            </span>
                            {[
                              { color: '#0058be', name: 'Blue' },
                              { color: '#16a34a', name: 'Green' },
                              { color: '#9333ea', name: 'Purple' },
                              { color: '#ea580c', name: 'Orange' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                className={`pen-color-dot ${penColor === c.color ? 'selected' : ''}`}
                                style={{ backgroundColor: c.color }}
                                onClick={() => setPenColor(c.color)}
                                title={c.name}
                              />
                            ))}
                          </div>

                          <div className="canvas-actions-row">
                            {/* Toggle stroke direction arrows */}
                            <button
                              className={`btn-toggle-arrows${showLetterArrows ? ' active' : ''}`}
                              onClick={() => setShowLetterArrows((v) => !v)}
                              title={showLetterArrows ? 'Hide stroke guide arrows' : 'Show stroke guide arrows'}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>gesture</span>
                              <span>{showLetterArrows ? 'Hide Arrows' : 'Show Arrows'}</span>
                            </button>

                            <button
                              className="btn-demo-fill"
                              onClick={handleDemoFillLetters}
                              title="Fast Test: Mark 25 letters complete to test completing Z"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>bolt</span>
                              <span>Demo Fill (25/26)</span>
                            </button>

                            <button className="btn-clear-canvas" onClick={clearCanvas}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                                refresh
                              </span>
                              <span>Clear &amp; Retry</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Bottom Action Area */}
              <div className="letter-quest-bottom">
                <div
                  className={`letter-quest-encouragement-pill${
                    writingAccuracyStatus === 'incorrect'
                      ? ' status-incorrect'
                      : writingAccuracyStatus === 'correct'
                      ? ' status-correct'
                      : ''
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color:
                        writingAccuracyStatus === 'incorrect'
                          ? '#ef4444'
                          : writingAccuracyStatus === 'correct'
                          ? '#16a34a'
                          : '#16a34a',
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {writingAccuracyStatus === 'incorrect'
                      ? 'cancel'
                      : writingAccuracyStatus === 'correct'
                      ? 'check_circle'
                      : 'mood'}
                  </span>
                  <span>{writingFeedback}</span>
                  {lastAccuracyScore !== null && (
                    <span
                      className={`accuracy-pill-score ${
                        writingAccuracyStatus === 'incorrect' ? 'badge-bad' : 'badge-good'
                      }`}
                    >
                      {lastAccuracyScore}%
                    </span>
                  )}
                  {writingAccuracyStatus !== 'incorrect' && (
                    <span className="stars-add">+10 Stars</span>
                  )}
                </div>

                <button className="chunky-btn-check" onClick={handleCheckWriting}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {completedWritingLetters.length === (activeGameStage.task_data?.total_letters || 26) - 1 &&
                    !completedWritingLetters.includes(activeWritingLetter)
                      ? 'emoji_events'
                      : 'fact_check'}
                  </span>
                  <span>
                    {completedWritingLetters.length === (activeGameStage.task_data?.total_letters || 26) - 1 &&
                    !completedWritingLetters.includes(activeWritingLetter)
                      ? `Check & Complete Stage (${activeGameStage.task_data?.total_letters || 26}/${activeGameStage.task_data?.total_letters || 26}) 🏆`
                      : `Check Letter '${activeWritingLetter}' & Next ✏️`}
                  </span>
                </button>
              </div>
            </main>
          </div>
        ) : activeGameStage.task_data?.type === 'reading_speak_repeat' ? (
          /* ── Reading Speak & Repeat Adventure Studio ── */
          <ReadingStudio
            stage={activeGameStage as any}
            skillAvatar={selectedSkill?.guide_avatar || '🦌'}
            animalGuide={selectedSkill?.animal_guide || 'Ruby the Deer'}
            skillColor={selectedSkill?.color || '#7c3aed'}
            childName={childDisplayName}
            onClose={() => setActiveGameStage(null)}
            onComplete={async (stageNumber) => {
              const currentStage = activeGameStage
              try {
                await completeStageApi(
                  selectedSkill?.id || 'reading',
                  stageNumber,
                  currentStage?.title || '',
                  100,
                  currentStage?.xp_reward || 75,
                  0,
                  1,
                  currentUser?.email
                )
              } catch (e) {
                console.warn('Stage save warning:', e)
              }
              setStagesProgress((prev) => ({ ...prev, [stageNumber]: true }))
              setLastCompletedStage(currentStage)
              setActiveGameStage(null)
              setShowCelebration(true)
            }}
          />
        ) : activeGameStage.task_data?.type === 'listening_comprehension' ? (
          /* ── Listening Comprehension Adventure Studio ── */
          <ListeningStudio
            stage={activeGameStage as any}
            skillAvatar={selectedSkill?.guide_avatar || '🐻'}
            animalGuide={selectedSkill?.animal_guide || 'Barnaby the Bear'}
            skillColor={selectedSkill?.color || '#0284c7'}
            childName={childDisplayName}
            onClose={() => setActiveGameStage(null)}
            onComplete={async (stageNumber) => {
              const currentStage = activeGameStage
              try {
                await completeStageApi(
                  selectedSkill?.id || 'listening',
                  stageNumber,
                  currentStage?.title || '',
                  100,
                  currentStage?.xp_reward || 75,
                  0,
                  1,
                  currentUser?.email
                )
              } catch (e) {
                console.warn('Stage save warning:', e)
              }
              setStagesProgress((prev) => ({ ...prev, [stageNumber]: true }))
              setLastCompletedStage(currentStage)
              setActiveGameStage(null)
              setShowCelebration(true)
            }}
          />
        ) : (
          /* Standard Quiz Modal for Speaking, Listening, and other skills */
          <div className="game-modal-backdrop" onClick={() => setActiveGameStage(null)}>
            <div className="game-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="game-modal-header">
                <span className="game-stage-pill">
                  Stage {activeGameStage.stage_number} • {activeGameStage.difficulty}
                </span>
                <button className="btn-game-close" onClick={() => setActiveGameStage(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Mascot Dialogue */}
              <div className="game-mascot-dialogue">
                <div className="game-mascot-avatar">{selectedSkill?.guide_avatar || '🦁'}</div>
                <div className="game-mascot-speech">
                  <strong>{selectedSkill?.animal_guide} says:</strong> &quot;Hello young explorer!
                  Look closely, listen to the words, and choose the best answer to clear this stage!&quot;
                </div>
              </div>

              {/* Question prompt */}
              <div className="game-question-box">
                <h3 className="game-question-text">{activeGameStage.task_data.question || 'Choose the correct answer:'}</h3>
                <button
                  className="btn-speak-question"
                  onClick={() => handleSpeakText(activeGameStage.task_data.question || '')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    volume_up
                  </span>
                  <span>Listen to Question</span>
                </button>
              </div>

              {/* Options selection */}
              <div className="game-options-grid">
                {(activeGameStage.task_data.options || []).map((opt, idx) => {
                  let statusClass = ''
                  if (selectedOption === idx) {
                    statusClass = answerStatus === 'correct' ? 'correct' : 'wrong'
                  }
                  return (
                    <button
                      key={idx}
                      className={`btn-option-card ${statusClass}`}
                      onClick={() => handleSelectOption(idx)}
                    >
                      <span>{opt}</span>
                      {selectedOption === idx && answerStatus === 'correct' && (
                        <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>
                          check_circle
                        </span>
                      )}
                      {selectedOption === idx && answerStatus === 'wrong' && (
                        <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>
                          cancel
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Hint & Attempts Section */}
              <div className="game-hint-section">
                {!showHint ? (
                  <button
                    className="btn-game-hint"
                    onClick={() => {
                      setShowHint(true)
                      setHintsUsedCount((h) => h + 1)
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      lightbulb
                    </span>
                    <span>Ask {selectedSkill?.animal_guide.split(' ')[0]} for a Hint</span>
                  </button>
                ) : (
                  <div className="game-hint-box">
                    💡 <strong>Hint:</strong> {activeGameStage.task_data.hint}
                  </div>
                )}

                {attemptsCount > 1 && (
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
                    Attempt #{attemptsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      )}


      {/* ══════════════════════════════════════════════════════════════════
         STEP 4: CELEBRATION MODAL (Reward & Map Progression)
         ══════════════════════════════════════════════════════════════════ */}
      {showCelebration && lastCompletedStage && (
        <div className="celebration-modal-backdrop">
          <div className="celebration-modal-box">
            <div className="celebration-stars-row">
              <span>⭐</span>
              <span>🌟</span>
              <span>⭐</span>
            </div>

            <h2 className="celebration-heading">
              🎉 Stage {lastCompletedStage.stage_number} Conquered!
            </h2>
            <p className="celebration-sub">
              Fantastic work! <strong>{selectedSkill?.animal_guide}</strong> is super proud of your
              effort and focus!
            </p>

            <div className="celebration-reward-pill">
              <span>+{lastCompletedStage.xp_reward} XP Earned</span>
              <span>•</span>
              <span>3 Golden Stars 🏅</span>
            </div>

            <button
              className="btn-continue-map"
              onClick={() => {
                setShowCelebration(false)
                handleSpeakText('Great job! Moving to the next adventure on your map!')
              }}
            >
              <span>Return to Map &amp; Continue Quest</span>
              <span className="material-symbols-outlined">map</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
