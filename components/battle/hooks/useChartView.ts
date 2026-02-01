import { useState, useCallback } from 'react'
import { useGameStore } from '@/lib/stores/useGameStore'
import { eventBus, EVENTS } from '../event-bus'
import type { CandleData } from '../scenes/battle-scene'

/**
 * Hook for managing chart view switching between stocks
 */
export function useChartView() {
  const [activeStockId, setActiveStockId] = useState<string | null>(null)
  const portfolio = useGameStore(state => state.portfolioAssets)

  const switchToStock = useCallback(
    (stockId: string) => {
      const position = portfolio.find(p => p.id === stockId)
      if (!position) {
        console.warn(`Position ${stockId} not found`)
        return
      }

      // Convert position data to CandleData format
      const candles: CandleData[] = position.data.map((candle, index) => ({
        id: `${position.symbol}-${index}-${candle.time}`,
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      }))

      // Get data up to current day
      const currentDayIndex = position.currentDayIndex
      const visibleCandles = candles.slice(0, currentDayIndex + 1)

      // Update Phaser scene with new data
      eventBus.emit(EVENTS.UPDATE_MARKET_DATA, {
        candles: visibleCandles,
        symbol: position.symbol,
      })

      setActiveStockId(stockId)
    },
    [portfolio]
  )

  const switchToPortfolio = useCallback(() => {
    // Calculate weighted average portfolio line
    // This will be handled by the battle scene
    setActiveStockId(null)
    
    // Emit event to show portfolio view
    eventBus.emit(EVENTS.UPDATE_MARKET_DATA, {
      candles: [],
      symbol: 'PORTFOLIO',
    })
  }, [])

  const getActivePosition = useCallback(() => {
    if (!activeStockId) return null
    return portfolio.find(p => p.id === activeStockId)
  }, [activeStockId, portfolio])

  return {
    activeStockId,
    switchToStock,
    switchToPortfolio,
    getActivePosition,
  }
}
