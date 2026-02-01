/**
 * Stock Card Types and Definitions
 */

export type StockSector = 'IT' | 'Value' | 'Defensive' | 'Dividend' | 'Energy'
export type StockRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface StockCard {
  id: string
  symbol: string
  stockName: string
  sector: StockSector
  rarity: StockRarity
  basePrice: number // Historical base price (before inflation)
  era: [number, number] // [startYear, endYear]
  description?: string
}

/**
 * Sector color mapping for UI
 */
export const SECTOR_COLORS: Record<StockSector, string> = {
  IT: '#ef4444', // Red
  Value: '#3b82f6', // Blue
  Defensive: '#22c55e', // Green (Emerald)
  Dividend: '#a855f7', // Purple/Gold
  Energy: '#f59e0b', // Amber/Orange
}

/**
 * Rarity color mapping for UI
 */
export const RARITY_COLORS: Record<StockRarity, string> = {
  common: '#6b7280', // Gray
  rare: '#3b82f6', // Blue
  epic: '#a855f7', // Purple
  legendary: '#fbbf24', // Gold
}

/**
 * Rarity glow effects
 */
export const RARITY_GLOW: Record<StockRarity, string> = {
  common: 'none',
  rare: '0 0 10px rgba(59, 130, 246, 0.5)',
  epic: '0 0 20px rgba(168, 85, 247, 0.7)',
  legendary: '0 0 30px rgba(251, 191, 36, 0.8)',
}

/**
 * Stock database - Historical stocks organized by sector
 */
export const STOCK_DATABASE: StockCard[] = [
  // IT Sector (Red)
  { id: 'msft', symbol: 'MSFT', stockName: 'Microsoft', sector: 'IT', rarity: 'legendary', basePrice: 25, era: [1986, 2025] },
  { id: 'aapl', symbol: 'AAPL', stockName: 'Apple', sector: 'IT', rarity: 'legendary', basePrice: 20, era: [1980, 2025] },
  { id: 'googl', symbol: 'GOOGL', stockName: 'Google', sector: 'IT', rarity: 'legendary', basePrice: 85, era: [2004, 2025] },
  { id: 'meta', symbol: 'META', stockName: 'Meta', sector: 'IT', rarity: 'epic', basePrice: 38, era: [2012, 2025] },
  { id: 'nvda', symbol: 'NVDA', stockName: 'NVIDIA', sector: 'IT', rarity: 'epic', basePrice: 12, era: [1999, 2025] },
  { id: 'intc', symbol: 'INTC', stockName: 'Intel', sector: 'IT', rarity: 'rare', basePrice: 30, era: [1980, 2025] },
  { id: 'csco', symbol: 'CSCO', stockName: 'Cisco', sector: 'IT', rarity: 'rare', basePrice: 20, era: [1990, 2025] },
  { id: 'ibm', symbol: 'IBM', stockName: 'IBM', sector: 'IT', rarity: 'rare', basePrice: 100, era: [1950, 2025] },
  { id: 'orcl', symbol: 'ORCL', stockName: 'Oracle', sector: 'IT', rarity: 'common', basePrice: 15, era: [1986, 2025] },
  
  // Value Sector (Blue)
  { id: 'brk', symbol: 'BRK', stockName: 'Berkshire Hathaway', sector: 'Value', rarity: 'legendary', basePrice: 200, era: [1965, 2025] },
  { id: 'jpm', symbol: 'JPM', stockName: 'JPMorgan Chase', sector: 'Value', rarity: 'epic', basePrice: 50, era: [1970, 2025] },
  { id: 'bac', symbol: 'BAC', stockName: 'Bank of America', sector: 'Value', rarity: 'rare', basePrice: 30, era: [1970, 2025] },
  { id: 'wmt', symbol: 'WMT', stockName: 'Walmart', sector: 'Value', rarity: 'epic', basePrice: 25, era: [1970, 2025] },
  { id: 'ge', symbol: 'GE', stockName: 'General Electric', sector: 'Value', rarity: 'rare', basePrice: 30, era: [1920, 2025] },
  { id: 'gm', symbol: 'GM', stockName: 'General Motors', sector: 'Value', rarity: 'common', basePrice: 40, era: [1920, 2025] },
  
  // Defensive Sector (Green)
  { id: 'ko', symbol: 'KO', stockName: 'Coca-Cola', sector: 'Defensive', rarity: 'epic', basePrice: 45, era: [1950, 2025] },
  { id: 'pg', symbol: 'PG', stockName: 'Procter & Gamble', sector: 'Defensive', rarity: 'rare', basePrice: 40, era: [1950, 2025] },
  { id: 'jnj', symbol: 'JNJ', stockName: 'Johnson & Johnson', sector: 'Defensive', rarity: 'epic', basePrice: 50, era: [1950, 2025] },
  { id: 'pep', symbol: 'PEP', stockName: 'PepsiCo', sector: 'Defensive', rarity: 'rare', basePrice: 35, era: [1970, 2025] },
  { id: 'cl', symbol: 'CL', stockName: 'Colgate-Palmolive', sector: 'Defensive', rarity: 'common', basePrice: 30, era: [1950, 2025] },
  
  // Dividend Sector (Purple/Gold)
  { id: 't', symbol: 'T', stockName: 'AT&T', sector: 'Dividend', rarity: 'rare', basePrice: 25, era: [1920, 2025] },
  { id: 'vz', symbol: 'VZ', stockName: 'Verizon', sector: 'Dividend', rarity: 'rare', basePrice: 30, era: [1980, 2025] },
  { id: 'o', symbol: 'O', stockName: 'Realty Income', sector: 'Dividend', rarity: 'epic', basePrice: 20, era: [1994, 2025] },
  { id: 'spg', symbol: 'SPG', stockName: 'Simon Property', sector: 'Dividend', rarity: 'common', basePrice: 25, era: [1993, 2025] },
  
  // Energy Sector (Amber/Orange)
  { id: 'xom', symbol: 'XOM', stockName: 'Exxon Mobil', sector: 'Energy', rarity: 'epic', basePrice: 70, era: [1970, 2025] },
  { id: 'cvx', symbol: 'CVX', stockName: 'Chevron', sector: 'Energy', rarity: 'epic', basePrice: 60, era: [1970, 2025] },
  { id: 'std_oil', symbol: 'STD_OIL', stockName: 'Standard Oil', sector: 'Energy', rarity: 'legendary', basePrice: 60, era: [1920, 1970] },
  { id: 'slb', symbol: 'SLB', stockName: 'Schlumberger', sector: 'Energy', rarity: 'rare', basePrice: 40, era: [1970, 2025] },
]

/**
 * Get stock card by symbol
 */
export function getStockBySymbol(symbol: string): StockCard | undefined {
  return STOCK_DATABASE.find(s => s.symbol === symbol)
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: StockSector): StockCard[] {
  return STOCK_DATABASE.filter(s => s.sector === sector)
}

/**
 * Get stocks available in a specific year
 */
export function getStocksByYear(year: number): StockCard[] {
  return STOCK_DATABASE.filter(s => s.era[0] <= year && s.era[1] >= year)
}

/**
 * Get stocks by rarity
 */
export function getStocksByRarity(rarity: StockRarity): StockCard[] {
  return STOCK_DATABASE.filter(s => s.rarity === rarity)
}
