import { NextResponse } from 'next/server'

export interface MarketCandle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

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
  const symbol = searchParams.get('symbol') || 'AAPL'
  const type = searchParams.get('type') || 'intraday' // 'intraday' or 'quote'
  
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  
  try {
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
