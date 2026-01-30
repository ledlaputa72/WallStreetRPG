'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import * as Phaser from 'phaser'
import BattleScene, { CandleData, MarketDataUpdate } from './scenes/battle-scene'
import { eventBus, EVENTS } from './event-bus'

export interface PhaserGameRef {
  game: Phaser.Game | null
  scene: BattleScene | null
  fetchMarketData: () => Promise<void>
}

interface MarketApiResponse {
  success: boolean
  symbol: string
  stockName?: string
  year?: number
  data: Array<{
    time: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  count?: number
  isDemo?: boolean
  isHistorical?: boolean
  message?: string
}

interface PhaserGameProps {
  currentActiveScene?: (scene: Phaser.Scene) => void
  symbol?: string
  targetPrice?: number
  resistancePrice?: number
  autoFetch?: boolean
  fetchInterval?: number // in milliseconds, default 60000 (1 minute)
  mode?: 'realtime' | 'historical' // 'historical' for random year/stock testing
  onHistoricalDataLoaded?: (data: { symbol: string; stockName: string; year: number }) => void
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  function PhaserGame({ 
    currentActiveScene, 
    symbol = 'AAPL',
    targetPrice,
    resistancePrice,
    autoFetch = true,
    fetchInterval = 60000,
    mode = 'realtime',
    onHistoricalDataLoaded,
  }, ref) {
    const gameRef = useRef<Phaser.Game | null>(null)
    const parentRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<BattleScene | null>(null)
    const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch market data from API
    const fetchMarketData = useCallback(async () => {
      try {
        const apiType = mode === 'historical' ? 'historical' : 'intraday'
        const response = await fetch(`/api/market?symbol=${symbol}&type=${apiType}`)
        const result: MarketApiResponse = await response.json()

        if (result.success && result.data && result.data.length > 0) {
          // Convert API data to CandleData format
          const effectiveSymbol = result.symbol || symbol
          const candles: CandleData[] = result.data.map((item, index) => ({
            id: `${effectiveSymbol}-${index}-${item.time}`,
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          }))

          // Prepare update data
          const updateData: MarketDataUpdate = {
            candles,
            symbol: effectiveSymbol,
            targetPrice,
            resistancePrice,
          }

          // Send data to Phaser scene via event bus
          eventBus.emit(EVENTS.UPDATE_MARKET_DATA, updateData)

          // Also update via direct reference if available
          if (sceneRef.current) {
            sceneRef.current.updateData(candles)
          }

          // Notify parent about historical data
          if (result.isHistorical && onHistoricalDataLoaded && result.stockName && result.year) {
            onHistoricalDataLoaded({
              symbol: result.symbol,
              stockName: result.stockName,
              year: result.year,
            })
          }

          if (result.isDemo) {
            console.log('Using demo market data:', result.message)
          }
          if (result.isHistorical) {
            console.log('Historical data loaded:', result.message)
          }
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      }
    }, [symbol, targetPrice, resistancePrice, mode, onHistoricalDataLoaded])

    useImperativeHandle(ref, () => ({
      game: gameRef.current,
      scene: sceneRef.current,
      fetchMarketData,
    }))

    useEffect(() => {
      if (typeof window === 'undefined' || !parentRef.current) return

      // If game already exists, return
      if (gameRef.current) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: parentRef.current,
        transparent: true,
        backgroundColor: 'transparent',
        width: parentRef.current.offsetWidth || 800,
        height: parentRef.current.offsetHeight || 600,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [BattleScene],
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
          },
        },
        render: {
          pixelArt: false,
          antialias: true,
          antialiasGL: true,
        },
        input: {
          mouse: {
            preventDefaultWheel: false,
          },
        },
      }

      gameRef.current = new Phaser.Game(config)

      // When scene is ready, store reference and optionally fetch data
      const handleSceneReady = () => {
        const scene = gameRef.current?.scene.getScene('BattleScene') as BattleScene
        if (scene) {
          sceneRef.current = scene
          if (currentActiveScene) {
            currentActiveScene(scene)
          }
          
          // Initial fetch if autoFetch is enabled
          if (autoFetch) {
            fetchMarketData()
          }
        }
      }

      eventBus.on(EVENTS.SCENE_READY, handleSceneReady)

      // Resize handler
      const handleResize = () => {
        if (gameRef.current && parentRef.current) {
          gameRef.current.scale.resize(
            parentRef.current.offsetWidth,
            parentRef.current.offsetHeight
          )
        }
      }

      window.addEventListener('resize', handleResize)

      // Cleanup
      return () => {
        eventBus.off(EVENTS.SCENE_READY, handleSceneReady)
        window.removeEventListener('resize', handleResize)
        if (gameRef.current) {
          gameRef.current.destroy(true)
          gameRef.current = null
        }
        sceneRef.current = null
      }
    }, [currentActiveScene, autoFetch, fetchMarketData])

    // Setup periodic fetch interval
    useEffect(() => {
      if (!autoFetch) return

      // Clear existing interval
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }

      // Set up new interval for periodic fetching
      fetchIntervalRef.current = setInterval(() => {
        fetchMarketData()
      }, fetchInterval)

      return () => {
        if (fetchIntervalRef.current) {
          clearInterval(fetchIntervalRef.current)
          fetchIntervalRef.current = null
        }
      }
    }, [autoFetch, fetchInterval, fetchMarketData])

    // Update target/resistance prices when they change
    useEffect(() => {
      if (sceneRef.current && (targetPrice !== undefined || resistancePrice !== undefined)) {
        eventBus.emit(EVENTS.UPDATE_MARKET_DATA, {
          candles: [],
          targetPrice,
          resistancePrice,
        })
      }
    }, [targetPrice, resistancePrice])

    return (
      <div
        ref={parentRef}
        id="phaser-container"
        className="w-full h-full relative"
        style={{ minHeight: '400px' }}
      />
    )
  }
)

PhaserGame.displayName = 'PhaserGame'
