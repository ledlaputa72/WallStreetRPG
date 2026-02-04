import { useState, useEffect, useRef } from 'react'
import type { PhaserGameRef } from '../phaser-game'
import type { ChartType, CandleCount, SpeedMultiplier } from '../types'

export function usePhaserGame() {
  const phaserRef = useRef<PhaserGameRef | null>(null)
  const eventBusRef = useRef<any>(null)
  const eventsRef = useRef<any>(null)
  const [phaserReady, setPhaserReady] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(125000)
  const [priceChange, setPriceChange] = useState(0)
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [candleCount, setCandleCount] = useState<CandleCount>(20)
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedMultiplier>(1)

  // EventBus 초기화 및 로드
  useEffect(() => {
    if (typeof window === 'undefined') return

    let cleanup: (() => void) | undefined

    import('../event-bus').then(({ eventBus, EVENTS }) => {
      eventBusRef.current = eventBus
      eventsRef.current = EVENTS
      
      const handlePriceChange = (price: number, change: number) => {
        setCurrentPrice(price)
        setPriceChange(change)
      }

      const handleSceneReady = () => {
        setPhaserReady(true)
      }

      eventBus.on(EVENTS.PRICE_CHANGED, handlePriceChange)
      eventBus.on(EVENTS.SCENE_READY, handleSceneReady)

      cleanup = () => {
        eventBus.off(EVENTS.PRICE_CHANGED, handlePriceChange)
        eventBus.off(EVENTS.SCENE_READY, handleSceneReady)
      }
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // 차트 타입 변경
  const handleChartTypeChange = (type: ChartType) => {
    if (typeof window === 'undefined' || !eventBusRef.current || !eventsRef.current) return
    
    setChartType(type)
    eventBusRef.current.emit(eventsRef.current.CHANGE_CHART_TYPE, type)
  }

  // 캔들 개수 변경 (display only - does not reload data)
  const handleCandleCountChange = (count: CandleCount) => {
    if (typeof window === 'undefined' || !eventBusRef.current || !eventsRef.current) return
    setCandleCount(count)
    eventBusRef.current.emit(eventsRef.current.CHANGE_CANDLE_COUNT, count)
  }

  // 속도 변경
  const handleSpeedChange = (speed: SpeedMultiplier) => {
    if (typeof window === 'undefined' || !eventBusRef.current || !eventsRef.current) return
    
    setSpeedMultiplier(speed)
    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, speed)
  }

  const profitPercent = currentPrice !== 0
    ? ((priceChange / currentPrice) * 100).toFixed(2)
    : '0.00'

  return {
    phaserRef,
    phaserReady,
    currentPrice,
    priceChange,
    profitPercent,
    chartType,
    candleCount,
    speedMultiplier,
    handleChartTypeChange,
    handleCandleCountChange,
    handleSpeedChange,
  }
}
