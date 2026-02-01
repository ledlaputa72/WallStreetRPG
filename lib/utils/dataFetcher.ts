import { applyInflationToCandles } from './inflationEngine'
import type { MarketCandle } from '../stores/useGameStore'

/**
 * Data Fetcher Utility
 * Fetches historical stock data and S&P 500 data, applies inflation correction,
 * and synchronizes timelines
 */

export interface StockDataResult {
  symbol: string
  stockName: string
  year: number
  data: MarketCandle[]
  success: boolean
}

export interface SP500DataResult {
  year: number
  data: MarketCandle[]
  success: boolean
}

/**
 * Fetch historical stock data for a specific symbol and year
 * Uses Alpha Vantage API or generates synthetic data
 */
export async function fetchHistoricalStockData(
  symbol: string,
  year: number
): Promise<StockDataResult> {
  try {
    // Try to fetch from API first
    const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_API_KEY
    
    if (apiKey && apiKey !== 'demo') {
      // For historical data, we'll use the existing API route
      // The API route already handles historical data generation
      const response = await fetch(`/api/market?type=historical&symbol=${symbol}&year=${year}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          // Apply inflation correction
          const adjustedData: MarketCandle[] = applyInflationToCandles(result.data, year)
          
          return {
            symbol: result.symbol || symbol,
            stockName: result.stockName || symbol,
            year: result.year || year,
            data: adjustedData,
            success: true,
          }
        }
      }
    }
    
    // Fallback: Use existing API route which generates synthetic data
    const response = await fetch(`/api/market?type=historical`)
    const result = await response.json()
    
    if (result.success && result.data && result.data.length > 0) {
      // Apply inflation correction
      const adjustedData: MarketCandle[] = applyInflationToCandles(result.data, result.year || year)
      
      return {
        symbol: result.symbol || symbol,
        stockName: result.stockName || symbol,
        year: result.year || year,
        data: adjustedData,
        success: true,
      }
    }
    
    throw new Error('Failed to fetch stock data')
  } catch (error) {
    console.error('Error fetching historical stock data:', error)
    // Return empty result on error
    return {
      symbol,
      stockName: symbol,
      year,
      data: [],
      success: false,
    }
  }
}

/**
 * Fetch S&P 500 index data for a specific year
 * Since Alpha Vantage doesn't provide historical S&P 500 data easily,
 * we'll generate synthetic data that represents market trends
 */
export async function fetchSP500Data(year: number): Promise<SP500DataResult> {
  try {
    // Generate synthetic S&P 500 data based on historical trends
    // In production, you might use a different data source
    const sp500Data = generateSP500Data(year)
    
    // Apply inflation correction
    const adjustedData: MarketCandle[] = applyInflationToCandles(sp500Data, year)
    
    return {
      year,
      data: adjustedData,
      success: true,
    }
  } catch (error) {
    console.error('Error fetching S&P 500 data:', error)
    return {
      year,
      data: [],
      success: false,
    }
  }
}

/**
 * Generate synthetic S&P 500 data for a given year
 * Based on historical market trends and events
 */
function generateSP500Data(year: number): MarketCandle[] {
  // Historical S&P 500 approximate levels (inflation-adjusted base)
  const baseLevels: Record<number, number> = {
    1925: 15,
    1930: 12,
    1940: 10,
    1950: 15,
    1960: 50,
    1970: 80,
    1980: 100,
    1990: 300,
    2000: 1400,
    2010: 1100,
    2020: 3200,
    2024: 5000,
  }
  
  // Find closest base level
  const years = Object.keys(baseLevels).map(Number).sort((a, b) => a - b)
  let baseLevel = 100
  for (let i = 0; i < years.length; i++) {
    if (year <= years[i] || i === years.length - 1) {
      baseLevel = baseLevels[years[i]]
      break
    }
  }
  
  // Market events that affect volatility
  const marketEvents: Record<number, { type: 'crash' | 'boom' | 'volatile'; magnitude: number }> = {
    1929: { type: 'crash', magnitude: 0.4 },
    1930: { type: 'crash', magnitude: 0.3 },
    2000: { type: 'crash', magnitude: 0.3 },
    2008: { type: 'crash', magnitude: 0.4 },
    2020: { type: 'volatile', magnitude: 0.35 },
  }
  
  const event = marketEvents[year]
  const volatility = event ? (event.magnitude * 0.03) : 0.015
  
  // Generate 252 trading days
  const candles: MarketCandle[] = []
  let currentPrice = baseLevel
  const startDate = new Date(year, 0, 2) // January 2nd
  
  for (let day = 0; day < 252; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue
    }
    
    // Daily change with trend
    const trend = event?.type === 'crash' ? -0.001 : event?.type === 'boom' ? 0.0015 : 0.0005
    const dailyChange = (Math.random() - 0.5) * volatility * 2 + trend
    const open = currentPrice
    const close = Math.max(0.01, open * (1 + dailyChange))
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = Math.floor(1000000 * (0.8 + Math.random() * 0.4))
    
    candles.push({
      time: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })
    
    currentPrice = close
  }
  
  return candles
}

/**
 * Synchronize multiple stock datasets and S&P 500 to the same timeline
 * Ensures all arrays have the same length (252 days) and align by date
 */
export function synchronizeTimeline(
  stocks: Array<{ symbol: string; data: MarketCandle[] }>,
  sp500: MarketCandle[]
): {
  stocks: Array<{ symbol: string; data: MarketCandle[] }>
  sp500: MarketCandle[]
} {
  if (stocks.length === 0) {
    return { stocks: [], sp500: sp500.slice(0, 252) }
  }
  
  // Find the minimum length
  const minLength = Math.min(
    ...stocks.map(s => s.data.length),
    sp500.length,
    252 // Max trading days in a year
  )
  
  // Trim all arrays to the same length
  const synchronizedStocks = stocks.map(stock => ({
    symbol: stock.symbol,
    data: stock.data.slice(0, minLength),
  }))
  
  const synchronizedSP500 = sp500.slice(0, minLength)
  
  return {
    stocks: synchronizedStocks,
    sp500: synchronizedSP500,
  }
}

/**
 * Fetch multiple stocks in parallel
 */
export async function fetchMultipleStocks(
  symbols: string[],
  year: number
): Promise<Array<{ symbol: string; stockName: string; data: MarketCandle[] }>> {
  const promises = symbols.map(symbol => fetchHistoricalStockData(symbol, year))
  const results = await Promise.all(promises)
  
  return results
    .filter(r => r.success && r.data.length > 0)
    .map(r => ({
      symbol: r.symbol,
      stockName: r.stockName,
      data: r.data,
    }))
}
