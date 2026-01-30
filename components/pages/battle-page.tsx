'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { usePhaserGame } from '@/components/battle/hooks/usePhaserGame'
import { StageInfo } from '@/components/battle/ui/StageInfo'
import { ChartControls } from '@/components/battle/ui/ChartControls'
import { QuickInventory } from '@/components/battle/ui/QuickInventory'
import { QuickSkills } from '@/components/battle/ui/QuickSkills'
import { CharacterStats } from '@/components/battle/ui/CharacterStats'
import { mockHero, mockPartners, mockInventory, mockSkills } from '@/components/battle/constants'
import { eventBus, EVENTS } from '@/components/battle/event-bus'
import type { GameState, SpeedMultiplier } from '@/components/battle/types'

// Market candle data structure
interface MarketCandle {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Stage data structure
interface StageData {
  symbol: string
  stockName: string
  year: number
  fullYearData: MarketCandle[]
  currentIndex: number
}

// Phaser 컴포넌트를 dynamic import (SSR 비활성화)
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

export function BattlePage() {
  const stage = '4-12'
  const wave = { current: 1, max: 5 }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:52',message:'BattlePage component mounting',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  // Game state management
  const [gameState, setGameState] = useState<GameState>('IDLE')
  const [stageData, setStageData] = useState<StageData | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:59',message:'Initial state set',data:{gameState:'IDLE',hasStageData:false},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  const {
    phaserRef,
    phaserReady,
    currentPrice,
    profitPercent,
    chartType,
    candleCount,
    speedMultiplier,
    handleChartTypeChange,
    handleCandleCountChange,
    handleSpeedChange,
  } = usePhaserGame()

  // Speed ref to avoid including speedMultiplier in animation dependencies
  const speedMultiplierRef = useRef<SpeedMultiplier>(speedMultiplier)
  
  // Keep ref in sync with speedMultiplier
  useEffect(() => {
    speedMultiplierRef.current = speedMultiplier
  }, [speedMultiplier])

  // Display symbol - from stage data
  const displaySymbol = stageData?.symbol || (gameState === 'IDLE' ? 'Press Start' : 'LOADING...')
  const displayStockName = stageData?.stockName
  const displayYear = stageData?.year

  // Fetch new simulation data
  const fetchNewSimulation = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:88',message:'fetchNewSimulation CALLED',data:{stackTrace:new Error().stack?.split('\n').slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    setGameState('LOADING')
    
    try {
      console.log('🎯 Starting new simulation: Fetching ONE random ticker/year...')
      const response = await fetch('/api/market?type=historical')
      const result = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        console.log(`✅ Simulation loaded: ${result.symbol} - ${result.stockName} (${result.year})`)
        console.log(`📊 Full year data loaded: ${result.data.length} trading days`)
        
        // Clear existing chart data via event bus
        eventBus.emit(EVENTS.CLEAR_CHART)
        
        setStageData({
          symbol: result.symbol,
          stockName: result.stockName,
          year: result.year,
          fullYearData: result.data,
          currentIndex: 0
        })
        setGameState('PLAYING')
      } else {
        throw new Error('Failed to fetch simulation data')
      }
    } catch (error) {
      console.error('❌ Failed to start simulation:', error)
      setGameState('IDLE')
    }
  }, [])

  // Stop simulation and reset
  const stopSimulation = useCallback(() => {
    console.log('⏹️ Stopping simulation...')
    
    // Clear interval
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
      animationIntervalRef.current = null
    }
    
    // Clear chart data
    eventBus.emit(EVENTS.CLEAR_CHART)
    
    // Reset state
    setStageData(null)
    setGameState('IDLE')
  }, [])

  // Handle Start/Stop button
  const handleStartStop = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:139',message:'handleStartStop CLICKED',data:{gameState},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    if (gameState === 'IDLE') {
      fetchNewSimulation()
    } else if (gameState === 'PLAYING') {
      stopSimulation()
    }
  }, [gameState, fetchNewSimulation, stopSimulation])

  // Sequential animation loop - START ONLY (no dependencies on changing state)
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:148',message:'Animation useEffect triggered',data:{gameState,hasStageData:!!stageData,symbol:stageData?.symbol},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    if (gameState !== 'PLAYING' || !stageData) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:149',message:'Animation effect SKIPPED (not playing)',data:{gameState,hasStageData:!!stageData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      // Stop animation if not playing
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
      return
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:156',message:'Animation effect STARTING',data:{gameState,currentIndex:stageData.currentIndex,dataLength:stageData.fullYearData.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion

    // Check if animation is complete at start
    if (stageData.currentIndex >= stageData.fullYearData.length) {
      console.log('🎬 Year animation complete! All trading days displayed.')
      setGameState('IDLE')
      setStageData(null)
      return
    }

    // Animation tick function
    const tick = () => {
      setStageData(prev => {
        if (!prev) return null
        
        // Check if we've reached the end
        if (prev.currentIndex >= prev.fullYearData.length) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current)
            animationIntervalRef.current = null
          }
          // Trigger completion after state update completes
          setTimeout(() => {
            setGameState('IDLE')
            setStageData(null)
          }, 0)
          return prev
        }

        // Get next day's data
        const nextCandle = prev.fullYearData[prev.currentIndex]
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:209',message:'✅ React emitting NEW_CANDLE',data:{index:prev.currentIndex,total:prev.fullYearData.length,time:nextCandle.time},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        // Send to Phaser via event bus
        eventBus.emit(EVENTS.NEW_CANDLE, {
          id: `${prev.symbol}-${prev.currentIndex}-${nextCandle.time}`,
          time: nextCandle.time,
          open: nextCandle.open,
          high: nextCandle.high,
          low: nextCandle.low,
          close: nextCandle.close,
          volume: nextCandle.volume
        })

        console.log(`📈 Day ${prev.currentIndex + 1}/${prev.fullYearData.length}: ${nextCandle.time} - Close: $${nextCandle.close}`)

        // Increment index
        return {
          ...prev,
          currentIndex: prev.currentIndex + 1
        }
      })
    }

    // Start animation with initial speed (1 second per day at x1)
    const startAnimation = () => {
      const interval = 1000 / speedMultiplierRef.current
      animationIntervalRef.current = setInterval(tick, interval)
    }

    startAnimation()

    // Cleanup
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
    }
  }, [gameState, stageData?.symbol]) // Only depend on gameState and initial data load (symbol as proxy)

  // Separate effect to handle speed changes WITHOUT restarting animation or losing data
  useEffect(() => {
    if (gameState !== 'PLAYING' || !animationIntervalRef.current) {
      return
    }

    // Clear old interval and create new one with updated speed
    clearInterval(animationIntervalRef.current)
    
    const tick = () => {
      setStageData(prev => {
        if (!prev) return null
        
        if (prev.currentIndex >= prev.fullYearData.length) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current)
            animationIntervalRef.current = null
          }
          setTimeout(() => {
            setGameState('IDLE')
            setStageData(null)
          }, 0)
          return prev
        }

        const nextCandle = prev.fullYearData[prev.currentIndex]
        
        eventBus.emit(EVENTS.NEW_CANDLE, {
          id: `${prev.symbol}-${prev.currentIndex}-${nextCandle.time}`,
          time: nextCandle.time,
          open: nextCandle.open,
          high: nextCandle.high,
          low: nextCandle.low,
          close: nextCandle.close,
          volume: nextCandle.volume
        })

        return {
          ...prev,
          currentIndex: prev.currentIndex + 1
        }
      })
    }

    const interval = 1000 / speedMultiplierRef.current  // 1 second per day at x1
    animationIntervalRef.current = setInterval(tick, interval)
  }, [speedMultiplier]) // Only re-run when speed changes

  // Calculate target and resistance based on current price
  // Target: +5% from current price, Resistance: +10% from current price
  const targetPrice = useMemo(() => {
    if (currentPrice > 0) {
      return parseFloat((currentPrice * 1.05).toFixed(2))
    }
    return undefined
  }, [currentPrice])

  const resistancePrice = useMemo(() => {
    if (currentPrice > 0) {
      return parseFloat((currentPrice * 1.10).toFixed(2))
    }
    return undefined
  }, [currentPrice])

  const allCharacters = [mockHero, ...mockPartners]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {/* Stock Chart Section - Fixed Height (40% of screen) */}
      <section className="h-[40vh] min-h-[400px] border-b border-primary/20 flex flex-col gap-0 flex-shrink-0">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-primary/10">
          <StageInfo
            stage={stage}
            currentWave={wave.current}
            maxWave={wave.max}
            profitPercent={profitPercent}
            currentPrice={currentPrice}
            targetPrice={targetPrice}
            resistancePrice={resistancePrice}
            symbol={displaySymbol}
            stockName={displayStockName}
            year={displayYear}
          />
        </div>

        {/* Chart Area with Phaser */}
        <div className="flex-1 overflow-hidden relative">
          <PhaserGame 
            ref={phaserRef} 
            currentActiveScene={undefined}
            symbol={displaySymbol}
            targetPrice={targetPrice}
            resistancePrice={resistancePrice}
            autoFetch={false}
            mode="realtime"
          />
        </div>

        {/* Chart Controls */}
        <div className="flex-shrink-0 p-3 border-t border-primary/10 bg-card/5">
          <ChartControls
            gameState={gameState}
            chartType={chartType}
            candleCount={candleCount}
            speedMultiplier={speedMultiplier}
            onStartStop={handleStartStop}
            onChartTypeChange={handleChartTypeChange}
            onCandleCountChange={handleCandleCountChange}
            onSpeedChange={handleSpeedChange}
          />
        </div>
      </section>

      {/* Bottom Section: Inventory, Skills, Party - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-background">
        <QuickInventory items={mockInventory} />
        <QuickSkills skills={mockSkills} />
        <CharacterStats characters={allCharacters} />
      </div>
    </div>
  )
}
