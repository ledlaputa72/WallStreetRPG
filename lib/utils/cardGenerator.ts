import type { StockCard, StockRarity } from '../types/stock'
import { getStocksByYear, STOCK_DATABASE } from '../types/stock'

/**
 * Card Generator - Generates stock cards based on AUM tier
 */

export type AUMTier = 'Penny' | 'Value' | 'Growth' | 'BlueChip'

export interface AUMTierConfig {
  min: number
  max: number
  name: string
  rarityWeights: Record<StockRarity, number> // Probability weights
  sectorDistribution: Record<string, number> // Sector probability weights
}

export const AUM_TIERS: Record<AUMTier, AUMTierConfig> = {
  Penny: {
    min: 1000,
    max: 9999,
    name: 'Penny Stocks',
    rarityWeights: {
      common: 0.6,
      rare: 0.3,
      epic: 0.08,
      legendary: 0.02,
    },
    sectorDistribution: {
      IT: 0.3,
      Value: 0.2,
      Defensive: 0.2,
      Dividend: 0.15,
      Energy: 0.15,
    },
  },
  Value: {
    min: 10000,
    max: 99999,
    name: 'Value Stocks',
    rarityWeights: {
      common: 0.4,
      rare: 0.4,
      epic: 0.15,
      legendary: 0.05,
    },
    sectorDistribution: {
      IT: 0.25,
      Value: 0.3,
      Defensive: 0.25,
      Dividend: 0.1,
      Energy: 0.1,
    },
  },
  Growth: {
    min: 100000,
    max: 999999,
    name: 'Growth Stocks',
    rarityWeights: {
      common: 0.2,
      rare: 0.35,
      epic: 0.3,
      legendary: 0.15,
    },
    sectorDistribution: {
      IT: 0.4,
      Value: 0.2,
      Defensive: 0.15,
      Dividend: 0.15,
      Energy: 0.1,
    },
  },
  BlueChip: {
    min: 1000000,
    max: 10000000,
    name: 'Blue Chip',
    rarityWeights: {
      common: 0.1,
      rare: 0.25,
      epic: 0.4,
      legendary: 0.25,
    },
    sectorDistribution: {
      IT: 0.3,
      Value: 0.25,
      Defensive: 0.2,
      Dividend: 0.15,
      Energy: 0.1,
    },
  },
}

/**
 * Determine AUM tier from amount
 */
export function getAUMTier(aum: number): AUMTier {
  if (aum < 10000) return 'Penny'
  if (aum < 100000) return 'Value'
  if (aum < 1000000) return 'Growth'
  return 'BlueChip'
}

/**
 * Weighted random selection
 */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return items[i]
    }
  }
  
  return items[items.length - 1]
}

/**
 * Generate stock cards based on AUM and year
 */
export function generateStockCards(
  aum: number,
  count: number,
  year: number
): StockCard[] {
  const tier = getAUMTier(aum)
  const config = AUM_TIERS[tier]
  
  // Get stocks available in this year
  const availableStocks = getStocksByYear(year)
  
  if (availableStocks.length === 0) {
    console.warn(`No stocks available for year ${year}`)
    return []
  }
  
  const selectedCards: StockCard[] = []
  const usedIds = new Set<string>()
  
  for (let i = 0; i < count; i++) {
    // Filter by sector distribution
    const sector = weightedRandom(
      Object.keys(config.sectorDistribution),
      Object.values(config.sectorDistribution)
    ) as string
    
    let sectorStocks = availableStocks.filter(
      s => s.sector === sector && !usedIds.has(s.id)
    )
    
    // If no stocks in this sector, try any available
    if (sectorStocks.length === 0) {
      sectorStocks = availableStocks.filter(s => !usedIds.has(s.id))
    }
    
    if (sectorStocks.length === 0) {
      // Reset and allow duplicates if we run out
      sectorStocks = availableStocks
      usedIds.clear()
    }
    
    // Filter by rarity weights
    const rarity = weightedRandom(
      Object.keys(config.rarityWeights) as StockRarity[],
      Object.values(config.rarityWeights)
    )
    
    let rarityStocks = sectorStocks.filter(s => s.rarity === rarity)
    
    // If no stocks with this rarity, use any from sector
    if (rarityStocks.length === 0) {
      rarityStocks = sectorStocks
    }
    
    // Random selection from filtered stocks
    const selected = rarityStocks[Math.floor(Math.random() * rarityStocks.length)]
    
    if (selected) {
      // Create a unique card instance with unique ID to avoid React key conflicts
      const uniqueCard: StockCard = {
        ...selected,
        id: `${selected.id}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      selectedCards.push(uniqueCard)
      usedIds.add(selected.id) // Track original ID to avoid too many duplicates
    }
  }
  
  return selectedCards
}

/**
 * Generate initial draft cards (3x3 = 9 cards)
 */
export function generateInitialDraft(aum: number, year: number): StockCard[] {
  return generateStockCards(aum, 9, year)
}

/**
 * Generate quarterly draft cards (1x3 = 3 cards)
 */
export function generateQuarterlyDraft(aum: number, year: number): StockCard[] {
  return generateStockCards(aum, 3, year)
}

/**
 * Get sector distribution preview for AUM tier
 */
export function getSectorDistributionPreview(aum: number): Record<string, number> {
  const tier = getAUMTier(aum)
  return AUM_TIERS[tier].sectorDistribution
}
