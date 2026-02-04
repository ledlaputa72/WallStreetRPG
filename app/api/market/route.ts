import { NextResponse } from 'next/server'
import type { MarketCandle } from '@/lib/types'

interface AlphaVantageTimeSeriesData {
  '1. open': string
  '2. high': string
  '3. low': string
  '4. close': string
  '5. volume': string
}

interface AlphaVantageIntradayResponse {
  'Meta Data': {
    '1. Information': string
    '2. Symbol': string
    '3. Last Refreshed': string
    '4. Interval': string
    '5. Output Size': string
    '6. Time Zone': string
  }
  [key: string]: Record<string, AlphaVantageTimeSeriesData> | object
}

interface AlphaVantageGlobalQuoteResponse {
  'Global Quote': {
    '01. symbol': string
    '02. open': string
    '03. high': string
    '04. low': string
    '05. price': string
    '06. volume': string
    '07. latest trading day': string
    '08. previous close': string
    '09. change': string
    '10. change percent': string
  }
}

// Historical stock symbols with era-appropriate data (API + game card symbols)
const HISTORICAL_STOCKS: { symbol: string; name: string; era: [number, number]; basePrice: number }[] = [
  // 1920s-1940s
  { symbol: 'GM', name: 'General Motors', era: [1920, 2025], basePrice: 40 },
  { symbol: 'GE', name: 'General Electric', era: [1920, 2025], basePrice: 30 },
  { symbol: 'US_STEEL', name: 'U.S. Steel', era: [1920, 2000], basePrice: 50 },
  { symbol: 'AT&T', name: 'AT&T', era: [1920, 2025], basePrice: 25 },
  { symbol: 'T', name: 'AT&T', era: [1920, 2025], basePrice: 25 },
  { symbol: 'STD_OIL', name: 'Standard Oil', era: [1920, 1970], basePrice: 60 },
  // 1950s-1980s
  { symbol: 'IBM', name: 'IBM', era: [1950, 2025], basePrice: 100 },
  { symbol: 'XOM', name: 'Exxon Mobil', era: [1970, 2025], basePrice: 70 },
  { symbol: 'KO', name: 'Coca-Cola', era: [1950, 2025], basePrice: 45 },
  { symbol: 'DIS', name: 'Disney', era: [1960, 2025], basePrice: 35 },
  { symbol: 'MCD', name: "McDonald's", era: [1970, 2025], basePrice: 50 },
  { symbol: 'PG', name: 'Procter & Gamble', era: [1950, 2025], basePrice: 40 },
  { symbol: 'PEP', name: 'PepsiCo', era: [1970, 2025], basePrice: 35 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', era: [1950, 2025], basePrice: 50 },
  { symbol: 'BAC', name: 'Bank of America', era: [1970, 2025], basePrice: 30 },
  { symbol: 'WMT', name: 'Walmart', era: [1970, 2025], basePrice: 25 },
  { symbol: 'JPM', name: 'JPMorgan Chase', era: [1970, 2025], basePrice: 50 },
  { symbol: 'SLB', name: 'Schlumberger', era: [1970, 2025], basePrice: 40 },
  { symbol: 'CVX', name: 'Chevron', era: [1970, 2025], basePrice: 60 },
  // 1990s-2000s
  { symbol: 'MSFT', name: 'Microsoft', era: [1986, 2025], basePrice: 25 },
  { symbol: 'AAPL', name: 'Apple', era: [1980, 2025], basePrice: 20 },
  { symbol: 'INTC', name: 'Intel', era: [1980, 2025], basePrice: 30 },
  { symbol: 'CSCO', name: 'Cisco', era: [1990, 2025], basePrice: 20 },
  { symbol: 'AMZN', name: 'Amazon', era: [1997, 2025], basePrice: 18 },
  { symbol: 'ORCL', name: 'Oracle', era: [1986, 2025], basePrice: 15 },
  { symbol: 'VZ', name: 'Verizon', era: [1980, 2025], basePrice: 30 },
  // 2000s-2020s
  { symbol: 'GOOGL', name: 'Google', era: [2004, 2025], basePrice: 85 },
  { symbol: 'META', name: 'Meta (Facebook)', era: [2012, 2025], basePrice: 38 },
  { symbol: 'TSLA', name: 'Tesla', era: [2010, 2025], basePrice: 17 },
  { symbol: 'NFLX', name: 'Netflix', era: [2002, 2025], basePrice: 15 },
  { symbol: 'NVDA', name: 'NVIDIA', era: [1999, 2025], basePrice: 12 },
  { symbol: 'BRK', name: 'Berkshire Hathaway', era: [1965, 2025], basePrice: 200 },
  { symbol: 'CL', name: 'Colgate-Palmolive', era: [1950, 2025], basePrice: 30 },
  { symbol: 'O', name: 'Realty Income', era: [1994, 2025], basePrice: 20 },
  { symbol: 'SPG', name: 'Simon Property', era: [1993, 2025], basePrice: 25 },
]

/** Get base price and display name for any symbol (deterministic fallback for game-only symbols) */
function getBasePriceAndName(symbol: string): { basePrice: number; stockName: string } {
  const found = HISTORICAL_STOCKS.find(s => s.symbol === symbol)
  if (found) return { basePrice: found.basePrice, stockName: found.name }
  // Deterministic hash for unknown symbols so same symbol always gets same base
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = ((h << 5) - h) + symbol.charCodeAt(i)
  const basePrice = 25 + (Math.abs(h) % 80)
  return { basePrice, stockName: symbol }
}

/** Seeded PRNG: same seed => same sequence (for deterministic historical data per symbol+year) */
function createSeededRandom(seed: number) {
  return function next() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// Historical market events that affect volatility and trends
const MARKET_EVENTS: { year: number; month?: number; type: 'crash' | 'boom' | 'volatile' | 'stable'; magnitude: number }[] = [
  { year: 1929, month: 10, type: 'crash', magnitude: 0.4 }, // Great Depression
  { year: 1930, type: 'crash', magnitude: 0.3 },
  { year: 1931, type: 'crash', magnitude: 0.25 },
  { year: 1932, type: 'crash', magnitude: 0.2 },
  { year: 1933, type: 'boom', magnitude: 0.3 },
  { year: 1937, type: 'crash', magnitude: 0.25 },
  { year: 1941, month: 12, type: 'crash', magnitude: 0.15 }, // Pearl Harbor
  { year: 1945, type: 'boom', magnitude: 0.2 }, // WWII End
  { year: 1962, type: 'crash', magnitude: 0.15 }, // Kennedy Slide
  { year: 1973, type: 'crash', magnitude: 0.2 }, // Oil Crisis
  { year: 1974, type: 'crash', magnitude: 0.25 },
  { year: 1982, type: 'boom', magnitude: 0.2 }, // Bull market starts
  { year: 1987, month: 10, type: 'crash', magnitude: 0.25 }, // Black Monday
  { year: 1990, type: 'volatile', magnitude: 0.15 }, // Gulf War
  { year: 1995, type: 'boom', magnitude: 0.25 }, // Tech boom
  { year: 1999, type: 'boom', magnitude: 0.35 }, // Dot-com peak
  { year: 2000, type: 'crash', magnitude: 0.3 }, // Dot-com crash
  { year: 2001, month: 9, type: 'crash', magnitude: 0.2 }, // 9/11
  { year: 2002, type: 'crash', magnitude: 0.2 },
  { year: 2007, type: 'volatile', magnitude: 0.15 },
  { year: 2008, month: 9, type: 'crash', magnitude: 0.4 }, // Financial Crisis
  { year: 2009, month: 3, type: 'boom', magnitude: 0.3 }, // Recovery
  { year: 2020, month: 3, type: 'crash', magnitude: 0.35 }, // COVID
  { year: 2020, month: 4, type: 'boom', magnitude: 0.4 }, // COVID recovery
  { year: 2021, type: 'boom', magnitude: 0.25 },
  { year: 2022, type: 'crash', magnitude: 0.2 }, // Interest rates
]

// Generate historical daily data for a random year and stock
function generateHistoricalData(): { candles: MarketCandle[]; symbol: string; year: number; stockName: string } {
  // Pick random year between 1925 and 2025
  const year = Math.floor(Math.random() * (2025 - 1925 + 1)) + 1925
  
  // Find stocks available in that era
  const availableStocks = HISTORICAL_STOCKS.filter(
    stock => stock.era[0] <= year && stock.era[1] >= year
  )
  
  // Pick random stock from available ones
  const stock = availableStocks[Math.floor(Math.random() * availableStocks.length)]
  
  // Find market events for this year
  const yearEvents = MARKET_EVENTS.filter(e => e.year === year)
  
  // Calculate base price adjusted for era (inflation/deflation simulation)
  const eraMultiplier = year < 1950 ? 0.3 : year < 1980 ? 0.8 : year < 2000 ? 1.5 : year < 2020 ? 3 : 5
  let basePrice = stock.basePrice * eraMultiplier * (0.8 + Math.random() * 0.4)
  
  // Trading days in a year (approximately 252)
  const tradingDays = 252
  const candles: MarketCandle[] = []
  
  // Start from January 2nd (first trading day)
  let currentDate = new Date(year, 0, 2)
  let tradingDayCount = 0
  
  // Determine overall year trend
  let yearTrend = 0
  yearEvents.forEach(event => {
    if (event.type === 'crash') yearTrend -= event.magnitude
    else if (event.type === 'boom') yearTrend += event.magnitude
    else if (event.type === 'volatile') yearTrend += (Math.random() - 0.5) * event.magnitude
  })
  
  // If no events, random slight trend
  if (yearEvents.length === 0) {
    yearTrend = (Math.random() - 0.4) * 0.3 // Slight upward bias historically
  }
  
  // Daily trend component
  const dailyTrendComponent = yearTrend / tradingDays
  
  while (tradingDayCount < tradingDays && currentDate.getFullYear() === year) {
    const dayOfWeek = currentDate.getDay()
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }
    
    // Check for month-specific events
    const monthEvent = yearEvents.find(e => e.month === currentDate.getMonth() + 1)
    let eventMultiplier = 1
    let eventVolatility = 1
    
    if (monthEvent) {
      if (monthEvent.type === 'crash') {
        eventMultiplier = 1 - monthEvent.magnitude * Math.random()
        eventVolatility = 2 + monthEvent.magnitude * 3
      } else if (monthEvent.type === 'boom') {
        eventMultiplier = 1 + monthEvent.magnitude * Math.random()
        eventVolatility = 1.5 + monthEvent.magnitude * 2
      } else {
        eventVolatility = 2 + monthEvent.magnitude * 2
      }
    }
    
    // Base volatility varies by era
    const eraVolatility = year < 1940 ? 0.03 : year < 1980 ? 0.02 : 0.025
    const dailyVolatility = basePrice * eraVolatility * eventVolatility
    
    // Generate OHLC
    const open = basePrice
    const dailyChange = (Math.random() - 0.5) * dailyVolatility * 2 + (basePrice * dailyTrendComponent * eventMultiplier)
    const close = Math.max(0.01, open + dailyChange)
    
    // High and low
    const range = Math.abs(dailyChange) + dailyVolatility * Math.random()
    const high = Math.max(open, close) + range * Math.random()
    const low = Math.max(0.01, Math.min(open, close) - range * Math.random())
    
    // Volume (higher during volatile periods)
    const baseVolume = year < 1950 ? 100000 : year < 1980 ? 500000 : year < 2000 ? 2000000 : 10000000
    const volume = Math.floor(baseVolume * (0.5 + Math.random()) * eventVolatility)
    
    candles.push({
      time: currentDate.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })
    
    basePrice = close
    tradingDayCount++
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return {
    candles,
    symbol: stock.symbol,
    year,
    stockName: stock.name,
  }
}

/**
 * Generate historical data for a specific symbol and year (deterministic).
 * Same symbol+year always returns the same series so card price and position data match.
 */
function generateHistoricalDataForSymbolYear(
  symbol: string,
  year: number
): { candles: MarketCandle[]; symbol: string; year: number; stockName: string } {
  const { basePrice: base, stockName } = getBasePriceAndName(symbol)
  const seed = (symbol + '-' + year).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rng = createSeededRandom(seed)

  const yearEvents = MARKET_EVENTS.filter(e => e.year === year)
  let yearTrend = 0
  yearEvents.forEach(event => {
    if (event.type === 'crash') yearTrend -= event.magnitude * (0.3 + rng() * 0.7)
    else if (event.type === 'boom') yearTrend += event.magnitude * (0.3 + rng() * 0.7)
    else if (event.type === 'volatile') yearTrend += (rng() - 0.5) * event.magnitude
  })
  if (yearEvents.length === 0) yearTrend = (rng() - 0.4) * 0.3

  const eraMultiplier = year < 1950 ? 0.3 : year < 1980 ? 0.8 : year < 2000 ? 1.5 : year < 2020 ? 3 : 5
  let basePrice = base * eraMultiplier * (0.8 + rng() * 0.4)
  const tradingDays = 252
  const dailyTrendComponent = yearTrend / tradingDays
  const candles: MarketCandle[] = []
  let currentDate = new Date(year, 0, 2)
  let tradingDayCount = 0

  while (tradingDayCount < tradingDays && currentDate.getFullYear() === year) {
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }
    const monthEvent = yearEvents.find(e => e.month === currentDate.getMonth() + 1)
    let eventMultiplier = 1
    let eventVolatility = 1
    if (monthEvent) {
      if (monthEvent.type === 'crash') {
        eventMultiplier = 1 - monthEvent.magnitude * rng()
        eventVolatility = 2 + monthEvent.magnitude * 3
      } else if (monthEvent.type === 'boom') {
        eventMultiplier = 1 + monthEvent.magnitude * rng()
        eventVolatility = 1.5 + monthEvent.magnitude * 2
      } else {
        eventVolatility = 2 + monthEvent.magnitude * 2
      }
    }
    const eraVolatility = year < 1940 ? 0.03 : year < 1980 ? 0.02 : 0.025
    const dailyVolatility = basePrice * eraVolatility * eventVolatility
    const open = basePrice
    const dailyChange = (rng() - 0.5) * dailyVolatility * 2 + (basePrice * dailyTrendComponent * eventMultiplier)
    const close = Math.max(0.01, open + dailyChange)
    const range = Math.abs(dailyChange) + dailyVolatility * rng()
    const high = Math.max(open, close) + range * rng()
    const low = Math.max(0.01, Math.min(open, close) - range * rng())
    const baseVolume = year < 1950 ? 100000 : year < 1980 ? 500000 : year < 2000 ? 2000000 : 10000000
    const volume = Math.floor(baseVolume * (0.5 + rng()) * eventVolatility)
    candles.push({
      time: currentDate.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })
    basePrice = close
    tradingDayCount++
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return { candles, symbol, year, stockName }
}

// Demo data for when API key is not available or rate limited
function generateDemoData(symbol: string, count: number = 60): MarketCandle[] {
  const candles: MarketCandle[] = []
  const now = new Date()
  
  // Base price varies by symbol
  let basePrice = symbol === 'AAPL' ? 175 : symbol === 'MSFT' ? 380 : symbol === 'GOOGL' ? 140 : 100
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000) // 1 minute intervals
    const volatility = basePrice * 0.002 // 0.2% volatility
    const change = (Math.random() - 0.5) * volatility * 2
    
    const open = basePrice
    const close = basePrice + change
    const high = Math.max(open, close) + Math.random() * volatility
    const low = Math.min(open, close) - Math.random() * volatility
    const volume = Math.floor(Math.random() * 1000000) + 100000
    
    candles.push({
      time: time.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    })
    
    basePrice = close
  }
  
  return candles
}

async function fetchIntradayData(symbol: string, apiKey: string): Promise<MarketCandle[]> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&outputsize=compact&apikey=${apiKey}`
  
  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  })
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`)
  }
  
  const data: AlphaVantageIntradayResponse = await response.json()
  
  // Check for API error messages
  if ('Error Message' in data) {
    throw new Error('Invalid API call or symbol')
  }
  
  if ('Note' in data) {
    // Rate limit reached - return demo data
    console.warn('Alpha Vantage rate limit reached, using demo data')
    return generateDemoData(symbol)
  }
  
  // Find the time series key (it varies by interval)
  const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'))
  
  if (!timeSeriesKey) {
    throw new Error('No time series data found')
  }
  
  const timeSeries = data[timeSeriesKey] as Record<string, AlphaVantageTimeSeriesData>
  
  // Convert to our format and sort by time (oldest first)
  const candles: MarketCandle[] = Object.entries(timeSeries)
    .map(([time, values]) => ({
      time,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10),
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  
  return candles
}

async function fetchGlobalQuote(symbol: string, apiKey: string): Promise<MarketCandle | null> {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
  
  const response = await fetch(url, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  })
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage API error: ${response.status}`)
  }
  
  const data: AlphaVantageGlobalQuoteResponse = await response.json()
  
  if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
    return null
  }
  
  const quote = data['Global Quote']
  
  return {
    time: quote['07. latest trading day'],
    open: parseFloat(quote['02. open']),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    close: parseFloat(quote['05. price']),
    volume: parseInt(quote['06. volume'], 10),
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbolParam = searchParams.get('symbol')
  const yearParam = searchParams.get('year')
  const symbol = symbolParam || 'AAPL'
  const type = searchParams.get('type') || 'intraday' // 'intraday', 'quote', or 'historical'
  
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  
  try {
    // Historical mode: use requested symbol+year for deterministic data, or random
    if (type === 'historical') {
      const requestedYear = yearParam ? parseInt(yearParam, 10) : NaN
      const hasSymbolAndYear = symbolParam != null && symbolParam !== '' && !isNaN(requestedYear) && requestedYear >= 1925 && requestedYear <= 2025
      const historicalData = hasSymbolAndYear
        ? generateHistoricalDataForSymbolYear(symbolParam as string, requestedYear)
        : generateHistoricalData()
      return NextResponse.json({
        success: true,
        symbol: historicalData.symbol,
        stockName: historicalData.stockName,
        year: historicalData.year,
        data: historicalData.candles,
        count: historicalData.candles.length,
        isHistorical: true,
        message: `Historical simulation: ${historicalData.stockName} (${historicalData.symbol}) in ${historicalData.year}`,
      })
    }
    
    // If no API key, return demo data
    if (!apiKey || apiKey === 'demo') {
      console.log('No API key configured, using demo data')
      const demoData = generateDemoData(symbol)
      return NextResponse.json({
        success: true,
        symbol,
        data: demoData,
        isDemo: true,
        message: 'Using demo data. Set ALPHA_VANTAGE_API_KEY in .env.local for real data.',
      })
    }
    
    if (type === 'quote') {
      const quote = await fetchGlobalQuote(symbol, apiKey)
      
      if (!quote) {
        return NextResponse.json(
          { success: false, error: 'No quote data available' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        symbol,
        data: quote,
        isDemo: false,
      })
    }
    
    // Default: intraday data
    const candles = await fetchIntradayData(symbol, apiKey)
    
    return NextResponse.json({
      success: true,
      symbol,
      data: candles,
      count: candles.length,
      isDemo: false,
    })
  } catch (error) {
    console.error('Market API error:', error)
    
    // Return demo data on error
    const demoData = generateDemoData(symbol)
    return NextResponse.json({
      success: true,
      symbol,
      data: demoData,
      isDemo: true,
      message: error instanceof Error ? error.message : 'API error, using demo data',
    })
  }
}
