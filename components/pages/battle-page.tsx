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
  
  // Stage-level data: stores ONE random ticker/year and full year data
  const [stageData, setStageData] = useState<StageData | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
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

  // Display symbol - from stage data
  const displaySymbol = stageData?.symbol || 'LOADING...'
  const displayStockName = stageData?.stockName
  const displayYear = stageData?.year

  // PHASE 1: Fetch historical data ONCE on stage mount
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:80',message:'useEffect fetch triggered',data:{hasStageData:!!stageData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const initializeStage = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:85',message:'Starting API fetch',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        console.log('🎯 Initializing stage: Fetching ONE random ticker/year...')
        const response = await fetch('/api/market?type=historical')
        const result = await response.json()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:92',message:'API fetch completed',data:{symbol:result.symbol,year:result.year,dataLength:result.data?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        if (result.success && result.data && result.data.length > 0) {
          console.log(`✅ Stage initialized: ${result.symbol} - ${result.stockName} (${result.year})`)
          console.log(`📊 Full year data loaded: ${result.data.length} trading days`)
          
          setStageData({
            symbol: result.symbol,
            stockName: result.stockName,
            year: result.year,
            fullYearData: result.data,
            currentIndex: 0
          })
          setIsAnimating(true)
        }
      } catch (error) {
        console.error('❌ Failed to initialize stage:', error)
      }
    }

    initializeStage()
  }, []) // Empty deps = run ONCE on mount

  // PHASE 2: Sequential day-by-day animation
  useEffect(() => {
    if (!stageData || !isAnimating) return

    // Clear any existing interval
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
    }

    // Animation complete check
    if (stageData.currentIndex >= stageData.fullYearData.length) {
      console.log('🎬 Year animation complete! All trading days displayed.')
      setIsAnimating(false)
      // TODO: Trigger next stage or reload
      return
    }

    // Start sequential animation: one candle every 200ms
    animationIntervalRef.current = setInterval(() => {
      setStageData(prev => {
        if (!prev) return null
        
        // Check if we've reached the end
        if (prev.currentIndex >= prev.fullYearData.length) {
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current)
          }
          return prev
        }

        // Get next day's data
        const nextCandle = prev.fullYearData[prev.currentIndex]
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-page.tsx:145',message:'Emitting NEW_CANDLE',data:{index:prev.currentIndex,symbol:prev.symbol,date:nextCandle.time},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
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
    }, 200) // 0.2 seconds per day = ~50 seconds for full year

    // Cleanup
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
        animationIntervalRef.current = null
      }
    }
  }, [stageData?.currentIndex, isAnimating])

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
            chartType={chartType}
            candleCount={candleCount}
            speedMultiplier={speedMultiplier}
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
