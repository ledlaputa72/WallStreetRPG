export type PageType = 'character' | 'partners' | 'items' | 'battle' | 'dungeon' | 'shop' | 'rewards'

/** Market candle (OHLCV) - shared by API and battle/simulation */
export interface MarketCandle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Character {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  atk: number
  def: number
  spd: number
  crt: number
  actionReady: boolean
}

export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  isBoss: boolean
}

export interface Item {
  id: string
  name: string
  level: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  type: 'weapon' | 'armor' | 'accessory'
  equipped: boolean
}

export interface Partner {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  inParty: boolean
  unlocked: boolean
  position?: 'front' | 'back'
  slot?: number
}

export interface Dungeon {
  id: string
  name: string
  difficulty: number
  requiredTickets: number
  loot: string[]
  image?: string
}

export interface Quest {
  id: string
  title: string
  description: string
  progress: number
  maxProgress: number
  completed: boolean
  reward: string
}
