/**
 * Inflation Engine - Converts historical prices to current value
 * Uses Consumer Price Index (CPI) data to adjust for inflation
 */

import type { MarketCandle } from '../stores/useGameStore'

// Historical CPI data (base year = 2024, value = 100)
// Simplified CPI table - in production, use comprehensive historical data
export const CPI_TABLE: Record<number, number> = {
  // 1920s
  1920: 20.0,
  1921: 17.9,
  1922: 16.8,
  1923: 17.1,
  1924: 17.1,
  1925: 17.5,
  1926: 17.7,
  1927: 17.4,
  1928: 17.1,
  1929: 17.1,
  // 1930s
  1930: 16.7,
  1931: 15.2,
  1932: 13.7,
  1933: 13.0,
  1934: 13.4,
  1935: 13.7,
  1936: 13.9,
  1937: 14.4,
  1938: 14.1,
  1939: 13.9,
  // 1940s
  1940: 14.0,
  1941: 14.7,
  1942: 16.3,
  1943: 17.3,
  1944: 17.6,
  1945: 18.0,
  1946: 19.5,
  1947: 22.3,
  1948: 24.1,
  1949: 23.8,
  // 1950s
  1950: 24.1,
  1951: 26.0,
  1952: 26.5,
  1953: 26.7,
  1954: 26.9,
  1955: 26.8,
  1956: 27.2,
  1957: 28.1,
  1958: 28.9,
  1959: 29.1,
  // 1960s
  1960: 29.6,
  1961: 29.9,
  1962: 30.2,
  1963: 30.6,
  1964: 31.0,
  1965: 31.5,
  1966: 32.4,
  1967: 33.4,
  1968: 34.8,
  1969: 36.7,
  // 1970s
  1970: 38.8,
  1971: 40.5,
  1972: 41.8,
  1973: 44.4,
  1974: 49.3,
  1975: 53.8,
  1976: 56.9,
  1977: 60.6,
  1978: 65.2,
  1979: 72.6,
  // 1980s
  1980: 82.4,
  1981: 90.9,
  1982: 96.5,
  1983: 99.6,
  1984: 103.9,
  1985: 107.6,
  1986: 109.6,
  1987: 113.6,
  1988: 118.3,
  1989: 124.0,
  // 1990s
  1990: 130.7,
  1991: 136.2,
  1992: 140.3,
  1993: 144.5,
  1994: 148.2,
  1995: 152.4,
  1996: 156.9,
  1997: 160.5,
  1998: 163.0,
  1999: 166.6,
  // 2000s
  2000: 172.2,
  2001: 177.1,
  2002: 179.9,
  2003: 184.0,
  2004: 188.9,
  2005: 195.3,
  2006: 201.6,
  2007: 207.3,
  2008: 215.3,
  2009: 214.5,
  // 2010s
  2010: 218.1,
  2011: 224.9,
  2012: 229.6,
  2013: 233.0,
  2014: 236.7,
  2015: 237.0,
  2016: 240.0,
  2017: 245.1,
  2018: 251.1,
  2019: 255.7,
  // 2020s
  2020: 258.8,
  2021: 270.9,
  2022: 292.7,
  2023: 304.7,
  2024: 310.0, // Current year (base)
  2025: 315.0, // Projected
}

// Current year CPI (base for calculations)
const CURRENT_YEAR = 2024
const CURRENT_CPI = CPI_TABLE[CURRENT_YEAR] || 310.0

/**
 * Apply inflation correction to a historical price
 * Formula: P_now = P_t × (CPI_now / CPI_t)
 * 
 * @param price Historical price
 * @param year Year of the historical price
 * @returns Inflation-adjusted price in current dollars
 */
export function applyInflation(price: number, year: number): number {
  const historicalCPI = CPI_TABLE[year]
  
  if (!historicalCPI) {
    // If year not in table, use linear interpolation or default multiplier
    console.warn(`CPI data not available for year ${year}, using approximation`)
    const closestYear = Object.keys(CPI_TABLE)
      .map(Number)
      .reduce((prev, curr) => (Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev))
    const closestCPI = CPI_TABLE[closestYear]
    return price * (CURRENT_CPI / closestCPI)
  }
  
  return price * (CURRENT_CPI / historicalCPI)
}

/**
 * Batch process an array of market candles to apply inflation correction
 * 
 * @param candles Array of market candles
 * @param year Year of the data
 * @returns Array of inflation-adjusted candles
 */
export function applyInflationToCandles(
  candles: MarketCandle[],
  year: number
): MarketCandle[] {
  return candles.map(candle => ({
    time: candle.time,
    open: applyInflation(candle.open, year),
    high: applyInflation(candle.high, year),
    low: applyInflation(candle.low, year),
    close: applyInflation(candle.close, year),
    volume: candle.volume,
  }))
}

/**
 * Get CPI for a specific year
 */
export function getCPI(year: number): number {
  return CPI_TABLE[year] || CURRENT_CPI
}

/**
 * Get inflation multiplier for a year (CPI_now / CPI_year)
 */
export function getInflationMultiplier(year: number): number {
  const historicalCPI = CPI_TABLE[year] || CURRENT_CPI
  return CURRENT_CPI / historicalCPI
}
