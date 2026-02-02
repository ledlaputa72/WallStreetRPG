'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { usePhaserGame } from '@/components/battle/hooks/usePhaserGame'
import { StageInfo } from '@/components/battle/ui/StageInfo'
import { ChartControls } from '@/components/battle/ui/ChartControls'
import { QuickInventory } from '@/components/battle/ui/QuickInventory'
import { TradingActions } from '@/components/battle/ui/TradingActions'
import { CapitalInfo } from '@/components/battle/ui/CapitalInfo'
import { eventBus, EVENTS } from '@/components/battle/event-bus'
import { useGameStore } from '@/lib/stores/useGameStore'
import { StartDashboard } from '@/components/game/StartDashboard'
import { SelectionOverlay } from '@/components/game/SelectionOverlay'
import { SettlementReport } from '@/components/game/SettlementReport'
import { generateInitialDraft, generateQuarterlyDraft } from '@/lib/utils/cardGenerator'
import { fetchHistoricalStockData } from '@/lib/utils/dataFetcher'
import type { StockCard } from '@/lib/types/stock'
import type { GameState, SpeedMultiplier } from '@/components/battle/types'

interface CardPriceInfo {
  cardId: string
  price: number
  quantity: number
  totalCost: number
}

// Phaser component dynamic import
const PhaserGame = dynamic(
  () => import('@/components/battle/phaser-game').then(mod => ({ default: mod.PhaserGame })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="space-y-4 w-full p-4">
          <Skeleton className="h-12 w-full bg-slate-800" />
          <Skeleton className="h-64 w-full bg-slate-800" />
          <Skeleton className="h-20 w-full bg-slate-800" />
        </div>
      </div>
    ),
  }
)

type GamePhase = 'start' | 'draft' | 'playing' | 'quarterly-draft' | 'settlement'

export function BattlePage() {
  // Game phase management
  const [gamePhase, setGamePhase] = useState<GamePhase>('start')
  const [draftCards, setDraftCards] = useState<StockCard[]>([])
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set())
  const [cardPrices, setCardPrices] = useState<Map<string, CardPriceInfo>>(new Map())
  const [chartMode, setChartMode] = useState<'portfolio' | 'stock'>('portfolio')
  const selectedPositionId = useGameStore(state => state.selectedPositionId)
  const setSelectedPositionId = useGameStore(state => state.setSelectedPositionId)
  
  // Zustand store
  const aum = useGameStore(state => state.aum)
  const currentDayIndex = useGameStore(state => state.currentDayIndex)
  const selectedYear = useGameStore(state => state.selectedYear)
  const portfolio = useGameStore(state => state.portfolioAssets)
  const isPlaying = useGameStore(state => state.isPlaying)
  const totalAssets = useGameStore(state => state.totalAssets)
  const realizedProfit = useGameStore(state => state.realizedProfit)
  const dailyCapitalInflow = useGameStore(state => state.dailyCapitalInflow)
  const incrementDay = useGameStore(state => state.incrementDay)
  const updatePositionPrice = useGameStore(state => state.updatePositionPrice)
  const addToPortfolio = useGameStore(state => state.addToPortfolio)
  const setSelectedYear: (year: number) => void = useGameStore(state => state.setSelectedYear)
  
  // Calculate available capital for investment
  const availableCapital = useMemo(() => {
    // realizedProfit already includes dailyCapitalInflow accumulated up to currentDayIndex
    return Math.max(0, realizedProfit)
  }, [realizedProfit])
  
  // For initial draft, use AUM as available capital
  // For quarterly draft, use realizedProfit directly (which includes dailyCapitalInflow)
  const draftAvailableCapital = useMemo(() => {
    if (gamePhase === 'draft') {
      return aum || 0
    }
    if (gamePhase === 'quarterly-draft') {
      // For quarterly draft, use realizedProfit directly
      // This ensures we get the current value even if availableCapital hasn't updated yet
      return Math.max(0, realizedProfit)
    }
    // For other phases, use calculated availableCapital
    return availableCapital
  }, [gamePhase, aum, availableCapital, realizedProfit])
  
  // Phaser game hook
  const {
    phaserRef,
    currentPrice,
    profitPercent,
    chartType,
    candleCount,
    speedMultiplier,
    handleChartTypeChange,
    handleCandleCountChange,
    handleSpeedChange,
  } = usePhaserGame()

  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const speedMultiplierRef = useRef<SpeedMultiplier>(speedMultiplier)
  const openedQuarterlyDraftsRef = useRef<Set<number>>(new Set())
  const isOpeningQuarterlyDraftRef = useRef<boolean>(false)
  const gamePhaseRef = useRef<GamePhase>('start')

  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier
  }, [speedMultiplier])


  // Handle game start from dashboard
  const handleStartGame = useCallback(async (selectedAUM: number) => {
    // Generate random year
    const year = Math.floor(Math.random() * (2025 - 1925 + 1)) + 1925
    setSelectedYear(year)

    // Generate initial draft cards
    const cards = generateInitialDraft(selectedAUM, year)
    setDraftCards(cards)
    setSelectedCardIds(new Set())
    
    // Fetch prices for all cards
    const priceMap = new Map<string, CardPriceInfo>()
    for (const card of cards) {
      const stockResult = await fetchHistoricalStockData(card.symbol, year)
      if (stockResult.success && stockResult.data.length > 0) {
        const price = stockResult.data[0].close
        // Calculate quantity - each card should be 15-30% of total capital
        // Random percentage between 15% and 30%
        const investmentPercentage = 0.15 + Math.random() * 0.15 // 15% to 30%
        const targetInvestment = selectedAUM * investmentPercentage
        const quantity = Math.max(1, Math.floor(targetInvestment / price))
        const totalCost = price * quantity
        
        priceMap.set(card.id, {
          cardId: card.id,
          price,
          quantity,
          totalCost,
        })
      }
    }
    setCardPrices(priceMap)
    setGamePhase('draft')
  }, [setSelectedYear])

  // Handle card selection from draft
  const handleCardSelect = useCallback((card: StockCard) => {
    const priceInfo = cardPrices.get(card.id)
    if (!priceInfo) {
      console.warn('Price info not found for card:', card.id)
      return
    }

    // Toggle selection
    setSelectedCardIds(prev => {
      const newSelectedIds = new Set(prev)
      const isCurrentlySelected = newSelectedIds.has(card.id)
      
      if (isCurrentlySelected) {
        // Deselect
        newSelectedIds.delete(card.id)
      } else {
        // Select - check if can afford using initial AUM
        const totalSelectedCost = Array.from(prev).reduce((sum, cardId) => {
          const info = cardPrices.get(cardId)
          return sum + (info?.totalCost || 0)
        }, 0)
        
        // Check if can afford this card (using initial AUM, not availableCapital)
        const initialAUM = aum || 0
        if (totalSelectedCost + priceInfo.totalCost > initialAUM) {
          // Cannot afford
          return prev
        }
        
        // Can afford - add to selection
        newSelectedIds.add(card.id)
      }
      
      return newSelectedIds
    })
  }, [cardPrices, aum])
  
  // Start simulation
  const startSimulation = useCallback(async () => {
    if (!selectedYear) return

    // Positions are already created with correct buyPrice and currentPrice in handleDraftComplete
    // No need to update prices here - they're already set to actualFirstDayPrice
    // Just ensure calculatePortfolioValue is called to verify initial state
    const currentPortfolio = useGameStore.getState().portfolioAssets
    if (currentPortfolio.length > 0) {
      // Verify all positions have correct initial prices
      currentPortfolio.forEach(position => {
        if (position.data.length > 0 && Math.abs(position.currentPrice - position.data[0].close) > 0.01) {
          // Only update if there's a mismatch (shouldn't happen, but just in case)
          updatePositionPrice(position.id, position.data[0].close, 0)
        }
      })
    }

    // Initialize chart based on mode (default: portfolio)
    const aumValue = useGameStore.getState().aum || 0
    if (phaserRef.current?.scene) {
      const portfolioLineData = [{ day: 0, price: aumValue }]
      phaserRef.current.scene.updatePortfolioData(portfolioLineData)
      
      // Send initial portfolio candle
      const initialCandle = {
        id: 'portfolio-0',
        time: new Date().toISOString(),
        open: aumValue,
        high: aumValue * 1.01,
        low: aumValue * 0.99,
        close: aumValue,
        volume: 0,
      }
      eventBus.emit(EVENTS.NEW_CANDLE, initialCandle)
    }

    setGamePhase('playing')
    gamePhaseRef.current = 'playing'
    setChartMode('portfolio')
    // Portfolio 모드에서는 라인 또는 에어리어 차트만 사용
    if (chartType === 'candle') {
      handleChartTypeChange('line')
    }
    useGameStore.setState({ isPlaying: true, currentDayIndex: 0 })
    
    // Reset quarterly drafts tracking for new game
    openedQuarterlyDraftsRef.current.clear()
    isOpeningQuarterlyDraftRef.current = false
  }, [selectedYear, updatePositionPrice, chartType, handleChartTypeChange])

  // Handle draft completion - create portfolio positions from selected cards
  const handleDraftComplete = useCallback(async () => {
    if (selectedCardIds.size === 0) {
      alert('Please select at least one stock')
      return
    }

    if (!selectedYear) return

    // Create portfolio positions for selected cards
    const newPositions = []
    let totalCost = 0

    for (const cardId of selectedCardIds) {
      const card = draftCards.find(c => c.id === cardId)
      const priceInfo = cardPrices.get(cardId)
      if (!card || !priceInfo) continue

      // Fetch stock data
      const stockResult = await fetchHistoricalStockData(card.symbol, selectedYear)
      if (!stockResult.success || stockResult.data.length === 0) {
        console.error('Failed to fetch stock data for', card.symbol)
        continue
      }

      // Use actual first day close price from data
      const actualFirstDayPrice = stockResult.data[0].close
      
      // IMPORTANT: Use priceInfo.price and priceInfo.quantity (displayed on card) for consistency
      // The card shows priceInfo.totalCost = priceInfo.price * priceInfo.quantity to the user
      // We must use these exact values to match what was displayed
      const cardDisplayedPrice = priceInfo.price
      const cardDisplayedQuantity = priceInfo.quantity
      const cardDisplayedCost = priceInfo.totalCost
      
      // Verify priceInfo.price matches actual first day price
      if (Math.abs(cardDisplayedPrice - actualFirstDayPrice) > 0.01) {
        console.warn(`Price mismatch for ${card.symbol}: priceInfo=${cardDisplayedPrice}, data[0]=${actualFirstDayPrice}. Using card displayed values: price=${cardDisplayedPrice}, qty=${cardDisplayedQuantity}, cost=${cardDisplayedCost}`)
      }

      // Use card displayed price and quantity to ensure exact match with card display
      // This ensures the portfolio position value exactly matches what was shown on the card
      const position = {
        id: `${card.symbol}-${Date.now()}-${Math.random()}`,
        symbol: card.symbol,
        stockName: card.stockName,
        sector: card.sector,
        rarity: card.rarity,
        buyPrice: cardDisplayedPrice,  // Use card displayed price (matches card display)
        quantity: cardDisplayedQuantity,  // Use card displayed quantity (matches card display)
        currentPrice: cardDisplayedPrice,  // Use card displayed price initially
        buyDayIndex: 0,
        data: stockResult.data,
        currentDayIndex: 0,
      }

      newPositions.push(position)
      // Use cardDisplayedCost (what user saw on card) for totalCost calculation
      // This ensures the deducted amount matches what was displayed
      totalCost += cardDisplayedCost
      
      console.log(`Card ${card.symbol}: displayedPrice=${cardDisplayedPrice}, displayedQty=${cardDisplayedQuantity}, displayedCost=${cardDisplayedCost}, actualPrice=${actualFirstDayPrice}`)
    }

    // Update realized profit FIRST (remaining capital after purchases)
    // This must be done before adding positions so calculatePortfolioValue uses correct realizedProfit
    const initialAUM = aum || 0
    const remainingCash = initialAUM - totalCost
    useGameStore.setState({ realizedProfit: remainingCash })

    // Add all positions to portfolio
    // calculatePortfolioValue will be called for each position, using the correct realizedProfit
    newPositions.forEach(position => addToPortfolio(position))
    
    // Ensure totalAssets is recalculated with final values
    // After all positions are added, totalAssets should equal:
    // realizedProfit (cash) + unrealizedProfit (stock value)
    // = (AUM - totalCost) + (sum of actualFirstDayPrice * quantity for each position)
    // = AUM (since totalCost = sum of actualFirstDayPrice * quantity)
    const finalTotalAssets = useGameStore.getState().calculatePortfolioValue()
    
    // Verify calculation: totalAssets should equal AUM at start
    const finalUnrealizedProfit = useGameStore.getState().unrealizedProfit
    if (Math.abs(finalTotalAssets - initialAUM) > 0.01) {
      console.error(`❌ Total assets mismatch at start:
        Expected: ${initialAUM}
        Got: ${finalTotalAssets}
        Breakdown:
        - realizedProfit (cash): ${remainingCash}
        - unrealizedProfit (stocks): ${finalUnrealizedProfit}
        - totalCost: ${totalCost}
        - Sum: ${remainingCash + finalUnrealizedProfit}`)
    } else {
      console.log(`✅ Initial calculation correct:
        AUM: ${initialAUM}
        Total Assets: ${finalTotalAssets}
        Cash: ${remainingCash}
        Stocks: ${finalUnrealizedProfit}`)
    }

    // Start simulation
    await startSimulation()
  }, [selectedCardIds, draftCards, cardPrices, selectedYear, aum, addToPortfolio, startSimulation])

  // Update gamePhase ref whenever gamePhase changes
  useEffect(() => {
    gamePhaseRef.current = gamePhase
  }, [gamePhase])

  // Game loop - increment day and update prices
  useEffect(() => {
    if (gamePhase !== 'playing' || !isPlaying) {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
      return
    }

    const tick = () => {
      // Check current game phase from ref (always up-to-date)
      // Store in variable to avoid TypeScript narrowing issues
      const currentGamePhase = gamePhaseRef.current
      
      // Also check if quarterly draft is being opened to prevent duplicates
      if (currentGamePhase !== 'playing' || isOpeningQuarterlyDraftRef.current) {
        return
      }

      const currentDay = useGameStore.getState().currentDayIndex

      if (currentDay >= 252) {
        // Game complete
        setGamePhase('settlement')
        useGameStore.setState({ isPlaying: false })
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
          animationIntervalRef.current = null
        }
        return
      }

      // Check for quarterly drafts (days 63, 126, 189)
      // Only open if not already opened for this quarter, not already in quarterly-draft phase, and not currently opening
      // Note: Type assertion needed here because TypeScript narrows currentGamePhase to 'playing' after the check above
      if (
        (currentDay === 63 || currentDay === 126 || currentDay === 189) &&
        !openedQuarterlyDraftsRef.current.has(currentDay) &&
        (currentGamePhase as GamePhase) !== 'quarterly-draft' &&
        !isOpeningQuarterlyDraftRef.current
      ) {
        // Set flag to prevent duplicate openings
        isOpeningQuarterlyDraftRef.current = true
        
        // Mark this quarter as opened immediately
        openedQuarterlyDraftsRef.current.add(currentDay)
        
        useGameStore.setState({ isPlaying: false })
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current)
          animationIntervalRef.current = null
        }
        
        // Generate quarterly draft
        const cards = generateQuarterlyDraft(aum || 10000, selectedYear || 2020)
        setDraftCards(cards)
        setSelectedCardIds(new Set())
        
        // Get current available capital and AUM
        const store = useGameStore.getState()
        const currentCapital = Math.max(0, store.realizedProfit)
        const aumValue = store.aum || 0
        const currentDayIndex = store.currentDayIndex
        
        // Fetch prices for quarterly draft cards (async)
        ;(async () => {
          const priceMap = new Map<string, CardPriceInfo>()
          for (const card of cards) {
            const stockResult = await fetchHistoricalStockData(card.symbol, selectedYear || 2020)
            if (stockResult.success && stockResult.data.length > 0) {
              // Use current day price for quarterly draft
              const price = stockResult.data[currentDayIndex]?.close ?? stockResult.data[0].close
              
              // For quarterly draft, use AUM-based investment (15-25% of AUM)
              // This ensures cards are priced appropriately regardless of remaining capital
              const investmentPercentage = 0.15 + Math.random() * 0.10 // 15% to 25% of AUM
              const targetInvestment = aumValue * investmentPercentage
              
              // Calculate quantity based on AUM percentage, but don't exceed available capital
              const quantity = Math.max(1, Math.floor(targetInvestment / price))
              const totalCost = price * quantity
              
              // If calculated cost exceeds available capital, adjust quantity
              const adjustedQuantity = totalCost > currentCapital 
                ? Math.max(1, Math.floor(currentCapital / price))
                : quantity
              const adjustedTotalCost = price * adjustedQuantity
              
              priceMap.set(card.id, {
                cardId: card.id,
                price,
                quantity: adjustedQuantity,
                totalCost: adjustedTotalCost,
              })
            }
          }
          setCardPrices(priceMap)
        })()
        
        // Update ref immediately before state update
        gamePhaseRef.current = 'quarterly-draft'
        setGamePhase('quarterly-draft')
        return
      }

      // Increment day
      incrementDay()

      // Update all position prices
      portfolio.forEach(position => {
        if (position.data.length > currentDay + 1) {
          const newPrice = position.data[currentDay + 1].close
          updatePositionPrice(position.id, newPrice, currentDay + 1)
        }
      })

      // Send candle to Phaser based on chart mode
      if (chartMode === 'stock' && selectedPositionId) {
        const position = portfolio.find(p => p.id === selectedPositionId)
        if (position && position.data.length > currentDay + 1) {
          const candle = position.data[currentDay + 1]
          eventBus.emit(EVENTS.NEW_CANDLE, {
            id: `${position.symbol}-${currentDay + 1}-${candle.time}`,
            time: candle.time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
          })
        }
      } else if (chartMode === 'portfolio') {
        // Show portfolio total value
        // Use the same calculation as useGameStore.calculatePortfolioValue()
        // Total Assets = Cash (realizedProfit) + Stock Market Value (unrealizedProfit)
        const store = useGameStore.getState()
        const realizedProfit = store.realizedProfit
        const aumValue = store.aum || 0
        const dailyInflow = store.dailyCapitalInflow
        
        // Calculate portfolio value: Cash + Stock Market Value
        // Start with realized profit (cash balance)
        let portfolioValue = realizedProfit
        let previousValue = realizedProfit
        
        // Calculate previous day value for open price
        if (currentDay > 0) {
          portfolio.forEach(position => {
            if (position.data.length > currentDay) {
              // Add current market value of stocks (not just profit)
              previousValue += position.data[currentDay].close * position.quantity
            }
          })
        }
        
        // Calculate current day value
        portfolio.forEach(position => {
          if (position.data.length > currentDay + 1) {
            // Add current market value of stocks (not just profit)
            portfolioValue += position.data[currentDay + 1].close * position.quantity
          } else if (position.data.length > currentDay) {
            portfolioValue += position.data[currentDay].close * position.quantity
          }
        })
        
        // Create a synthetic candle representing portfolio total value
        const portfolioCandle = {
          id: `portfolio-${currentDay + 1}`,
          time: new Date().toISOString(),
          open: previousValue,
          high: portfolioValue * 1.01,
          low: portfolioValue * 0.99,
          close: portfolioValue,
          volume: 0,
        }
        
        eventBus.emit(EVENTS.NEW_CANDLE, portfolioCandle)
        
        // Update portfolio data for comparison line
        if (phaserRef.current?.scene) {
          const portfolioLineData = []
          // Calculate initial cash after purchase
          const initialCost = portfolio.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0)
          
          for (let day = 0; day <= currentDay + 1; day++) {
            // Calculate realized profit at this day
            // Initial cash = AUM - initial purchase cost
            // Then add daily inflow for each day
            const dayRealizedProfit = (aumValue - initialCost) + (dailyInflow * day)
            
            let dayValue = dayRealizedProfit
            portfolio.forEach(position => {
              if (position.data.length > day) {
                // Add current market value of stocks
                dayValue += position.data[day].close * position.quantity
              }
            })
            portfolioLineData.push({ day, price: dayValue })
          }
          phaserRef.current.scene.updatePortfolioData(portfolioLineData)
        }
      }
    }

    const interval = 1000 / speedMultiplierRef.current
    animationIntervalRef.current = setInterval(tick, interval)

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
    }
  }, [gamePhase, isPlaying, portfolio, selectedPositionId, chartMode, incrementDay, updatePositionPrice, aum, selectedYear, phaserRef])

  // Update chart when mode changes
  useEffect(() => {
    if (gamePhase !== 'playing' || !phaserRef.current?.scene) return

    const currentDay = useGameStore.getState().currentDayIndex
    const aumValue = useGameStore.getState().aum || 0
    const realizedProfit = useGameStore.getState().realizedProfit

    if (chartMode === 'portfolio') {
      // Calculate portfolio value: Cash + Stock Market Value
      // Use the same calculation as useGameStore.calculatePortfolioValue()
      let portfolioValue = realizedProfit  // Start with cash balance
      
      portfolio.forEach(position => {
        if (position.data.length > currentDay) {
          // Add current market value of stocks (not just profit)
          portfolioValue += position.data[currentDay].close * position.quantity
        }
      })

      const portfolioCandle = {
        id: `portfolio-${currentDay}`,
        time: new Date().toISOString(),
        open: portfolioValue,
        high: portfolioValue * 1.01,
        low: portfolioValue * 0.99,
        close: portfolioValue,
        volume: 0,
      }
      eventBus.emit(EVENTS.NEW_CANDLE, portfolioCandle)
    } else if (chartMode === 'stock' && selectedPositionId) {
      const position = portfolio.find(p => p.id === selectedPositionId)
      if (position && position.data.length > currentDay) {
        const candle = position.data[currentDay]
        eventBus.emit(EVENTS.NEW_CANDLE, {
          id: `${position.symbol}-${currentDay}-${candle.time}`,
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        })
      }
    }
  }, [chartMode, gamePhase, portfolio, selectedPositionId, phaserRef])

  // Handle quarterly draft selection
  const handleQuarterlySelect = useCallback(async (card: StockCard) => {
    if (!selectedYear) return

    const priceInfo = cardPrices.get(card.id)
    if (!priceInfo) return

    // Get current available capital (realizedProfit already includes dailyCapitalInflow)
    const store = useGameStore.getState()
    const currentCapital = Math.max(0, store.realizedProfit)

    // For quarterly draft, only one card can be selected
    if (selectedCardIds.has(card.id)) {
      // Deselect - refund capital
      setSelectedCardIds(new Set())
      const newCapital = Math.max(0, currentCapital + priceInfo.totalCost)
      useGameStore.setState({ realizedProfit: newCapital })
      return
    }
    
    // Select - check if can afford
    if (priceInfo.totalCost > currentCapital) {
      alert(`Insufficient funds. You need $${priceInfo.totalCost.toLocaleString()} but only have $${currentCapital.toLocaleString()}`)
      return
    }

    // Fetch stock data and create position
    const stockResult = await fetchHistoricalStockData(card.symbol, selectedYear)
    if (!stockResult.success || stockResult.data.length === 0) {
      console.error('Failed to fetch stock data for', card.symbol)
      return
    }

    // Use actual price from data for the current day
    // For quarterly draft, we're at currentDayIndex, so use data[currentDayIndex].close
    const actualPrice = stockResult.data[currentDayIndex]?.close ?? stockResult.data[0]?.close ?? priceInfo.price
    
    // IMPORTANT: Use priceInfo.totalCost (displayed on card) for consistency
    // The card shows priceInfo.totalCost to the user, so we must use that value
    // Even if actualPrice differs slightly, we use priceInfo.totalCost
    // and adjust quantity to match the displayed cost
    const cardDisplayedCost = priceInfo.totalCost
    
    // Verify priceInfo.price matches actual price
    if (Math.abs(priceInfo.price - actualPrice) > 0.01) {
      console.warn(`Price mismatch for ${card.symbol}: priceInfo=${priceInfo.price}, data[${currentDayIndex}]=${actualPrice}. Using card displayed cost: ${cardDisplayedCost}`)
    }

    // Calculate quantity based on actual price to match displayed cost
    // This ensures the portfolio position value matches what was shown on the card
    const adjustedQuantity = Math.max(1, Math.floor(cardDisplayedCost / actualPrice))
    const adjustedTotalCost = actualPrice * adjustedQuantity

    // Create portfolio position using actual price for buyPrice and currentPrice
    // But use adjustedQuantity to match the displayed cost
    const position = {
      id: `${card.symbol}-${Date.now()}-${Math.random()}`,
      symbol: card.symbol,
      stockName: card.stockName,
      sector: card.sector,
      rarity: card.rarity,
      buyPrice: actualPrice,  // Use actual price from data
      quantity: adjustedQuantity,  // Use adjusted quantity to match displayed cost
      currentPrice: actualPrice,  // Use actual price from data
      buyDayIndex: currentDayIndex,
      data: stockResult.data,
      currentDayIndex: currentDayIndex,
    }

    addToPortfolio(position)
    
    // Deduct capital using cardDisplayedCost (what user saw on card)
    // This ensures the deducted amount matches what was displayed
    const newCapital = Math.max(0, currentCapital - cardDisplayedCost)
    useGameStore.setState({ realizedProfit: newCapital })
    
    // Ensure totalAssets is recalculated after adding position
    useGameStore.getState().calculatePortfolioValue()
    
    console.log(`Quarterly Draft ${card.symbol}: displayed=${cardDisplayedCost}, actualPrice=${actualPrice}, quantity=${adjustedQuantity}, calculated=${adjustedTotalCost}`)
    
    setSelectedCardIds(new Set([card.id]))

    // Resume simulation after selection
    setTimeout(() => {
      isOpeningQuarterlyDraftRef.current = false
      gamePhaseRef.current = 'playing'
      setGamePhase('playing')
      useGameStore.setState({ isPlaying: true })
    }, 500)
  }, [selectedYear, cardPrices, selectedCardIds, currentDayIndex, addToPortfolio])

  // Handle new game
  const handleNewGame = useCallback(() => {
    useGameStore.getState().resetGame()
    setGamePhase('start')
    setDraftCards([])
    setSelectedPositionId(null)
  }, [])

  // Display values
  const displaySymbol = useMemo(() => {
    if (chartMode === 'stock' && selectedPositionId) {
      const position = portfolio.find(p => p.id === selectedPositionId)
      return position?.symbol || 'PORTFOLIO'
    }
    return 'PORTFOLIO'
  }, [chartMode, selectedPositionId, portfolio])

  const displayStockName = useMemo(() => {
    if (selectedPositionId) {
      const position = portfolio.find(p => p.id === selectedPositionId)
      return position?.stockName
    }
    return undefined
  }, [selectedPositionId, portfolio])

  // Render based on game phase
  if (gamePhase === 'start') {
    return <StartDashboard onStart={handleStartGame} />
  }

  if (gamePhase === 'draft' || gamePhase === 'quarterly-draft') {
    return (
      <SelectionOverlay
        cards={draftCards}
        layout={gamePhase === 'draft' ? 'initial' : 'quarterly'}
        onSelect={gamePhase === 'draft' ? handleCardSelect : handleQuarterlySelect}
        onComplete={gamePhase === 'draft' ? handleDraftComplete : undefined}
        showCompleteButton={gamePhase === 'draft'}
        title={gamePhase === 'draft' ? 'Select Your Initial Portfolio' : 'Quarterly Draft - Select One'}
        availableCapital={draftAvailableCapital}
        cardPrices={cardPrices}
        selectedCards={selectedCardIds}
      />
    )
  }

  if (gamePhase === 'settlement') {
    return <SettlementReport onNewGame={handleNewGame} />
  }

  // Main game view
  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {/* Capital Info */}
      <CapitalInfo />
      
      {/* Stock Chart Section */}
      <section className="h-[45vh] min-h-[420px] md:min-h-[440px] border-b border-primary/20 flex flex-col gap-0 flex-shrink-0">
        {/* Header */}
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-primary/10">
          <StageInfo
            stage={`Day ${currentDayIndex}/252`}
            currentWave={Math.floor(currentDayIndex / 63) + 1}
            maxWave={4}
            profitPercent={profitPercent}
            currentPrice={currentPrice}
            symbol={displaySymbol}
            stockName={displayStockName}
            year={selectedYear || undefined}
          />
        </div>

        {/* Chart Area */}
        <div className="flex-1 overflow-hidden relative">
          <PhaserGame
            ref={phaserRef}
            currentActiveScene={undefined}
            symbol={displaySymbol}
            autoFetch={false}
            mode="realtime"
          />
        </div>

        {/* Chart Controls */}
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-primary/10 bg-card/5">
          <ChartControls
            gameState={isPlaying ? 'PLAYING' : 'IDLE'}
            chartType={chartType}
            candleCount={candleCount}
            speedMultiplier={speedMultiplier}
            chartMode={chartMode}
            onStartStop={() => {
              useGameStore.setState({ isPlaying: !isPlaying })
            }}
            onChartTypeChange={handleChartTypeChange}
            onCandleCountChange={handleCandleCountChange}
            onSpeedChange={handleSpeedChange}
            onChartModeChange={(mode) => {
              setChartMode(mode)
              if (mode === 'stock' && !selectedPositionId && portfolio.length > 0) {
                // If switching to stock mode but no position selected, select first one
                setSelectedPositionId(portfolio[0].id)
              } else if (mode === 'portfolio') {
                // Clear selection when switching to portfolio
                setSelectedPositionId(null)
              }
            }}
          />
        </div>
      </section>

      {/* Bottom Section */}
      <div className="flex-1 overflow-y-auto bg-background">
        <QuickInventory 
          onStockSelect={(positionId) => {
            setSelectedPositionId(positionId)
            setChartMode('stock')
          }}
        />
        {selectedPositionId && (
          <div className="p-4">
            <TradingActions
              positionId={selectedPositionId}
              onAction={(action) => {
                if (action === 'sell') {
                  setSelectedPositionId(null)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
