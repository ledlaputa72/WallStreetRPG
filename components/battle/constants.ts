import type { Character, Enemy, Boss, InventoryItem, Skill } from './types'

// Mock Hero Data
export const mockHero: Character = {
  id: '1',
  name: 'Eldrin',
  level: 45,
  hp: 8500,
  maxHp: 10000,
  mp: 650,
  maxMp: 800,
  actionReady: true,
}

// Mock Partners Data
export const mockPartners: Character[] = [
  { id: '2', name: 'Luna', level: 42, hp: 7200, maxHp: 8000, mp: 900, maxMp: 1000, actionReady: true },
  { id: '3', name: 'Kai', level: 40, hp: 9000, maxHp: 9500, mp: 450, maxMp: 600, actionReady: false },
  { id: '4', name: 'Zara', level: 43, hp: 6800, maxHp: 7500, mp: 1100, maxMp: 1200, actionReady: true },
]

// Mock Enemies Data
export const mockEnemies: Enemy[] = [
  { id: '5', name: 'Goblin', level: 30, hp: 3000, maxHp: 4000, actionReady: true },
  { id: '6', name: 'Orc', level: 35, hp: 5000, maxHp: 6000, actionReady: false },
  { id: '7', name: 'Troll', level: 40, hp: 7000, maxHp: 8000, actionReady: true },
]

// Mock Boss Data
export const mockBoss: Boss = { 
  id: 'boss', 
  name: 'Wall Street Index', 
  hp: 125000, 
  maxHp: 200000 
}

// Mock Inventory Data
export const mockInventory: InventoryItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `item-${i}`,
  name: i === 0 ? 'Legendary Sword' : i === 5 ? 'Epic Shield' : `Item ${i + 1}`,
  level: i === 0 ? 50 : i === 5 ? 45 : ((i * 7) % 50) + 1,
  rarity: i === 0 ? 'legendary' : i === 5 ? 'epic' : i % 3 === 0 ? 'rare' : 'common' as const,
}))

// Mock Skills Data
export const mockSkills: Skill[] = Array.from({ length: 10 }, (_, i) => ({
  id: `skill-${i}`,
  name: i === 0 ? 'Power Strike' : i === 1 ? 'Fire Blast' : i === 5 ? 'Heal' : `Skill ${i + 1}`,
  level: (i % 5) + 1,
  upCost: 1000 + (i * 250),
}))
