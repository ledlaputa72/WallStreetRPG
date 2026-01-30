// Character Types
export interface Character {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  actionReady: boolean
}

export interface Enemy {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  actionReady: boolean
}

export interface Boss {
  id: string
  name: string
  hp: number
  maxHp: number
}

// Item Types
export interface InventoryItem {
  id: string
  name: string
  level: number
  rarity: 'legendary' | 'epic' | 'rare' | 'common'
}

// Skill Types
export interface Skill {
  id: string
  name: string
  level: number
  upCost: number
}

// Chart Types
export type ChartType = 'candle' | 'area' | 'line'
export type CandleCount = 20 | 30 | 40
export type SpeedMultiplier = 1 | 2 | 3 | 4 | 5
export type GameState = 'IDLE' | 'LOADING' | 'PLAYING'
