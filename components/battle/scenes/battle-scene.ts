import * as Phaser from 'phaser'
import { eventBus, EVENTS } from '../event-bus'

export interface CandleData {
  time?: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  id: string
}

export interface MarketDataUpdate {
  candles: CandleData[]
  symbol?: string
  targetPrice?: number
  resistancePrice?: number
}

export default class BattleScene extends Phaser.Scene {
  private candles: CandleData[] = []
  private candleGraphics: Phaser.GameObjects.Graphics | null = null
  private volumeGraphics: Phaser.GameObjects.Graphics | null = null
  private gridGraphics: Phaser.GameObjects.Graphics | null = null
  private priceLineGraphics: Phaser.GameObjects.Graphics | null = null
  private chartType: 'candle' | 'area' | 'line' = 'candle'
  private speedMultiplier: number = 1
  private visibleCandleCount: number = 20
  private chartHeight: number = 0
  private chartWidth: number = 0
  private chartPadding = { top: 36, right: 72, bottom: 88, left: 12 }
  private volumeHeight: number = 56
  private labelFontSize: number = 14
  // Grid: 20x→24, 30x→34, 40x→44 columns (candle slots + 2 empty + 2 price area)
  private totalGridColumns(): number {
    return this.visibleCandleCount + 4
  }
  private gridWidth(): number {
    return this.chartWidth / this.totalGridColumns()
  }
  // Candle area: first visibleCandleCount columns only (new candle always at rightmost slot)
  private candleAreaEndX(): number {
    return this.chartPadding.left + this.visibleCandleCount * this.gridWidth()
  }
  // Price Y: high at 20% from top, low at 80% (middle 60% = price range)
  private priceToY(price: number, minPrice: number, maxPrice: number, priceRange: number): number {
    return this.chartPadding.top + 0.2 * this.chartHeight + ((maxPrice - price) / priceRange) * 0.6 * this.chartHeight
  }
  // Slot index for candle at visibleCandles[index]: right-aligned so newest is always at slot (visibleCandleCount - 1)
  private candleSlotIndex(visibleLength: number, index: number): number {
    return this.visibleCandleCount - visibleLength + index
  }
  private animationTimer: Phaser.Time.TimerEvent | null = null
  private currentPrice: number = 125000
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private priceLabels: Phaser.GameObjects.Text[] = []
  private currentPriceLabel: Phaser.GameObjects.Text | null = null
  private areaFillGraphics: Phaser.GameObjects.Graphics | null = null
  private currentMarkerX: number = 0
  private currentMarkerY: number = 0
  private markerCircle: Phaser.GameObjects.Graphics | null = null
  private scrollOffsetX: number = 0 // For smooth scroll animation

  // Zoom and pan
  private zoomLevel: number = 1
  private minZoom: number = 0.5
  private maxZoom: number = 3
  private panOffset: number = 0
  private isDragging: boolean = false
  private dragStartX: number = 0
  private lastPanOffset: number = 0

  // Target/Resistance prices for autoscale
  private targetPrice: number | null = null
  private resistancePrice: number | null = null

  // Historical data playback
  private historicalQueue: CandleData[] = []
  private isPlayingHistorical: boolean = false

  // Colors
  private readonly BULL_COLOR = 0x22c55e // Green for up
  private readonly BEAR_COLOR = 0xef4444 // Red for down
  private readonly GRID_COLOR = 0x334155
  private readonly PRICE_LINE_COLOR = 0xfbbf24 // Amber for current price

  constructor() {
    super('BattleScene')
  }

  preload() {
    // Create particle texture
    const graphics = this.add.graphics()
    graphics.fillStyle(0xffffff)
    graphics.fillCircle(16, 16, 16)
    graphics.generateTexture('particle', 32, 32)
    graphics.destroy()
  }

  init(data: { candles?: CandleData[] }) {
    if (data.candles) {
      this.candles = data.candles
    }
  }

  create() {
    const { width, height } = this.cameras.main
    this.labelFontSize = Math.max(12, Math.min(18, Math.floor(width / 40)))
    this.chartWidth = width - this.chartPadding.left - this.chartPadding.right
    this.chartHeight = height - this.chartPadding.top - this.chartPadding.bottom - this.volumeHeight

    // Initialize graphics layers (order matters for rendering)
    this.gridGraphics = this.add.graphics()
    this.volumeGraphics = this.add.graphics()
    this.candleGraphics = this.add.graphics()
    this.priceLineGraphics = this.add.graphics()

    // Initialize candles
    this.initializeCandles()

    // Setup particle system
    this.setupParticles()

    // Setup input handlers for zoom and pan
    this.setupInputHandlers()

    // Event listeners
    eventBus.on(EVENTS.NEW_CANDLE, this.addNewCandle.bind(this))
    eventBus.on(EVENTS.CHANGE_CHART_TYPE, this.changeChartType.bind(this))
    eventBus.on(EVENTS.CHANGE_SPEED, this.changeSpeed.bind(this))
    eventBus.on(EVENTS.CHANGE_CANDLE_COUNT, this.changeCandleCount.bind(this))
    eventBus.on(EVENTS.ATTACK_ENEMY, this.onAttackEnemy.bind(this))
    eventBus.on(EVENTS.UPDATE_MARKET_DATA, this.updateMarketData.bind(this))
    eventBus.on(EVENTS.CLEAR_CHART, this.clearChart.bind(this))

    // DO NOT auto-start - wait for React to send NEW_CANDLE events
    // this.startCandleGeneration() // REMOVED - React controls start/stop

    // Initial render after scene is fully created
    // Use time.delayedCall to ensure scene is fully active
    this.time.delayedCall(100, () => {
      this.renderChart()
    })

    // Scene ready
    eventBus.emit(EVENTS.SCENE_READY)
  }

  private setupInputHandlers() {
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1
      this.zoomLevel = Phaser.Math.Clamp(this.zoomLevel + zoomDelta, this.minZoom, this.maxZoom)
      this.renderChart()
    })

    // Drag to pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.dragStartX = pointer.x
      this.lastPanOffset = this.panOffset
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.dragStartX
        this.panOffset = this.lastPanOffset + deltaX
        
        // Clamp pan offset
        const maxPan = Math.max(0, (this.candles.length - this.visibleCandleCount) * 15 * this.zoomLevel)
        this.panOffset = Phaser.Math.Clamp(this.panOffset, -maxPan, maxPan)
        
        this.renderChart()
      }
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
    })

    this.input.on('pointerupoutside', () => {
      this.isDragging = false
    })
  }

  private initializeCandles() {
    let basePrice = 175 // Starting price (like AAPL)
    for (let i = 0; i < this.visibleCandleCount; i++) {
      const volatility = (Math.random() - 0.5) * 3
      const open = basePrice
      const close = basePrice + volatility
      const high = Math.max(open, close) + Math.random() * 1.5
      const low = Math.min(open, close) - Math.random() * 1.5

      this.candles.push({
        id: `candle-${i}`,
        open: parseFloat(open.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume: Math.random() * 1000000 + 100000,
      })
      basePrice = close
    }
    this.currentPrice = basePrice
    this.renderChart()
  }

  private setupParticles() {
    try {
      this.particles = this.add.particles(0, 0, 'particle', {
        speed: { min: 100, max: 200 },
        scale: { start: 0.8, end: 0 },
        blendMode: 'ADD',
        lifespan: 600,
        gravityY: 200,
        emitting: false,
      })
    } catch (e) {
      console.warn('Particle system initialization failed:', e)
      this.particles = null
    }
  }

  private startCandleGeneration() {
    if (!this.time) {
      console.warn('Scene time system not initialized')
      return
    }

    const baseInterval = 1000 // 1 second per candle at x1 speed

    try {
      if (this.animationTimer) {
        this.animationTimer.destroy()
      }

      this.animationTimer = this.time.addEvent({
        delay: baseInterval / this.speedMultiplier,
        callback: () => {
          this.playNextCandle()
        },
        loop: true,
      })
    } catch (error) {
      console.error('Error starting candle generation:', error)
    }
  }

  private playNextCandle() {
    // If playing historical data, play from queue
    if (this.isPlayingHistorical && this.historicalQueue.length > 0) {
      const nextCandle = this.historicalQueue.shift()
      if (nextCandle) {
        this.addNewCandle(nextCandle)
      }
      
      // If queue is empty, stop historical playback
      if (this.historicalQueue.length === 0) {
        this.isPlayingHistorical = false
        console.log('Historical data playback completed')
      }
    } else {
      // Generate synthetic candle
      this.generateNewCandle()
    }
  }

  private generateNewCandle() {
    // Don't generate synthetic candles if we have no base data
    if (this.candles.length === 0) {
      // If historical is queued, wait for it to start
      if (this.historicalQueue.length > 0) return
      
      // Create initial candle for demo mode
      const basePrice = this.currentPrice || 175
      this.candles.push({
        id: `initial-${Date.now()}`,
        open: basePrice,
        close: basePrice,
        high: basePrice + 1,
        low: basePrice - 1,
        volume: 500000,
        time: new Date().toISOString(),
      })
      return
    }

    const lastCandle = this.candles[this.candles.length - 1]
    const volatility = (Math.random() - 0.5) * 2
    const open = lastCandle.close
    const close = open + volatility
    const high = Math.max(open, close) + Math.random() * 1
    const low = Math.min(open, close) - Math.random() * 1

    const newCandle: CandleData = {
      id: `candle-${Date.now()}`,
      open: parseFloat(open.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: Math.random() * 1000000 + 100000,
      time: new Date().toISOString(),
    }

    this.addNewCandle(newCandle)
    this.currentPrice = close

    eventBus.emit(EVENTS.PRICE_CHANGED, close, close - open)
  }

  // Public method to update market data from API (or target/resistance only)
  public updateMarketData(data: MarketDataUpdate) {
    // Always update target/resistance when provided (e.g. from React price updates)
    if (data.targetPrice !== undefined) this.targetPrice = data.targetPrice
    if (data.resistancePrice !== undefined) this.resistancePrice = data.resistancePrice

    // Replace candles only when new bulk data is sent (e.g. autoFetch mode). Battle page uses NEW_CANDLE only.
    if (data.candles && data.candles.length > 0) {
      this.candles = []
      this.historicalQueue = data.candles.map((c, i) => ({
        ...c,
        id: c.id || `api-candle-${i}`,
      }))
      this.isPlayingHistorical = true
      if (this.historicalQueue.length > 0) {
        this.currentPrice = this.historicalQueue[0].open
      }
    }
  }

  // Public method to update data (called from React)
  public updateData(candles: CandleData[]) {
    this.updateMarketData({ candles })
  }

  // Public method to clear chart (called only when Stop is pressed)
  public clearChart() {
    this.candles = []
    this.historicalQueue = []
    this.isPlayingHistorical = false

    if (this.animationTimer) {
      this.animationTimer.destroy()
      this.animationTimer = null
    }

    this.currentPrice = 0
    this.scrollOffsetX = 0

    if (this.add && this.gridGraphics) {
      this.renderChart()
    }
  }

  private addNewCandle(candle: CandleData) {
    if (!this.add) return
    this.candles.push(candle)

    const maxCandles = 300
    if (this.candles.length > maxCandles) {
      this.candles.shift()
    }

    this.currentPrice = candle.close

    if (this.sys?.isActive()) {
      this.animateChartShift()
    } else {
      this.scrollOffsetX = 0
      this.renderChart()
    }

    eventBus.emit(EVENTS.CANDLE_GENERATED, candle)
    eventBus.emit(EVENTS.PRICE_CHANGED, candle.close, candle.close - candle.open)
  }

  private animateChartShift() {
    if (!this.tweens || !this.add || !this.sys?.isActive()) return

    // One grid cell = one candle slot (new candle always at rightmost slot)
    const oneSlot = this.gridWidth()
    this.scrollOffsetX = oneSlot

    // Render chart immediately with offset
    this.renderChart()

    // Animate scroll back to 0 (smooth left movement)
    // Use shorter duration and fewer updates to avoid object creation overhead
    this.tweens.add({
      targets: this,
      scrollOffsetX: 0,
      duration: 200, // Faster animation (200ms)
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        // Only render if scene is still active
        if (this.add && this.sys?.isActive()) {
          this.renderChart()
        }
      },
      onComplete: () => {
        this.scrollOffsetX = 0
        // Show effect only if scene is still active
        if (this.add && this.tweens && this.candles.length > 0) {
          this.showPriceChangeEffect(this.candles[this.candles.length - 1])
        }
      }
    })
  }

  private showPriceChangeEffect(candle: CandleData) {
    if (!this.add || !this.tweens) return

    try {
      const isUp = candle.close > candle.open
      const x = this.currentMarkerX
      const y = this.currentMarkerY

      const bodyLength = Math.abs(candle.close - candle.open)
      
      let intensity: 1 | 2 | 3
      if (bodyLength < 0.5) {
        intensity = 1
      } else if (bodyLength < 1) {
        intensity = 2
      } else {
        intensity = 3
      }

      const particleColor = isUp ? this.BULL_COLOR : this.BEAR_COLOR
      const particleCount = intensity === 1 ? 8 : intensity === 2 ? 15 : 25

      // Particle effect
      if (this.particles) {
        try {
          const emitter = this.particles as Phaser.GameObjects.Particles.ParticleEmitter
          if (emitter.setParticleTint) {
            emitter.setParticleTint(particleColor)
          }
          if (emitter.explode) {
            emitter.explode(particleCount, x, y)
          }
        } catch (e) {
          // Particle failure ignored
        }
      }

      // Ripple effect
      const effectCircle = this.add.graphics()
      if (effectCircle) {
        effectCircle.lineStyle(2, particleColor, 0.8)
        effectCircle.strokeCircle(x, y, 5)

        this.tweens.add({
          targets: effectCircle,
          alpha: 0,
          duration: 500,
          onUpdate: () => {
            effectCircle.clear()
            effectCircle.lineStyle(2, particleColor, effectCircle.alpha)
            effectCircle.strokeCircle(x, y, 5 + (1 - effectCircle.alpha) * 15)
          },
          onComplete: () => effectCircle.destroy(),
        })
      }

      // Price change text
      const change = candle.close - candle.open
      const changeText = this.add.text(
        x,
        y - 20,
        `${change > 0 ? '+' : ''}$${change.toFixed(2)}`,
        {
          fontSize: intensity === 1 ? `${this.labelFontSize}px` : intensity === 2 ? `${this.labelFontSize + 2}px` : `${this.labelFontSize + 4}px`,
          color: isUp ? '#22c55e' : '#ef4444',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        }
      )
      changeText.setOrigin(0.5, 1)

      this.tweens.add({
        targets: changeText,
        y: y - 50,
        alpha: 0,
        duration: 800,
        onComplete: () => changeText.destroy(),
      })
    } catch (error) {
      // Effect failure ignored
    }
  }

  private renderChart() {
    // Comprehensive safety checks
    if (!this.add) return
    if (!this.gridGraphics || !this.candleGraphics || !this.volumeGraphics || !this.priceLineGraphics) return

    try {
      // Clear all graphics
      this.gridGraphics.clear()
      this.candleGraphics.clear()
      this.volumeGraphics.clear()
      this.priceLineGraphics.clear()

      // Safely clear price labels
      this.priceLabels.forEach(label => {
        try {
          if (label && label.destroy) {
            label.destroy()
          }
        } catch (e) {
          // Ignore destroy errors
        }
      })
      this.priceLabels = []
      
      if (this.currentPriceLabel) {
        try {
          this.currentPriceLabel.destroy()
        } catch (e) {
          // Ignore
        }
        this.currentPriceLabel = null
      }

      if (this.markerCircle) {
        try {
          this.markerCircle.destroy()
        } catch (e) {
          // Ignore
        }
        this.markerCircle = null
      }

      // Visible = last N candles (right-aligned; new candle always at slot visibleCandleCount)
      const visibleCandles = this.candles.slice(-this.visibleCandleCount)

      let minPrice: number
      let maxPrice: number
      let priceRange: number

      if (visibleCandles.length === 0) {
        minPrice = this.currentPrice * 0.9
        maxPrice = this.currentPrice * 1.1
        priceRange = maxPrice - minPrice || 1
        this.drawGrid(minPrice, maxPrice, priceRange)
        return
      }

      const prices = visibleCandles.flatMap(c => [c.high, c.low])
      if (this.targetPrice) prices.push(this.targetPrice)
      if (this.resistancePrice) prices.push(this.resistancePrice)
      minPrice = Math.min(...prices)
      maxPrice = Math.max(...prices)
      const pad = (maxPrice - minPrice) * 0.05 || 0.01
      minPrice -= pad
      maxPrice += pad
      priceRange = maxPrice - minPrice || 1

      const maxVolume = Math.max(...visibleCandles.map(c => c.volume))

      this.drawGrid(minPrice, maxPrice, priceRange)

      switch (this.chartType) {
        case 'candle':
          this.renderCandlestickChart(visibleCandles, minPrice, maxPrice, priceRange, maxVolume)
          break
        case 'area':
          this.renderAreaChart(visibleCandles, minPrice, maxPrice, priceRange, maxVolume)
          break
        case 'line':
          this.renderLineChart(visibleCandles, minPrice, maxPrice, priceRange, maxVolume)
          break
      }

      this.drawCurrentPriceLine(visibleCandles, minPrice, maxPrice, priceRange)

      if (this.targetPrice) {
        this.drawHorizontalLine(this.targetPrice, minPrice, maxPrice, priceRange, 0x22c55e, 'Target')
      }
      if (this.resistancePrice) {
        this.drawHorizontalLine(this.resistancePrice, minPrice, maxPrice, priceRange, 0xef4444, 'Resistance')
      }
    } catch (error) {
      console.error('Error rendering chart:', error)
    }
  }

  private drawGrid(minPrice: number, maxPrice: number, priceRange: number) {
    if (!this.gridGraphics || !this.add) return

    const graphics = this.gridGraphics
    const gw = this.gridWidth()
    const totalCols = this.totalGridColumns()
    const startX = this.chartPadding.left
    const endX = this.chartPadding.left + this.chartWidth
    const startY = this.chartPadding.top
    const endY = this.chartPadding.top + this.chartHeight

    graphics.lineStyle(1, this.GRID_COLOR, 0.3)

    // Horizontal grid lines (~10 divisions): use priceToY so high=20% from top, low=80%
    const priceSteps = 10
    for (let i = 0; i <= priceSteps; i++) {
      const price = maxPrice - (priceRange / priceSteps) * i
      const y = this.priceToY(price, minPrice, maxPrice, priceRange)
      graphics.beginPath()
      graphics.moveTo(startX, y)
      graphics.lineTo(endX, y)
      graphics.strokePath()

      // Price label in price area (right 2 grid columns)
      try {
        const labelX = startX + (this.visibleCandleCount + 2) * gw + 4
        const label = this.add.text(
          labelX,
          y,
          `$${price.toFixed(2)}`,
          { fontSize: `${this.labelFontSize}px`, color: '#94a3b8' }
        )
        label.setOrigin(0, 0.5)
        this.priceLabels.push(label)
      } catch (e) {
        // Skip label if creation fails
      }
    }

    // Vertical grid lines: one per grid column (24/34/44)
    for (let i = 0; i <= totalCols; i++) {
      const x = startX + i * gw
      graphics.beginPath()
      graphics.moveTo(x, startY)
      graphics.lineTo(x, endY + this.volumeHeight)
      graphics.strokePath()
    }
  }

  private drawCurrentPriceLine(candles: CandleData[], minPrice: number, maxPrice: number, priceRange: number) {
    if (!this.priceLineGraphics || !this.add || candles.length === 0) return

    const lastCandle = candles[candles.length - 1]
    const currentPrice = lastCandle.close
    const y = this.chartPadding.top + ((priceRange - (currentPrice - minPrice)) / priceRange) * this.chartHeight

    const graphics = this.priceLineGraphics
    graphics.lineStyle(2, this.PRICE_LINE_COLOR, 0.8)

    // Draw dashed line
    const startX = this.chartPadding.left
    const endX = this.chartPadding.left + this.chartWidth
    const dashLength = 8
    const gapLength = 4

    let x = startX
    while (x < endX) {
      graphics.beginPath()
      graphics.moveTo(x, y)
      graphics.lineTo(Math.min(x + dashLength, endX), y)
      graphics.strokePath()
      x += dashLength + gapLength
    }

    // Current price label (in price area)
    try {
      const isUp = lastCandle.close >= lastCandle.open
      const labelX = this.chartPadding.left + (this.visibleCandleCount + 2) * this.gridWidth() + 4
      this.currentPriceLabel = this.add.text(
        labelX,
        y,
        `$${currentPrice.toFixed(2)}`,
        {
          fontSize: `${this.labelFontSize + 1}px`,
          color: '#000000',
          backgroundColor: isUp ? '#22c55e' : '#ef4444',
          padding: { x: 4, y: 2 },
          fontStyle: 'bold',
        }
      )
      this.currentPriceLabel.setOrigin(0, 0.5)
    } catch (e) {
      // Skip label if creation fails
    }
  }

  private drawHorizontalLine(price: number, minPrice: number, maxPrice: number, priceRange: number, color: number, label: string) {
    if (!this.priceLineGraphics || !this.add) return

    const y = this.priceToY(price, minPrice, maxPrice, priceRange)

    const graphics = this.priceLineGraphics
    graphics.lineStyle(1, color, 0.5)

    const startX = this.chartPadding.left
    const endX = this.candleAreaEndX()
    const dashLength = 5
    const gapLength = 3

    let x = startX
    while (x < endX) {
      graphics.beginPath()
      graphics.moveTo(x, y)
      graphics.lineTo(Math.min(x + dashLength, endX), y)
      graphics.strokePath()
      x += dashLength + gapLength
    }

    // Label
    try {
      const priceLabel = this.add.text(
        endX + 5,
        y,
        `${label}: $${price.toFixed(2)}`,
        {
          fontSize: `${Math.max(11, this.labelFontSize - 2)}px`,
          color: color === 0x22c55e ? '#22c55e' : '#ef4444',
        }
      )
      priceLabel.setOrigin(0, 0.5)
      this.priceLabels.push(priceLabel)
    } catch (e) {
      // Skip label if creation fails
    }
  }

  private renderCandlestickChart(
    candles: CandleData[],
    minPrice: number,
    maxPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0 || !this.candleGraphics || !this.volumeGraphics) return

    const graphics = this.candleGraphics
    const volumeGfx = this.volumeGraphics
    const gw = this.gridWidth()
    const candleWidth = Math.max(2, gw * 0.75) // one candle per grid cell, fixed width
    const startX = this.chartPadding.left

    candles.forEach((candle, index) => {
      const slotIndex = this.candleSlotIndex(candles.length, index)
      const x = startX + slotIndex * gw + (gw - candleWidth) / 2 - this.scrollOffsetX
      const isUp = candle.close >= candle.open
      const color = isUp ? this.BULL_COLOR : this.BEAR_COLOR

      const highY = this.priceToY(candle.high, minPrice, maxPrice, priceRange)
      const lowY = this.priceToY(candle.low, minPrice, maxPrice, priceRange)
      const openY = this.priceToY(candle.open, minPrice, maxPrice, priceRange)
      const closeY = this.priceToY(candle.close, minPrice, maxPrice, priceRange)

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.max(1, Math.abs(closeY - openY))

      graphics.lineStyle(1, color, 1)
      graphics.beginPath()
      graphics.moveTo(x + candleWidth / 2, highY)
      graphics.lineTo(x + candleWidth / 2, lowY)
      graphics.strokePath()

      if (isUp) {
        graphics.lineStyle(1, color, 1)
        graphics.strokeRect(x, bodyTop, candleWidth, bodyHeight)
        graphics.fillStyle(0x0f172a, 1)
        graphics.fillRect(x + 1, bodyTop + 1, candleWidth - 2, bodyHeight - 2)
      } else {
        graphics.fillStyle(color, 1)
        graphics.fillRect(x, bodyTop, candleWidth, bodyHeight)
      }

      const volumeBarHeight = (candle.volume / maxVolume) * this.volumeHeight
      const volumeY = this.chartPadding.top + this.chartHeight + 10
      volumeGfx.fillStyle(color, 0.3)
      volumeGfx.fillRect(x, volumeY + (this.volumeHeight - volumeBarHeight), candleWidth, volumeBarHeight)
    })

    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1]
      const lastSlot = this.candleSlotIndex(candles.length, candles.length - 1)
      const lastX = startX + lastSlot * gw + gw / 2 - this.scrollOffsetX
      this.currentMarkerX = lastX
      this.currentMarkerY = this.priceToY(lastCandle.close, minPrice, maxPrice, priceRange)
    }
  }

  private renderAreaChart(
    candles: CandleData[],
    minPrice: number,
    maxPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0 || !this.candleGraphics || !this.volumeGraphics) return

    const graphics = this.candleGraphics
    const gw = this.gridWidth()
    const startX = this.chartPadding.left
    const chartBottom = this.chartPadding.top + this.chartHeight

    const isUp = candles[candles.length - 1].close >= candles[0].open
    const lineColor = isUp ? this.BULL_COLOR : this.BEAR_COLOR

    graphics.lineStyle(2, lineColor, 1)
    graphics.beginPath()
    candles.forEach((candle, index) => {
      const slotIndex = this.candleSlotIndex(candles.length, index)
      const x = startX + (slotIndex + 0.5) * gw - this.scrollOffsetX
      const y = this.priceToY(candle.close, minPrice, maxPrice, priceRange)
      if (index === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    })
    graphics.strokePath()

    graphics.fillStyle(lineColor, 0.15)
    graphics.beginPath()
    candles.forEach((candle, index) => {
      const slotIndex = this.candleSlotIndex(candles.length, index)
      const x = startX + (slotIndex + 0.5) * gw - this.scrollOffsetX
      const y = this.priceToY(candle.close, minPrice, maxPrice, priceRange)
      if (index === 0) {
        graphics.moveTo(x, chartBottom)
        graphics.lineTo(x, y)
      } else graphics.lineTo(x, y)
    })
    const lastSlot = this.candleSlotIndex(candles.length, candles.length - 1)
    graphics.lineTo(startX + (lastSlot + 0.5) * gw - this.scrollOffsetX, chartBottom)
    graphics.closePath()
    graphics.fillPath()

    if (candles.length > 0 && this.add) {
      try {
        const lastCandle = candles[candles.length - 1]
        const lastSlot = this.candleSlotIndex(candles.length, candles.length - 1)
        const x = startX + (lastSlot + 0.5) * gw - this.scrollOffsetX
        const y = this.priceToY(lastCandle.close, minPrice, maxPrice, priceRange)
        this.currentMarkerX = x
        this.currentMarkerY = y
        this.markerCircle = this.add.graphics()
        this.markerCircle.fillStyle(lineColor, 1)
        this.markerCircle.fillCircle(x, y, 5)
      } catch (e) {
        // Skip marker if creation fails
      }
    }

    this.renderVolumeBars(candles, maxVolume, gw)
  }

  private renderLineChart(
    candles: CandleData[],
    minPrice: number,
    maxPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0 || !this.candleGraphics) return

    const graphics = this.candleGraphics
    const gw = this.gridWidth()
    const startX = this.chartPadding.left

    const isUp = candles[candles.length - 1].close >= candles[0].open
    const lineColor = isUp ? this.BULL_COLOR : this.BEAR_COLOR

    graphics.lineStyle(2, lineColor, 1)
    graphics.beginPath()
    candles.forEach((candle, index) => {
      const slotIndex = this.candleSlotIndex(candles.length, index)
      const x = startX + (slotIndex + 0.5) * gw - this.scrollOffsetX
      const y = this.priceToY(candle.close, minPrice, maxPrice, priceRange)
      if (index === 0) graphics.moveTo(x, y)
      else graphics.lineTo(x, y)
    })
    graphics.strokePath()

    if (candles.length > 0 && this.add) {
      try {
        const lastCandle = candles[candles.length - 1]
        const lastSlot = this.candleSlotIndex(candles.length, candles.length - 1)
        const x = startX + (lastSlot + 0.5) * gw - this.scrollOffsetX
        const y = this.priceToY(lastCandle.close, minPrice, maxPrice, priceRange)
        this.currentMarkerX = x
        this.currentMarkerY = y
        this.markerCircle = this.add.graphics()
        this.markerCircle.fillStyle(lineColor, 1)
        this.markerCircle.fillCircle(x, y, 5)
      } catch (e) {
        // Skip marker if creation fails
      }
    }

    this.renderVolumeBars(candles, maxVolume, gw)
  }

  private renderVolumeBars(candles: CandleData[], maxVolume: number, gw: number) {
    if (!this.volumeGraphics || !this.add) return

    const volumeGfx = this.volumeGraphics
    const barWidth = Math.max(2, gw * 0.75)
    const startX = this.chartPadding.left
    const volumeY = this.chartPadding.top + this.chartHeight + 10

    candles.forEach((candle, index) => {
      const slotIndex = this.candleSlotIndex(candles.length, index)
      const x = startX + slotIndex * gw + (gw - barWidth) / 2 - this.scrollOffsetX
      const volumeHeight = (candle.volume / maxVolume) * this.volumeHeight

      const isUp = index > 0 ? candle.close >= candles[index - 1].close : true
      volumeGfx.fillStyle(isUp ? this.BULL_COLOR : this.BEAR_COLOR, 0.3)
      volumeGfx.fillRect(x, volumeY + (this.volumeHeight - volumeHeight), barWidth, volumeHeight)

      if (this.add && candle.time && index % 10 === 0) {
        try {
          const date = new Date(candle.time)
          const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
          const dateLabel = this.add.text(x + barWidth / 2, volumeY + this.volumeHeight + 5, monthDay, {
            fontSize: `${Math.max(11, this.labelFontSize - 2)}px`,
            color: '#888888',
            fontFamily: 'monospace'
          })
          dateLabel.setOrigin(0.5, 0)
          this.priceLabels.push(dateLabel)
        } catch (err) {
          // Skip if date parsing or label creation fails
        }
      }
    })
  }

  private changeChartType(type: 'candle' | 'area' | 'line') {
    this.chartType = type
    if (this.add && this.gridGraphics) {
      this.renderChart()
    }
  }

  private changeSpeed(multiplier: number) {
    this.speedMultiplier = multiplier
    // No need to restart timer - React controls animation timing
  }

  // Display-only: change how many candles are visible (20/30/40). Do NOT add or reload data.
  private changeCandleCount(count: number) {
    this.visibleCandleCount = count
    if (this.add && this.gridGraphics) {
      this.renderChart()
    }
  }

  private onAttackEnemy(_enemyId: string) {
    if (!this.add || !this.tweens) return

    try {
      const x = Phaser.Math.Between(100, this.chartWidth - 100)
      const y = Phaser.Math.Between(50, this.chartHeight / 2)

      if (this.particles) {
        try {
          const emitter = this.particles as Phaser.GameObjects.Particles.ParticleEmitter
          if (emitter.explode) {
            emitter.explode(20, x, y)
          }
        } catch (e) {
          // Ignore particle failure
        }
      }

      const impact = this.add.circle(x, y, 5, 0xfbbf24)
      this.tweens.add({
        targets: impact,
        radius: 30,
        alpha: 0,
        duration: 300,
        onComplete: () => impact.destroy(),
      })
    } catch (error) {
      // Ignore effect failure
    }
  }

  update() {
    // Responsive: recalc chart dimensions when canvas size changes
    const { width, height } = this.cameras.main
    const newChartWidth = width - this.chartPadding.left - this.chartPadding.right
    const newChartHeight = height - this.chartPadding.top - this.chartPadding.bottom - this.volumeHeight
    if (newChartWidth !== this.chartWidth || newChartHeight !== this.chartHeight) {
      this.chartWidth = newChartWidth
      this.chartHeight = newChartHeight
      this.labelFontSize = Math.max(12, Math.min(18, Math.floor(width / 40)))
      if (this.add && this.gridGraphics) this.renderChart()
    }
  }

  shutdown() {
    eventBus.off(EVENTS.NEW_CANDLE, this.addNewCandle.bind(this))
    eventBus.off(EVENTS.CHANGE_CHART_TYPE, this.changeChartType.bind(this))
    eventBus.off(EVENTS.CHANGE_SPEED, this.changeSpeed.bind(this))
    eventBus.off(EVENTS.CHANGE_CANDLE_COUNT, this.changeCandleCount.bind(this))
    eventBus.off(EVENTS.ATTACK_ENEMY, this.onAttackEnemy.bind(this))
    eventBus.off(EVENTS.UPDATE_MARKET_DATA, this.updateMarketData.bind(this))
    eventBus.off(EVENTS.CLEAR_CHART, this.clearChart.bind(this))

    if (this.animationTimer) {
      this.animationTimer.destroy()
    }
  }
}
