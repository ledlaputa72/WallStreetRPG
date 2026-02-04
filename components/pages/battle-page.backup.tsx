'use client'

/**
 * @deprecated Legacy backup of battle-page (single-file version).
 * Use components/pages/battle-page.tsx for all updates.
 * Kept for reference only; see docs/CODEBASE.md.
 */

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Sparkles, Shield, Sword, Heart, Zap, TrendingUp, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { PhaserGameRef } from '@/components/battle/phaser-game'

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

const mockHero = {
  id: '1',
  name: 'Eldrin',
  level: 45,
  hp: 8500,
  maxHp: 10000,
  mp: 650,
  maxMp: 800,
  actionReady: true,
}

const mockPartners = [
  { id: '2', name: 'Luna', level: 42, hp: 7200, maxHp: 8000, mp: 900, maxMp: 1000, actionReady: true },
  { id: '3', name: 'Kai', level: 40, hp: 9000, maxHp: 9500, mp: 450, maxMp: 600, actionReady: false },
  { id: '4', name: 'Zara', level: 43, hp: 6800, maxHp: 7500, mp: 1100, maxMp: 1200, actionReady: true },
]

const mockEnemies = [
  { id: '5', name: 'Goblin', level: 30, hp: 3000, maxHp: 4000, actionReady: true },
  { id: '6', name: 'Orc', level: 35, hp: 5000, maxHp: 6000, actionReady: false },
  { id: '7', name: 'Troll', level: 40, hp: 7000, maxHp: 8000, actionReady: true },
]

// Stock chart candle data
const generateInitialCandles = () => {
  const candles = []
  let basePrice = 125000
  for (let i = 0; i < 20; i++) {
    const volatility = (Math.random() - 0.5) * 5000
    const open = basePrice
    const close = basePrice + volatility
    const high = Math.max(open, close) + Math.random() * 2000
    const low = Math.min(open, close) - Math.random() * 2000
    candles.push({
      id: `candle-${i}`,
      open,
      close,
      high,
      low,
      volume: Math.random() * 50000,
    })
    basePrice = close
  }
  return candles
}

const generateNewCandle = (lastCandle: Candle) => {
  const volatility = (Math.random() - 0.5) * 4000
  const open = lastCandle.close
  const close = open + volatility
  const high = Math.max(open, close) + Math.random() * 2000
  const low = Math.min(open, close) - Math.random() * 2000

  return {
    id: `candle-${Date.now()}`,
    open,
    close,
    high,
    low,
    volume: Math.random() * 50000,
  }
}

// Candlestick Chart Component
interface Candle {
  open: number
  close: number
  high: number
  low: number
  volume: number
  id: string
}

// Area Chart Component - Robinhood style
const AreaChart = ({ candles, zoomLevel = 1 }: { candles: Candle[]; zoomLevel?: number }) => {
  const candleCount = Math.floor(20 * zoomLevel)
  const displayCandles = candles.slice(-candleCount)
  
  if (displayCandles.length < 2) return null

  // Calculate Y-axis range with some padding
  const prices = displayCandles.map(c => c.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = (maxPrice - minPrice) * 0.1
  const adjustedMin = minPrice - padding
  const adjustedMax = maxPrice + padding
  const range = adjustedMax - adjustedMin || 1

  const getY = (price: number) => {
    return ((adjustedMax - price) / range) * 100
  }

  // Determine if trend is up or down
  const isUp = displayCandles[displayCandles.length - 1].close >= displayCandles[0].close
  const lineColor = isUp ? '#00ff88' : '#ff3b30'
  const gradientId = isUp ? 'areaGradientUp' : 'areaGradientDown'

  // Generate SVG path for the line - leave 10% (2 grids out of 20) on right side
  const width = 100
  const usableWidth = width * 0.9 // Use only 90% of width, leaving 10% empty on right
  const stepX = usableWidth / (displayCandles.length - 1)
  
  const linePath = displayCandles
    .map((candle, i) => {
      const x = i * stepX
      const y = getY(candle.close)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Generate area path (closed shape for gradient fill)
  const lastX = (displayCandles.length - 1) * stepX
  const areaPath = `${linePath} L ${lastX} 100 L 0 100 Z`

  // Current price position
  const currentPrice = displayCandles[displayCandles.length - 1].close
  const currentY = getY(currentPrice)
  const currentX = lastX // X position for the end dot (90% from left)

  // Volume calculation
  const maxVolume = Math.max(...displayCandles.map(c => c.volume), 1)

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Volume bars background */}
      <div className="absolute inset-0 flex px-4 pointer-events-none z-0">
        {displayCandles.map((candle, index) => (
          <div
            key={`vol-area-${candle.id}`}
            className="flex-1 flex justify-center items-end"
            style={{ 
              height: '100%',
              maxWidth: `${usableWidth / displayCandles.length}%`,
            }}
          >
            <motion.div
              className="w-4/5"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.01 }}
              style={{
                height: `${(candle.volume / maxVolume) * 25}%`,
                transformOrigin: 'bottom',
                backgroundColor: 'rgba(0, 80, 70, 0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Price labels on right */}
      <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between text-[10px] text-muted-foreground z-10">
        <span>${adjustedMax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${((adjustedMax + adjustedMin) / 2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${adjustedMin.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>

      {/* Current price indicator */}
      <div 
        className="absolute z-20 flex items-center"
        style={{ 
          top: `${currentY}%`,
          left: `${currentX}%`,
          transform: 'translateY(-50%)',
        }}
      >
        <div className="h-px border-t border-dashed border-muted-foreground/30 absolute" style={{ width: '100vw', left: 0 }} />
        <div 
          className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium ml-4"
          style={{ backgroundColor: lineColor }}
        >
          ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>

      {/* Chart SVG */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox={`0 0 ${width} 100`} 
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="areaGradientUp" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="areaGradientDown" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff3b30" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ff3b30" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
          style={{ strokeWidth: '2px' }}
        />

        {/* End dot */}
        <circle
          cx={currentX}
          cy={currentY}
          r="1"
          fill={lineColor}
          style={{ filter: `drop-shadow(0 0 4px ${lineColor})` }}
        />
      </svg>

      {/* Animated glow at current price */}
      <motion.div
        className="absolute w-3 h-3 rounded-full z-20"
        style={{ 
          left: `${currentX}%`,
          top: `${currentY}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: lineColor,
          boxShadow: `0 0 10px ${lineColor}`,
        }}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

const CandlestickChart = ({ candles, zoomLevel = 1 }: { candles: Candle[]; zoomLevel?: number }) => {
  const [displayCandles, setDisplayCandles] = useState(candles.slice(-Math.floor(20 * zoomLevel), -1))
  const [animatingCandle, setAnimatingCandle] = useState<Candle | null>(null)
  const [candleScale, setCandleScale] = useState(1)
  const [volumeScales, setVolumeScales] = useState<{ [key: string]: number }>({})

  // Update display candles and set animating candle
  useEffect(() => {
    if (candles.length > 0) {
      const candleCount = Math.floor(20 * zoomLevel)
      setDisplayCandles(candles.slice(-candleCount, -1))
      setAnimatingCandle(candles[candles.length - 1])
      
      // Initialize volume animation scales
      const scales: { [key: string]: number } = {}
      candles.slice(-candleCount).forEach(c => {
        scales[c.id] = 0
      })
      setVolumeScales(scales)
    }
  }, [candles, zoomLevel])

  // Animation loop - 5 oscillations over 1 second for candle
  useEffect(() => {
    let animationCount = 0
    const totalOscillations = 5

    const animationInterval = setInterval(() => {
      const progress = (animationCount % (totalOscillations * 2)) / (totalOscillations * 2)
      // Sine wave for smooth oscillation from 0.5 to 1.5 and back
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.5
      setCandleScale(scale)

      animationCount++
    }, 100) // 100ms per step = 10 steps per second

    return () => clearInterval(animationInterval)
  }, [])

  // Volume animation for new candles
  useEffect(() => {
    if (animatingCandle && volumeScales[animatingCandle.id] !== 1) {
      const timer = setTimeout(() => {
        setVolumeScales(prev => ({
          ...prev,
          [animatingCandle.id]: 1
        }))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [animatingCandle, volumeScales])

  // Calculate Y-axis range
  const allPrices = [
    ...displayCandles.flatMap(c => [c.open, c.close, c.high, c.low]),
    animatingCandle?.open || 0,
    animatingCandle?.close || 0,
  ].filter(p => p > 0)

  const minPrice = Math.min(...allPrices)
  const maxPrice = Math.max(...allPrices)
  const range = maxPrice - minPrice || 1

  const getY = (price: number) => {
    // Scale down to 50% height by using only middle portion of chart
    const centerY = 50
    const scaledRange = ((maxPrice - price) / range) * 50 // 50% of chart height
    return centerY - 25 + scaledRange // Center the candles vertically
  }

  const maxVolume = Math.max(...[...displayCandles, animatingCandle].filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined).map(c => c.volume), 1)

  // Calculate padding for right side (2 out of 20 grids = 10%)
  const rightPaddingPercent = 10

  // Current price for indicator
  const currentPrice = animatingCandle?.close || displayCandles[displayCandles.length - 1]?.close || 0

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-slate-950">
      {/* Price labels on right */}
      <div className="absolute right-2 top-4 bottom-4 flex flex-col justify-between text-[10px] text-muted-foreground z-20">
        <span>${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${((maxPrice + minPrice) / 2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        <span>${minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>

      {/* Volume bars background - with animation */}
      <div className="absolute inset-0 flex px-4 pointer-events-none z-0" style={{ paddingRight: `${rightPaddingPercent + 2}%` }}>
        {[...displayCandles, animatingCandle].map((candle) =>
          candle ? (
            <div
              key={`vol-${candle.id}`}
              className="flex-1 flex justify-center items-end"
              style={{ height: '100%' }}
            >
              <motion.div
                className="w-4/5"
                initial={{ scaleY: 0 }}
                animate={{
                  scaleY: 1
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  height: `${(candle.volume / maxVolume) * 25}%`,
                  transformOrigin: 'bottom',
                  backgroundColor: 'rgba(0, 80, 70, 0.3)',
                }}
              />
            </div>
          ) : null
        )}
      </div>

      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="20%" height="20%" patternUnits="objectBoundingBox">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Candles container - with right padding */}
      <div className="relative h-full w-full flex items-end justify-between px-4 pb-20 z-10" style={{ paddingRight: `${rightPaddingPercent + 2}%` }}>
        {/* Display candles */}
        {displayCandles.map((candle) => {
          const wickTop = getY(candle.high)
          const wickBottom = getY(candle.low)
          const bodyTop = getY(Math.max(candle.open, candle.close))
          const bodyBottom = getY(Math.min(candle.open, candle.close))
          const bodyHeight = bodyBottom - bodyTop || 1
          const isUp = candle.close >= candle.open

          return (
            <motion.div
              key={candle.id}
              layout
              className="flex-1 flex flex-col items-center justify-end relative h-full"
            >
              {/* Wick line */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-muted-foreground to-muted-foreground/40"
                style={{
                  top: `${100 - wickBottom}%`,
                  height: `${wickBottom - wickTop}%`,
                  opacity: 0.7,
                }}
              />

              {/* Candle body - 40% of flex width */}
              <div
                className={cn(
                  'absolute left-1/2 -translate-x-1/2',
                  isUp ? 'bg-[#00ff88]' : 'bg-[#ff3b30]',
                )}
                style={{
                  width: '40%',
                  top: `${100 - bodyBottom}%`,
                  height: `${bodyHeight}%`,
                  minHeight: '1px',
                }}
              />
            </motion.div>
          )
        })}

        {/* Animating candle (center, expanding from middle) */}
        {animatingCandle && (
          <div className="flex-1 flex flex-col items-center justify-center relative h-full">
            {/* Wick line */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-muted-foreground to-muted-foreground/40"
              style={{
                top: `${getY(animatingCandle.high)}%`,
                height: `${getY(animatingCandle.low) - getY(animatingCandle.high)}%`,
                opacity: 0.7,
              }}
            />

            {/* Candle body - 40% width, expands from middle */}
            <motion.div
              animate={{
                scaleY: candleScale,
              }}
              transition={{ duration: 0.1 }}
              style={{
                transformOrigin: 'center',
              }}
              className={cn(
                'absolute left-1/2 -translate-x-1/2',
                animatingCandle.close >= animatingCandle.open ? 'bg-[#00ff88]' : 'bg-[#ff3b30]',
              )}
            >
              <div
                className="w-full"
                style={{
                  width: '40%',
                  height: `${Math.abs(getY(animatingCandle.close) - getY(animatingCandle.open)) * candleScale}%`,
                  minHeight: '1px',
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

const mockBoss = { id: 'boss', name: 'Wall Street Index', hp: 125000, maxHp: 200000 }

const mockInventory = Array.from({ length: 10 }, (_, i) => ({
  id: `item-${i}`,
  name: i === 0 ? 'Legendary Sword' : i === 5 ? 'Epic Shield' : `Item ${i + 1}`,
  level: i === 0 ? 50 : i === 5 ? 45 : ((i * 7) % 50) + 1, // 고정된 레벨
  rarity: i === 0 ? 'legendary' : i === 5 ? 'epic' : i % 3 === 0 ? 'rare' : 'common' as const,
}))

const mockSkills = Array.from({ length: 10 }, (_, i) => ({
  id: `skill-${i}`,
  name: i === 0 ? 'Power Strike' : i === 1 ? 'Fire Blast' : i === 5 ? 'Heal' : `Skill ${i + 1}`,
  level: (i % 5) + 1, // 고정된 레벨 (1-5 순환)
  upCost: 1000 + (i * 250), // 고정된 비용 (1000, 1250, 1500, ...)
}))

export function BattlePage() {
  const stage = '4-12'
  const wave = { current: 1, max: 5 }
  const phaserRef = useRef<PhaserGameRef | null>(null)
  const eventBusRef = useRef<any>(null)
  const eventsRef = useRef<any>(null)
  const [inventoryExpanded, setInventoryExpanded] = useState(true)
  const [skillsExpanded, setSkillsExpanded] = useState(true)
  const [partyExpanded, setPartyExpanded] = useState(true)
  const [currentPrice, setCurrentPrice] = useState(125000)
  const [priceChange, setPriceChange] = useState(0)
  const [chartType, setChartType] = useState<'candle' | 'area' | 'line'>('candle')
  const [candleCount, setCandleCount] = useState(20)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [phaserReady, setPhaserReady] = useState(false)

  // EventBus 초기화 및 로드
  useEffect(() => {
    if (typeof window === 'undefined') return

    import('@/components/battle/event-bus').then(({ eventBus, EVENTS }) => {
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

      return () => {
        eventBus.off(EVENTS.PRICE_CHANGED, handlePriceChange)
        eventBus.off(EVENTS.SCENE_READY, handleSceneReady)
      }
    })
  }, [])

  const profitPercent = ((priceChange / currentPrice) * 100).toFixed(2)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {/* Stock Chart Section - Full height */}
      <section className="flex-1 border-b border-primary/20 overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">WALL STREET INDEX (WSI)</h2>
                <p className="text-xs text-muted-foreground">Real-time Market Data</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">${currentPrice.toLocaleString()}</div>
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className={cn(
                  'text-xs font-semibold',
                  priceChange >= 0 ? 'text-[#00ff88]' : 'text-[#ff3b30]'
                )}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toLocaleString()} ({profitPercent}%)
              </motion.div>
            </div>
          </div>

          {/* Target Resistance & Buying Power */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Target Resistance</span>
                <span className="text-muted-foreground text-[10px]">${Math.round(currentPrice).toLocaleString()} / $200,000</span>
              </div>
              <div className="relative h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400"
                  animate={{ width: `${Math.min((currentPrice / 200000) * 100, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Buying Power</span>
                <span className="text-muted-foreground text-[10px]">$85,500</span>
              </div>
              <div className="relative h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                  style={{ width: '85.5%' }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Margin</span>
                <span className="text-muted-foreground text-[10px]">$12,300</span>
              </div>
              <div className="relative h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                  style={{ width: '61.5%' }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart - Phaser Game */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          <div className="flex-1 overflow-hidden relative">
            <PhaserGame ref={phaserRef} />
            {!phaserReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Loading Battle Scene...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Chart controls */}
          <div className="flex-shrink-0 border-t border-primary/10 bg-background/50 p-3 flex gap-4 justify-center items-center">
            {/* Chart type toggle */}
            <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
              <Button
                variant={chartType === 'area' ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setChartType('area')
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CHART_TYPE, 'area')
                  }
                }}
                className="text-xs h-7 px-3"
              >
                Area
              </Button>
              <Button
                variant={chartType === 'candle' ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setChartType('candle')
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CHART_TYPE, 'candle')
                  }
                }}
                className="text-xs h-7 px-3"
              >
                Candle
              </Button>
              <Button
                variant={chartType === 'line' ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setChartType('line')
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CHART_TYPE, 'line')
                  }
                }}
                className="text-xs h-7 px-3"
              >
                Line
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-primary/20" />

            {/* Candle count buttons */}
            <div className="flex gap-1">
              <Button
                variant={candleCount === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('20x button clicked')
                  setCandleCount(20)
                  if (eventBusRef.current && eventsRef.current) {
                    console.log('Emitting CHANGE_CANDLE_COUNT: 20')
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CANDLE_COUNT, 20)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                20x
              </Button>
              <Button
                variant={candleCount === 30 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('30x button clicked')
                  setCandleCount(30)
                  if (eventBusRef.current && eventsRef.current) {
                    console.log('Emitting CHANGE_CANDLE_COUNT: 30')
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CANDLE_COUNT, 30)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                30x
              </Button>
              <Button
                variant={candleCount === 40 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  console.log('40x button clicked')
                  setCandleCount(40)
                  if (eventBusRef.current && eventsRef.current) {
                    console.log('Emitting CHANGE_CANDLE_COUNT: 40')
                    eventBusRef.current.emit(eventsRef.current.CHANGE_CANDLE_COUNT, 40)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                40x
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-primary/20" />

            {/* Speed buttons */}
            <div className="flex gap-1">
              <Button
                variant={speedMultiplier === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSpeedMultiplier(1)
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, 1)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                x1
              </Button>
              <Button
                variant={speedMultiplier === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSpeedMultiplier(2)
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, 2)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                x2
              </Button>
              <Button
                variant={speedMultiplier === 3 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSpeedMultiplier(3)
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, 3)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                x3
              </Button>
              <Button
                variant={speedMultiplier === 4 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSpeedMultiplier(4)
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, 4)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                x4
              </Button>
              <Button
                variant={speedMultiplier === 5 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSpeedMultiplier(5)
                  if (eventBusRef.current && eventsRef.current) {
                    eventBusRef.current.emit(eventsRef.current.CHANGE_SPEED, 5)
                  }
                }}
                className="text-xs h-7 px-2"
              >
                x5
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scrollable Content Area */}
      <div className={cn(
        'flex-1 overflow-y-auto bg-[#09090b]',
        !inventoryExpanded && !skillsExpanded && !partyExpanded ? 'overflow-y-hidden' : ''
      )}>
        {/* Quick Inventory */}
        <section className="bg-card/10 border-b border-primary/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Quick Inventory
            </h3>
            <motion.button
              onClick={() => setInventoryExpanded(!inventoryExpanded)}
              className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
            >
              {inventoryExpanded ? 'Collapse' : 'Expand'}
            </motion.button>
          </div>
          <motion.div
            layout
            className={cn(
              'grid gap-2',
              inventoryExpanded ? 'grid-cols-5' : 'grid-cols-10'
            )}
          >
            {mockInventory.map((item) => (
              <Popover key={item.id}>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1',
                      'bg-card hover:bg-accent transition-all duration-200',
                      item.rarity === 'legendary' && 'border-secondary shadow-lg shadow-secondary/20',
                      item.rarity === 'epic' && 'border-purple-500 shadow-lg shadow-purple-500/20',
                      item.rarity === 'rare' && 'border-blue-500',
                      item.rarity === 'common' && 'border-border',
                      !inventoryExpanded && 'p-1'
                    )}
                  >
                    <Shield className={cn(
                      'w-5 h-5',
                      !inventoryExpanded && 'w-3 h-3',
                      item.rarity === 'legendary' && 'text-secondary',
                      item.rarity === 'epic' && 'text-purple-500',
                      item.rarity === 'rare' && 'text-blue-500',
                      item.rarity === 'common' && 'text-muted-foreground'
                    )} />
                    {inventoryExpanded && (
                      <>
                        <span className="text-[10px] font-medium text-center line-clamp-1">{item.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">+{item.level}</Badge>
                      </>
                    )}
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <Badge variant="outline" className="text-xs">Lv.{item.level}</Badge>
                    </div>
                    <Button size="sm" className="w-full" variant="secondary">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Quick Upgrade
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </motion.div>
        </section>

        {/* Quick Skills */}
        <section className="bg-card/10 border-b border-primary/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Skills
            </h3>
            <motion.button
              onClick={() => setSkillsExpanded(!skillsExpanded)}
              className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
            >
              {skillsExpanded ? 'Collapse' : 'Expand'}
            </motion.button>
          </div>
          <motion.div
            layout
            className={cn(
              'grid gap-2',
              skillsExpanded ? 'grid-cols-5' : 'grid-cols-10'
            )}
          >
            {mockSkills.map((skill) => (
              <Popover key={skill.id}>
                <PopoverTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-0.5',
                      'bg-card hover:bg-accent transition-all duration-200 border-border',
                      !skillsExpanded && 'p-1'
                    )}
                  >
                    <Zap className={cn(
                      'w-5 h-5 text-primary',
                      !skillsExpanded && 'w-3 h-3'
                    )} />
                    {skillsExpanded && (
                      <>
                        <span className="text-[9px] font-medium text-center line-clamp-1">{skill.name}</span>
                        <Badge variant="outline" className="text-[8px] px-1 py-0">Lv.{skill.level}</Badge>
                        <span className="text-[8px] text-muted-foreground">{skill.upCost.toLocaleString()}G</span>
                      </>
                    )}
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{skill.name}</h4>
                      <Badge variant="outline" className="text-xs">Lv.{skill.level}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Upgrade Cost: {skill.upCost.toLocaleString()} Gold
                    </div>
                    <Button size="sm" className="w-full" variant="secondary">
                      <Zap className="w-3 h-3 mr-1" />
                      Use Skill
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ))}
          </motion.div>
        </section>
        <section className="bg-background/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Active Party
            </h3>
            <motion.button
              onClick={() => setPartyExpanded(!partyExpanded)}
              className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
            >
              {partyExpanded ? 'Collapse' : 'Expand'}
            </motion.button>
          </div>
          <motion.div
            layout
            className={cn(
              'grid gap-3',
              partyExpanded ? 'grid-cols-2' : 'grid-cols-4'
            )}
          >
            {[mockHero, ...mockPartners].map((char) => (
              <motion.div
                key={char.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card key={char.id} className={cn(
                  'p-3 bg-card/50 border border-border hover:border-primary/50 transition-all duration-300',
                  char.actionReady && 'ring-2 ring-primary/30 shadow-lg shadow-primary/10',
                  !partyExpanded && 'p-2'
                )}>
                  <div className={cn(
                    'flex flex-col items-center gap-2',
                    !partyExpanded && 'gap-1'
                  )}>
                    <div className={cn(
                      'w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center',
                      char.actionReady && 'animate-pulse',
                      !partyExpanded && 'w-10 h-10'
                    )}>
                      <Shield className={cn(
                        'w-7 h-7 text-primary',
                        !partyExpanded && 'w-5 h-5'
                      )} />
                    </div>
                    {partyExpanded && (
                      <>
                        <div className="text-center w-full">
                          <div className="font-semibold text-xs mb-1">{char.name}</div>
                          <Badge variant="secondary" className="text-[10px] mb-2">Lv.{char.level}</Badge>
                        </div>
                        <div className="w-full space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground w-5">HP</span>
                            <Progress value={(char.hp / char.maxHp) * 100} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground">{Math.round((char.hp / char.maxHp) * 100)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground w-5">MP</span>
                            <Progress value={(char.mp / char.maxMp) * 100} className="h-1.5 flex-1 bg-blue-950" />
                            <span className="text-[10px] text-muted-foreground">{Math.round((char.mp / char.maxMp) * 100)}%</span>
                          </div>
                        </div>
                        {char.actionReady && (
                          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-primary font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Action Ready</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  )
}
