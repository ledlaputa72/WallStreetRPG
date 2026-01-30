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
  private chartPadding = { top: 40, right: 80, bottom: 100, left: 10 }
  private volumeHeight: number = 60
  private animationTimer: Phaser.Time.TimerEvent | null = null
  private currentPrice: number = 125000
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private priceLabels: Phaser.GameObjects.Text[] = []
  private currentPriceLabel: Phaser.GameObjects.Text | null = null
  private areaFillGraphics: Phaser.GameObjects.Graphics | null = null
  private currentMarkerX: number = 0
  private currentMarkerY: number = 0
  private markerCircle: Phaser.GameObjects.Graphics | null = null

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

    // #region agent log
    console.error('✅ [FIX] Phaser create() - NOT auto-starting (waiting for React NEW_CANDLE events)')
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:115',message:'Phaser create() complete - NO auto-start',data:{hasHistoricalQueue:this.historicalQueue.length,isPlayingHistorical:this.isPlayingHistorical},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
    // #endregion
    // DO NOT auto-start - wait for React to send NEW_CANDLE events
    // this.startCandleGeneration() // REMOVED - React controls start/stop

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
    // #region agent log
    console.error('✅ [FIX] startCandleGeneration with 1000ms base interval')
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:198',message:'startCandleGeneration CALLED',data:{hasTime:!!this.time,speedMultiplier:this.speedMultiplier,hasExistingTimer:!!this.animationTimer},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:218',message:'Animation timer CREATED',data:{interval:baseInterval/this.speedMultiplier,speedMultiplier:this.speedMultiplier},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      console.error('Error starting candle generation:', error)
    }
  }

  private playNextCandle() {
    // #region agent log
    console.error('🔥 [H1] playNextCandle CALLED', {isHistorical: this.isPlayingHistorical, queue: this.historicalQueue.length, candles: this.candles.length})
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:233',message:'playNextCandle CALLED',data:{isPlayingHistorical:this.isPlayingHistorical,queueLength:this.historicalQueue.length,candlesCount:this.candles.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
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
      // #region agent log
      console.error('🔥🔥🔥 [H1] Generating SYNTHETIC candle - THIS IS THE AUTO-START BUG!', {price: this.currentPrice})
      fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:246',message:'Generating SYNTHETIC candle (auto-generation)',data:{currentPrice:this.currentPrice},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
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

  // Public method to update market data from API
  public updateMarketData(data: MarketDataUpdate) {
    if (data.candles && data.candles.length > 0) {
      if (data.targetPrice) this.targetPrice = data.targetPrice
      if (data.resistancePrice) this.resistancePrice = data.resistancePrice
      
      // Clear existing candles and start fresh
      this.candles = []
      
      // Queue all candles for animated playback
      this.historicalQueue = data.candles.map((c, i) => ({
        ...c,
        id: c.id || `api-candle-${i}`,
      }))
      
      this.isPlayingHistorical = true
      
      // Set initial price from first candle
      if (this.historicalQueue.length > 0) {
        this.currentPrice = this.historicalQueue[0].open
      }
      
      console.log(`Starting historical playback: ${this.historicalQueue.length} candles queued`)
    }
  }

  // Public method to update data (called from React)
  public updateData(candles: CandleData[]) {
    this.updateMarketData({ candles })
  }

  // Public method to clear chart (called when Stop is pressed)
  public clearChart() {
    console.log('🧹 Clearing chart data...')
    
    // Clear all candles
    this.candles = []
    this.historicalQueue = []
    
    // Stop historical playback
    this.isPlayingHistorical = false
    
    // Stop animation timer
    if (this.animationTimer) {
      this.animationTimer.destroy()
      this.animationTimer = null
    }
    
    // Reset prices
    this.currentPrice = 0
    
    // Clear the chart visually
    this.renderChart()
  }

  private addNewCandle(candle: CandleData) {
    this.candles.push(candle)

    const maxCandles = Math.max(100, this.visibleCandleCount + 20)
    if (this.candles.length > maxCandles) {
      this.candles.shift()
    }

    // Update current price
    this.currentPrice = candle.close

    // Smooth scroll animation with effects
    this.animateChartShift()

    // Emit events
    eventBus.emit(EVENTS.CANDLE_GENERATED, candle)
    eventBus.emit(EVENTS.PRICE_CHANGED, candle.close, candle.close - candle.open)
  }

  private animateChartShift() {
    // Render with animation
    this.renderChart()
    this.showPriceChangeEffect(this.candles[this.candles.length - 1])
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
          fontSize: intensity === 1 ? '12px' : intensity === 2 ? '14px' : '16px',
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
    if (!this.add) return

    try {
      // Clear all graphics
      this.gridGraphics?.clear()
      this.candleGraphics?.clear()
      this.volumeGraphics?.clear()
      this.priceLineGraphics?.clear()

      // Clear price labels
      this.priceLabels.forEach(label => label.destroy())
      this.priceLabels = []
      this.currentPriceLabel?.destroy()
      this.currentPriceLabel = null

      if (this.markerCircle) {
        this.markerCircle.destroy()
        this.markerCircle = null
      }

      // Calculate visible range based on zoom and pan
      const effectiveCount = Math.floor(this.visibleCandleCount / this.zoomLevel)
      const panCandles = Math.floor(this.panOffset / (15 * this.zoomLevel))
      const startIndex = Math.max(0, this.candles.length - effectiveCount - panCandles)
      const endIndex = Math.min(this.candles.length, startIndex + effectiveCount)
      
      const visibleCandles = this.candles.slice(startIndex, endIndex)

      if (visibleCandles.length === 0) return

      // Calculate price range with autoscale
      const prices = visibleCandles.flatMap(c => [c.high, c.low])
      if (this.targetPrice) prices.push(this.targetPrice)
      if (this.resistancePrice) prices.push(this.resistancePrice)
      
      let minPrice = Math.min(...prices)
      let maxPrice = Math.max(...prices)
      
      // Add padding to price range
      const pricePadding = (maxPrice - minPrice) * 0.1
      minPrice -= pricePadding
      maxPrice += pricePadding
      const priceRange = maxPrice - minPrice || 1

      // Calculate volume range
      const maxVolume = Math.max(...visibleCandles.map(c => c.volume))

      // Draw grid
      this.drawGrid(minPrice, maxPrice, priceRange)

      // Draw chart based on type
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

      // Draw current price line
      this.drawCurrentPriceLine(visibleCandles, minPrice, priceRange)

      // Draw target/resistance lines if set
      if (this.targetPrice) {
        this.drawHorizontalLine(this.targetPrice, minPrice, priceRange, 0x22c55e, 'Target')
      }
      if (this.resistancePrice) {
        this.drawHorizontalLine(this.resistancePrice, minPrice, priceRange, 0xef4444, 'Resistance')
      }
    } catch (error) {
      console.error('Error rendering chart:', error)
    }
  }

  private drawGrid(minPrice: number, maxPrice: number, priceRange: number) {
    if (!this.gridGraphics) return

    const graphics = this.gridGraphics
    graphics.lineStyle(1, this.GRID_COLOR, 0.3)

    const startX = this.chartPadding.left
    const endX = this.chartPadding.left + this.chartWidth
    const startY = this.chartPadding.top
    const endY = this.chartPadding.top + this.chartHeight

    // Horizontal grid lines (price levels)
    const priceSteps = 5
    for (let i = 0; i <= priceSteps; i++) {
      const y = startY + (this.chartHeight / priceSteps) * i
      graphics.beginPath()
      graphics.moveTo(startX, y)
      graphics.lineTo(endX, y)
      graphics.strokePath()

      // Price label on right side
      const price = maxPrice - (priceRange / priceSteps) * i
      const label = this.add.text(
        endX + 5,
        y,
        `$${price.toFixed(2)}`,
        {
          fontSize: '11px',
          color: '#94a3b8',
        }
      )
      label.setOrigin(0, 0.5)
      this.priceLabels.push(label)
    }

    // Vertical grid lines (time)
    const timeSteps = 5
    for (let i = 0; i <= timeSteps; i++) {
      const x = startX + (this.chartWidth / timeSteps) * i
      graphics.beginPath()
      graphics.moveTo(x, startY)
      graphics.lineTo(x, endY + this.volumeHeight)
      graphics.strokePath()
    }
  }

  private drawCurrentPriceLine(candles: CandleData[], minPrice: number, priceRange: number) {
    if (!this.priceLineGraphics || candles.length === 0) return

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

    // Current price label
    const isUp = lastCandle.close >= lastCandle.open
    this.currentPriceLabel = this.add.text(
      endX + 5,
      y,
      `$${currentPrice.toFixed(2)}`,
      {
        fontSize: '12px',
        color: '#000000',
        backgroundColor: isUp ? '#22c55e' : '#ef4444',
        padding: { x: 4, y: 2 },
        fontStyle: 'bold',
      }
    )
    this.currentPriceLabel.setOrigin(0, 0.5)
  }

  private drawHorizontalLine(price: number, minPrice: number, priceRange: number, color: number, label: string) {
    if (!this.priceLineGraphics) return

    const y = this.chartPadding.top + ((priceRange - (price - minPrice)) / priceRange) * this.chartHeight

    const graphics = this.priceLineGraphics
    graphics.lineStyle(1, color, 0.5)

    const startX = this.chartPadding.left
    const endX = this.chartPadding.left + this.chartWidth
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
    const priceLabel = this.add.text(
      endX + 5,
      y,
      `${label}: $${price.toFixed(2)}`,
      {
        fontSize: '10px',
        color: color === 0x22c55e ? '#22c55e' : '#ef4444',
      }
    )
    priceLabel.setOrigin(0, 0.5)
    this.priceLabels.push(priceLabel)
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

    // Calculate candle dimensions
    const availableWidth = this.chartWidth
    const candleWidth = Math.max(2, (availableWidth / candles.length) * 0.7 * this.zoomLevel)
    const candleGap = Math.max(1, (availableWidth / candles.length) * 0.3 * this.zoomLevel)
    const startX = this.chartPadding.left

    candles.forEach((candle, index) => {
      const x = startX + index * (candleWidth + candleGap)
      const isUp = candle.close >= candle.open
      const color = isUp ? this.BULL_COLOR : this.BEAR_COLOR

      // Y coordinates
      const highY = this.chartPadding.top + ((maxPrice - candle.high) / priceRange) * this.chartHeight
      const lowY = this.chartPadding.top + ((maxPrice - candle.low) / priceRange) * this.chartHeight
      const openY = this.chartPadding.top + ((maxPrice - candle.open) / priceRange) * this.chartHeight
      const closeY = this.chartPadding.top + ((maxPrice - candle.close) / priceRange) * this.chartHeight

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.max(1, Math.abs(closeY - openY))

      // Draw wick (thin line from high to low)
      graphics.lineStyle(1, color, 1)
      graphics.beginPath()
      graphics.moveTo(x + candleWidth / 2, highY)
      graphics.lineTo(x + candleWidth / 2, lowY)
      graphics.strokePath()

      // Draw body (filled rectangle)
      if (isUp) {
        // Hollow candle for up
        graphics.lineStyle(1, color, 1)
        graphics.strokeRect(x, bodyTop, candleWidth, bodyHeight)
        graphics.fillStyle(0x0f172a, 1) // Dark fill for hollow
        graphics.fillRect(x + 1, bodyTop + 1, candleWidth - 2, bodyHeight - 2)
      } else {
        // Filled candle for down
        graphics.fillStyle(color, 1)
        graphics.fillRect(x, bodyTop, candleWidth, bodyHeight)
      }

      // Draw volume bar
      const volumeBarHeight = (candle.volume / maxVolume) * this.volumeHeight
      const volumeY = this.chartPadding.top + this.chartHeight + 10

      volumeGfx.fillStyle(color, 0.3)
      volumeGfx.fillRect(
        x,
        volumeY + (this.volumeHeight - volumeBarHeight),
        candleWidth,
        volumeBarHeight
      )
    })

    // Store marker position for effects
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1]
      const lastIndex = candles.length - 1
      const x = startX + lastIndex * (candleWidth + candleGap) + candleWidth / 2
      const closeY = this.chartPadding.top + ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight

      this.currentMarkerX = x
      this.currentMarkerY = closeY
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

    const availableWidth = this.chartWidth
    const pointSpacing = candles.length > 1 ? availableWidth / (candles.length - 1) : availableWidth
    const startX = this.chartPadding.left

    const isUp = candles[candles.length - 1].close >= candles[0].open
    const lineColor = isUp ? this.BULL_COLOR : this.BEAR_COLOR

    // Draw line
    graphics.lineStyle(2, lineColor, 1)
    graphics.beginPath()

    candles.forEach((candle, index) => {
      const x = startX + index * pointSpacing
      const y = this.chartPadding.top + ((maxPrice - candle.close) / priceRange) * this.chartHeight

      if (index === 0) {
        graphics.moveTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })
    graphics.strokePath()

    // Draw filled area
    graphics.fillStyle(lineColor, 0.15)
    graphics.beginPath()

    const chartBottom = this.chartPadding.top + this.chartHeight

    candles.forEach((candle, index) => {
      const x = startX + index * pointSpacing
      const y = this.chartPadding.top + ((maxPrice - candle.close) / priceRange) * this.chartHeight

      if (index === 0) {
        graphics.moveTo(x, chartBottom)
        graphics.lineTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })

    graphics.lineTo(startX + (candles.length - 1) * pointSpacing, chartBottom)
    graphics.closePath()
    graphics.fillPath()

    // Marker at last point
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1]
      const x = startX + (candles.length - 1) * pointSpacing
      const y = this.chartPadding.top + ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight

      this.currentMarkerX = x
      this.currentMarkerY = y

      this.markerCircle = this.add.graphics()
      this.markerCircle.fillStyle(lineColor, 1)
      this.markerCircle.fillCircle(x, y, 5)
    }

    // Volume bars
    this.renderVolumeBars(candles, maxVolume, startX, pointSpacing)
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

    const availableWidth = this.chartWidth
    const pointSpacing = candles.length > 1 ? availableWidth / (candles.length - 1) : availableWidth
    const startX = this.chartPadding.left

    const isUp = candles[candles.length - 1].close >= candles[0].open
    const lineColor = isUp ? this.BULL_COLOR : this.BEAR_COLOR

    graphics.lineStyle(2, lineColor, 1)
    graphics.beginPath()

    candles.forEach((candle, index) => {
      const x = startX + index * pointSpacing
      const y = this.chartPadding.top + ((maxPrice - candle.close) / priceRange) * this.chartHeight

      if (index === 0) {
        graphics.moveTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })
    graphics.strokePath()

    // Marker at last point
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1]
      const x = startX + (candles.length - 1) * pointSpacing
      const y = this.chartPadding.top + ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight

      this.currentMarkerX = x
      this.currentMarkerY = y

      this.markerCircle = this.add.graphics()
      this.markerCircle.fillStyle(lineColor, 1)
      this.markerCircle.fillCircle(x, y, 5)
    }

    // Volume bars
    this.renderVolumeBars(candles, maxVolume, startX, pointSpacing)
  }

  private renderVolumeBars(candles: CandleData[], maxVolume: number, startX: number, spacing: number) {
    if (!this.volumeGraphics || !this.add) return

    const volumeGfx = this.volumeGraphics
    const barWidth = Math.max(2, spacing * 0.7)

    candles.forEach((candle, index) => {
      const x = startX + index * spacing - barWidth / 2
      const volumeHeight = (candle.volume / maxVolume) * this.volumeHeight
      const volumeY = this.chartPadding.top + this.chartHeight + 10

      const isUp = index > 0 ? candle.close >= candles[index - 1].close : true
      volumeGfx.fillStyle(isUp ? this.BULL_COLOR : this.BEAR_COLOR, 0.3)
      volumeGfx.fillRect(
        x,
        volumeY + (this.volumeHeight - volumeHeight),
        barWidth,
        volumeHeight
      )
      
      // Add date labels below volume (show every 5th or 10th candle to avoid crowding)
      if (candle.time && index % 10 === 0) {
        try {
          const date = new Date(candle.time)
          const monthDay = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
          const dateLabel = this.add.text(x, volumeY + this.volumeHeight + 5, monthDay, {
            fontSize: '10px',
            color: '#888888',
            fontFamily: 'monospace'
          })
          dateLabel.setOrigin(0.5, 0)
          this.priceLabels.push(dateLabel)
        } catch (err) {
          // Skip if date parsing fails
        }
      }
    })
  }

  private changeChartType(type: 'candle' | 'area' | 'line') {
    this.chartType = type
    this.renderChart()
  }

  private changeSpeed(multiplier: number) {
    this.speedMultiplier = multiplier
    // No need to restart timer - React controls animation timing
    // #region agent log
    console.error('✅ [FIX] changeSpeed - multiplier updated, React controls timing')
    fetch('http://127.0.0.1:7242/ingest/c60d8c8b-bd90-44b5-bbef-8c7f26cd8999',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'battle-scene.ts:900',message:'changeSpeed called',data:{multiplier},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
    // #endregion
  }

  private changeCandleCount(count: number) {
    this.visibleCandleCount = count

    while (this.candles.length < count) {
      const lastCandle = this.candles[this.candles.length - 1] || {
        open: 175,
        close: 175,
        high: 176,
        low: 174,
        volume: 500000,
        id: 'initial',
      }

      const volatility = (Math.random() - 0.5) * 2
      const open = lastCandle.close
      const close = open + volatility

      this.candles.push({
        id: `candle-${Date.now()}-${Math.random()}`,
        open: parseFloat(open.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        high: parseFloat(Math.max(open, close + Math.random()).toFixed(2)),
        low: parseFloat(Math.min(open, close - Math.random()).toFixed(2)),
        volume: Math.random() * 1000000 + 100000,
      })
    }

    this.renderChart()
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
    // Per-frame update logic if needed
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
