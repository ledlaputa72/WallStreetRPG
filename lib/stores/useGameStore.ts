import { create } from 'zustand'
import type { StockSector, StockRarity } from '@/lib/types/stock'

export interface MarketCandle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PortfolioPosition {
  id: string
  symbol: string
  stockName: string
  sector: StockSector
  rarity: StockRarity
  buyPrice: number // Inflation-adjusted price at purchase
  quantity: number
  currentPrice: number // Current inflation-adjusted price
  buyDayIndex: number
  data: MarketCandle[] // Full year data (252 days)
  currentDayIndex: number // Current position in data array
}

export interface MentalState {
  level: number // 0-100, affects decision making
  status: 'normal' | 'fomo' | 'panic' | 'greed' | 'fear'
  immunityUntil?: number // Day index until immunity expires
}

export interface GameStore {
  // AUM and Capital
  aum: number | null // Selected AUM ($1K - $1M)
  /** currentCash: remaining after purchases + accumulated funding + sale proceeds (UI "Cash balance"). */
  realizedProfit: number
  /** currentStockValue: Σ(p.currentPrice × p.quantity). */
  unrealizedProfit: number
  /** totalAssets = currentCash + currentStockValue. No double-count. */
  totalAssets: number
  /** Per-day auto funding; added to realizedProfit exactly once per day in incrementDay(). */
  dailyCapitalInflow: number
  ceoCapitalBonus: number // CEO bonus multiplier (0-0.2)
  
  // Timeline
  currentDayIndex: number // 1-252 (trading days)
  selectedYear: number | null
  isPlaying: boolean
  
  // Portfolio
  portfolioAssets: PortfolioPosition[]
  maxPortfolioSize: number // Usually 9
  
  // Market Data
  sp500Data: MarketCandle[] | null
  sp500CurrentPrice: number
  
  // Mental State
  mentalState: MentalState
  
  // Victory Conditions
  targetProfit: number | null
  alphaTarget: number // Percentage above S&P 500 (e.g., 15)
  
  // UI State
  selectedPositionId: string | null
  
  // Actions
  setAUM: (aum: number) => void
  setSelectedYear: (year: number) => void
  addToPortfolio: (position: PortfolioPosition) => void
  removeFromPortfolio: (id: string) => void
  updatePositionPrice: (id: string, price: number, dayIndex: number) => void
  sellPosition: (id: string) => void
  buyMore: (id: string, additionalQuantity: number) => void
  setSP500Data: (data: MarketCandle[]) => void
  updateSP500Price: (price: number) => void
  incrementDay: () => void
  resetGame: () => void
  setMentalState: (state: Partial<MentalState>) => void
  calculatePortfolioValue: () => number
  calculatePortfolioReturn: () => number
  calculateSP500Return: () => number
  setSelectedPositionId: (id: string | null) => void
  /** Accumulated auto-funded amount so far: dailyCapitalInflow × currentDayIndex */
  getAccumulatedFunding: () => number
  /** Total capital put in: initialAUM + accFunding. Used as denominator for P/L %. */
  getTotalInvestedCapital: () => number
  /** Investment profit only: Total Assets - totalInvestedCapital. Matches sum of position P/L + realized from sales. */
  getTotalProfit: () => number
  /** Sum of (currentPrice - buyPrice) × quantity over all positions (unrealized only). For verification vs getTotalProfit. */
  getTotalProfitFromPositions: () => number
}

const initialState = {
  aum: null,
  realizedProfit: 0,
  unrealizedProfit: 0,
  totalAssets: 0,
  dailyCapitalInflow: 0,
  ceoCapitalBonus: 0,
  currentDayIndex: 0,
  selectedYear: null,
  isPlaying: false,
  portfolioAssets: [],
  maxPortfolioSize: 9,
  sp500Data: null,
  sp500CurrentPrice: 0,
  mentalState: {
    level: 100,
    status: 'normal' as const,
  },
  targetProfit: null,
  alphaTarget: 15,
  selectedPositionId: null,
}

export const useGameStore = create<GameStore>((set, get) => {
  return {
    ...initialState,
    
    setAUM: (aum) => {
      // Calculate daily capital inflow based on AUM
      const baseInflow = aum * 0.001 // 0.1% of AUM per day
      const dailyInflow = baseInflow * (1 + get().ceoCapitalBonus)
      
      // Calculate target profit (e.g., 50% gain)
      const targetProfit = aum * 1.5
      
      set({
        aum,
        dailyCapitalInflow: dailyInflow,
        targetProfit,
        // Don't set totalAssets here - it will be calculated by calculatePortfolioValue()
        // Initial state: no portfolio yet, so totalAssets = realizedProfit (which is 0 initially)
        totalAssets: 0,
      })
    },
    
    setSelectedYear: (year) => set({ selectedYear: year }),
    
    addToPortfolio: (position) => {
      const current = get().portfolioAssets
      if (current.length >= get().maxPortfolioSize) {
        console.warn('Portfolio is full')
        return
      }
      // Force buyPrice/currentPrice from position.data at entry day so P/L is never skewed
      // (card price = portfolio buy = simulation price; all inflation-adjusted in data)
      const entryPrice =
        position.data.length > 0 && position.buyDayIndex >= 0 && position.buyDayIndex < position.data.length
          ? position.data[position.buyDayIndex].close
          : position.buyPrice
      const normalized: PortfolioPosition = {
        ...position,
        buyPrice: entryPrice,
        currentPrice: entryPrice,
        currentDayIndex: position.buyDayIndex,
      }
      set({ portfolioAssets: [...current, normalized] })
      get().calculatePortfolioValue()
    },
    
    removeFromPortfolio: (id) => {
      set({
        portfolioAssets: get().portfolioAssets.filter(p => p.id !== id),
      })
      get().calculatePortfolioValue()
    },
    
    updatePositionPrice: (id, price, dayIndex) => {
      set({
        portfolioAssets: get().portfolioAssets.map(p =>
          p.id === id
            ? { ...p, currentPrice: price, currentDayIndex: dayIndex }
            : p
        ),
      })
      get().calculatePortfolioValue()
    },
    
    sellPosition: (id) => {
      const position = get().portfolioAssets.find(p => p.id === id)
      if (!position) return
      
      const profit = (position.currentPrice - position.buyPrice) * position.quantity
      const saleValue = position.currentPrice * position.quantity
      
      set({
        realizedProfit: get().realizedProfit + saleValue,
        portfolioAssets: get().portfolioAssets.filter(p => p.id !== id),
      })
      get().calculatePortfolioValue()
    },
    
    buyMore: (id, additionalQuantity) => {
      const position = get().portfolioAssets.find(p => p.id === id)
      if (!position) return
      
      const cost = position.currentPrice * additionalQuantity
      if (cost > get().realizedProfit) {
        console.warn('Insufficient funds')
        return
      }
      
      // Calculate new average buy price
      const totalCost = position.buyPrice * position.quantity + cost
      const newQuantity = position.quantity + additionalQuantity
      const newBuyPrice = totalCost / newQuantity
      
      set({
        realizedProfit: get().realizedProfit - cost,
        portfolioAssets: get().portfolioAssets.map(p =>
          p.id === id
            ? { ...p, buyPrice: newBuyPrice, quantity: newQuantity }
            : p
        ),
      })
      get().calculatePortfolioValue()
    },
    
    setSP500Data: (data) => {
      set({
        sp500Data: data,
        sp500CurrentPrice: data.length > 0 ? data[0].close : 0,
      })
    },
    
    updateSP500Price: (price) => {
      set({ sp500CurrentPrice: price })
    },
    
    incrementDay: () => {
      const current = get().currentDayIndex
      if (current >= 252) {
        set({ isPlaying: false })
        return
      }
      // Add daily funding exactly once per tick (one day = one tick)
      const newRealized = get().realizedProfit + get().dailyCapitalInflow
      set({
        currentDayIndex: current + 1,
        realizedProfit: newRealized,
      })
      get().calculatePortfolioValue()
    },
    
    resetGame: () => set(initialState),
    
    setMentalState: (state) => {
      set({
        mentalState: { ...get().mentalState, ...state },
      })
    },
    
    calculatePortfolioValue: (): number => {
      const positions = get().portfolioAssets
      const unrealized = positions.reduce(
        (sum, p) => sum + (p.currentPrice ?? 0) * (p.quantity ?? 0),
        0
      )
      const cash = get().realizedProfit ?? 0
      const total = cash + unrealized
      set({ unrealizedProfit: unrealized, totalAssets: total })
      return total
    },

    /** P/L (%): (Total Profit / totalInvestedCapital) × 100. Investment performance only; denominator = initialAUM + accFunding. */
    calculatePortfolioReturn: (): number => {
      const totalInvested = get().getTotalInvestedCapital()
      if (totalInvested <= 0) return 0
      const totalProfit = get().getTotalProfit()
      return (totalProfit / totalInvested) * 100
    },

    getAccumulatedFunding: (): number => {
      return (get().dailyCapitalInflow ?? 0) * (get().currentDayIndex ?? 0)
    },

    getTotalInvestedCapital: (): number => {
      const aum = get().aum ?? 0
      return aum + get().getAccumulatedFunding()
    },

    getTotalProfit: (): number => {
      const totalAssets = get().totalAssets ?? 0
      return totalAssets - get().getTotalInvestedCapital()
    },

    getTotalProfitFromPositions: (): number => {
      return get().portfolioAssets.reduce(
        (sum, p) => sum + (p.currentPrice - p.buyPrice) * p.quantity,
        0
      )
    },
    
    calculateSP500Return: (): number => {
      const sp500Data = get().sp500Data
      if (!sp500Data || sp500Data.length === 0) return 0
      
      const startPrice = sp500Data[0]?.close ?? 0
      const currentPrice = get().sp500CurrentPrice ?? 0
      if (startPrice === 0) return 0
      
      return ((currentPrice - startPrice) / startPrice) * 100
    },
    
    setSelectedPositionId: (id) => set({ selectedPositionId: id }),
  }
})
