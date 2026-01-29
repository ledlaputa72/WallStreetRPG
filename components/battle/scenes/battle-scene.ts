import * as Phaser from 'phaser'
import { eventBus, EVENTS } from '../event-bus'

export interface CandleData {
  open: number
  close: number
  high: number
  low: number
  volume: number
  id: string
}

export default class BattleScene extends Phaser.Scene {
  private candles: CandleData[] = []
  private candleGraphics: Phaser.GameObjects.Graphics[] = []
  private volumeGraphics: Phaser.GameObjects.Graphics[] = []
  private chartType: 'candle' | 'area' | 'line' = 'candle'
  private speedMultiplier: number = 1
  private visibleCandleCount: number = 20
  private candleWidth: number = 8
  private candleGap: number = 2
  private chartHeight: number = 0
  private chartWidth: number = 0
  private volumeHeight: number = 80
  private animationTimer: Phaser.Time.TimerEvent | null = null
  private currentPrice: number = 125000
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null
  private priceLabel: Phaser.GameObjects.Text | null = null
  private areaFillGraphics: Phaser.GameObjects.Graphics | null = null
  private currentMarkerX: number = 0
  private currentMarkerY: number = 0
  private markerCircle: Phaser.GameObjects.Graphics | null = null

  constructor() {
    super('BattleScene')
  }

  preload() {
    // 파티클용 간단한 원형 텍스처 생성
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
    this.chartWidth = width
    this.chartHeight = height - this.volumeHeight - 20

    // 초기 캔들 생성
    this.initializeCandles()

    // 파티클 시스템 설정
    this.setupParticles()

    // 가격 라벨 설정
    this.priceLabel = this.add.text(width - 150, 20, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000aa',
      padding: { x: 10, y: 5 }
    })

    // 이벤트 리스너 등록
    eventBus.on(EVENTS.NEW_CANDLE, this.addNewCandle.bind(this))
    eventBus.on(EVENTS.CHANGE_CHART_TYPE, this.changeChartType.bind(this))
    eventBus.on(EVENTS.CHANGE_SPEED, this.changeSpeed.bind(this))
    eventBus.on(EVENTS.CHANGE_CANDLE_COUNT, this.changeCandleCount.bind(this))
    eventBus.on(EVENTS.ATTACK_ENEMY, this.onAttackEnemy.bind(this))

    // 자동 캔들 생성 시작
    this.startCandleGeneration()

    // Scene 준비 완료 알림
    eventBus.emit(EVENTS.SCENE_READY)
  }

  private initializeCandles() {
    // 초기 캔들 생성 (visibleCandleCount 개수만큼)
    let basePrice = 125000
    for (let i = 0; i < this.visibleCandleCount; i++) {
      const volatility = (Math.random() - 0.5) * 5000
      const open = basePrice
      const close = basePrice + volatility
      const high = Math.max(open, close) + Math.random() * 2000
      const low = Math.min(open, close) - Math.random() * 2000
      
      this.candles.push({
        id: `candle-${i}`,
        open,
        close,
        high,
        low,
        volume: Math.random() * 50000,
      })
      basePrice = close
    }
    this.currentPrice = basePrice
    this.renderChart()
  }

  private setupParticles() {
    // 파티클 효과 설정 (공격, 스킬 사용 시)
    try {
      this.particles = this.add.particles(0, 0, 'particle', {
        speed: { min: 100, max: 200 },
        scale: { start: 1, end: 0 },
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
    // Scene의 time 시스템이 초기화되었는지 확인
    if (!this.time) {
      console.warn('Scene time system not initialized')
      return
    }
    
    const baseInterval = 2000 // 2초마다 새 캔들
    
    try {
      if (this.animationTimer) {
        this.animationTimer.destroy()
      }

      this.animationTimer = this.time.addEvent({
        delay: baseInterval / this.speedMultiplier,
        callback: () => {
          this.generateNewCandle()
        },
        loop: true,
      })
    } catch (error) {
      console.error('Error starting candle generation:', error)
    }
  }

  private generateNewCandle() {
    if (this.candles.length === 0) return

    const lastCandle = this.candles[this.candles.length - 1]
    const volatility = (Math.random() - 0.5) * 4000
    const open = lastCandle.close
    const close = open + volatility
    const high = Math.max(open, close) + Math.random() * 2000
    const low = Math.min(open, close) - Math.random() * 2000

    const newCandle: CandleData = {
      id: `candle-${Date.now()}`,
      open,
      close,
      high,
      low,
      volume: Math.random() * 50000,
    }

    this.addNewCandle(newCandle)
    this.currentPrice = close

    // React에 가격 변경 알림
    eventBus.emit(EVENTS.PRICE_CHANGED, close, close - open)
  }

  private addNewCandle(candle: CandleData) {
    this.candles.push(candle)
    
    // 최대 캔들 개수 유지 (현재 표시 개수 + 10개 버퍼)
    const maxCandles = Math.max(40, this.visibleCandleCount + 10)
    if (this.candles.length > maxCandles) {
      this.candles.shift()
    }

    // 먼저 차트를 렌더링하여 마커 위치 업데이트
    this.renderChart()
    
    // 업데이트된 마커 위치에서 이펙트 발생
    this.showPriceChangeEffect(candle)

    eventBus.emit(EVENTS.CANDLE_GENERATED, candle)
  }

  private showPriceChangeEffect(candle: CandleData) {
    // Scene이 초기화되지 않았으면 효과를 건너뜀
    if (!this.add || !this.tweens) {
      return
    }
    
    try {
      const isUp = candle.close > candle.open
      // 현재 마커 위치 사용 (차트의 가장 오른쪽 끝 지점)
      const x = this.currentMarkerX
      const y = this.currentMarkerY

      // 캔들의 body 길이 계산 (변화 강도)
      const bodyLength = Math.abs(candle.close - candle.open)
      
      // 강도 결정 (1: 약함, 2: 중간, 3: 강함)
      let intensity: 1 | 2 | 3
      if (bodyLength < 1500) {
        intensity = 1
      } else if (bodyLength < 3000) {
        intensity = 2
      } else {
        intensity = 3
      }

      // 색상 결정
      // 녹색 캔들 (상승): 파란색 이펙트
      // 빨간색 캔들 (하락): 오렌지 이펙트
      const particleColor = isUp ? 0x0088ff : 0xff8800
      
      // 강도에 따른 파티클 수와 크기
      const particleCount = intensity === 1 ? 10 : intensity === 2 ? 20 : 30
      const particleSize = intensity === 1 ? 3 : intensity === 2 ? 4.5 : 6  // 원의 크기 (반지름)

      // 파티클 효과
      if (this.particles) {
        try {
          // 파티클 색상 및 스케일 조정
          const emitter = this.particles as any
          
          // 색상 설정
          if (emitter.setTint) {
            emitter.setTint(particleColor)
          } else if (emitter.particleTint) {
            emitter.particleTint = particleColor
          }
          
          // 파티클 발사
          if (emitter.explode) {
            emitter.explode(particleCount, x, y)
          } else if (emitter.emitParticleAt) {
            for (let i = 0; i < particleCount; i++) {
              emitter.emitParticleAt(x, y)
            }
          }
        } catch (e) {
          // 파티클 실패 시 무시
        }
      }

      // 강도에 따른 이펙트 원 그리기
      const effectCircle = this.add.graphics()
      if (effectCircle) {
        effectCircle.lineStyle(2, particleColor, 0.8)
        effectCircle.strokeCircle(x, y, particleSize)
        
        // 원 확장 애니메이션
        this.tweens.add({
          targets: effectCircle,
          alpha: 0,
          duration: 600,
          onUpdate: () => {
            effectCircle.clear()
            effectCircle.lineStyle(2, particleColor, effectCircle.alpha)
            effectCircle.strokeCircle(x, y, particleSize + (1 - effectCircle.alpha) * 10)
          },
          onComplete: () => effectCircle.destroy(),
        })
      }

      // 타격 이펙트: 방사형 임팩트 라인
      const impactLines = this.add.graphics()
      if (impactLines) {
        // 강도에 따른 라인 수와 길이 (더 크고 명확하게)
        const lineCount = intensity === 1 ? 8 : intensity === 2 ? 10 : 16
        const maxLineLength = intensity === 1 ? 35 : intensity === 2 ? 50 : 70
        const lineThickness = intensity === 1 ? 4 : intensity === 2 ? 6 : 8
        
        // 방사형 라인 애니메이션
        let progress = 0
        this.tweens.add({
          targets: { value: 0 },
          value: 1,
          duration: 500,
          ease: 'Power2',
          onUpdate: (tween) => {
            const tweenProgress = tween.getValue()
            progress = tweenProgress !== null ? tweenProgress : 0
            impactLines.clear()
            
            // 알파값을 천천히 감소 (더 오래 보이도록)
            const currentAlpha = Math.max(0, 1 - progress * 1.2)
            const currentLength = maxLineLength * Math.min(1, progress * 1.5)
            
            impactLines.lineStyle(lineThickness, particleColor, currentAlpha)
            
            // 각 라인을 방사형으로 그리기
            for (let i = 0; i < lineCount; i++) {
              const angle = (Math.PI * 2 * i) / lineCount
              const startX = x + Math.cos(angle) * particleSize
              const startY = y + Math.sin(angle) * particleSize
              const endX = x + Math.cos(angle) * (particleSize + currentLength)
              const endY = y + Math.sin(angle) * (particleSize + currentLength)
              
              impactLines.beginPath()
              impactLines.moveTo(startX, startY)
              impactLines.lineTo(endX, endY)
              impactLines.strokePath()
            }
          },
          onComplete: () => impactLines.destroy(),
        })
      }

      // 가격 변동 텍스트 애니메이션
      const change = candle.close - candle.open
      const changeText = this.add.text(x, y - 30, 
        `${change > 0 ? '+' : ''}$${change.toFixed(2)}`,
        {
          fontSize: intensity === 1 ? '16px' : intensity === 2 ? '20px' : '24px',
          color: isUp ? '#0088ff' : '#ff8800',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2,
        }
      )
      changeText.setOrigin(0.5, 1) // 텍스트 중앙 정렬

      this.tweens.add({
        targets: changeText,
        y: y - 80,
        alpha: 0,
        duration: 1000,
        onComplete: () => changeText.destroy(),
      })
    } catch (error) {
      // 효과 실패 시 무시
    }
  }

  private renderChart() {
    // Scene의 add 시스템만 체크 (가장 안전한 방법)
    if (!this.add) {
      console.warn('Scene not ready for rendering')
      return
    }
    
    try {
      // 기존 그래픽 삭제
      this.candleGraphics.forEach(g => {
        try {
          if (g && g.scene) {
            g.destroy()
          }
        } catch (e) {
          // 이미 파괴된 객체는 무시
        }
      })
      this.volumeGraphics.forEach(g => {
        try {
          if (g && g.scene) {
            g.destroy()
          }
        } catch (e) {
          // 이미 파괴된 객체는 무시
        }
      })
      this.candleGraphics = []
      this.volumeGraphics = []

      if (this.areaFillGraphics) {
        try {
          this.areaFillGraphics.destroy()
        } catch (e) {
          // 이미 파괴된 객체는 무시
        }
        this.areaFillGraphics = null
      }

      if (this.markerCircle) {
        try {
          this.markerCircle.destroy()
        } catch (e) {
          // 이미 파괴된 객체는 무시
        }
        this.markerCircle = null
      }
    } catch (error) {
      console.error('Error cleaning up graphics:', error)
      // 에러가 나도 계속 진행
      this.candleGraphics = []
      this.volumeGraphics = []
      this.areaFillGraphics = null
    }

    try {
      const visibleCandles = this.candles.slice(-this.visibleCandleCount)
      
      if (visibleCandles.length === 0) {
        console.warn('No visible candles to render')
        return
      }

      // 가격 범위 계산
      const prices = visibleCandles.flatMap(c => [c.high, c.low])
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const priceRange = maxPrice - minPrice || 1

      // 볼륨 범위 계산
      const maxVolume = Math.max(...visibleCandles.map(c => c.volume))

      // 차트 타입에 따라 렌더링
      switch (this.chartType) {
        case 'candle':
          this.renderCandlestickChart(visibleCandles, minPrice, priceRange, maxVolume)
          break
        case 'area':
          this.renderAreaChart(visibleCandles, minPrice, priceRange, maxVolume)
          break
        case 'line':
          this.renderLineChart(visibleCandles, minPrice, priceRange, maxVolume)
          break
      }

      // 현재 가격 라벨 업데이트
      if (this.priceLabel && visibleCandles.length > 0) {
        const lastCandle = visibleCandles[visibleCandles.length - 1]
        const change = lastCandle.close - lastCandle.open
        const changePercent = ((change / lastCandle.open) * 100).toFixed(2)
        this.priceLabel.setText(
          `$${lastCandle.close.toLocaleString()}\n${change >= 0 ? '+' : ''}${changePercent}%`
        )
        this.priceLabel.setColor(change >= 0 ? '#00ff00' : '#ff0000')
      }
    } catch (error) {
      console.error('Error rendering chart:', error)
      return
    }
  }

  private renderCandlestickChart(
    candles: CandleData[],
    minPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0) return
    
    // Scene의 add 시스템이 초기화되었는지 확인
    if (!this.add) {
      console.warn('Scene add system not initialized')
      return
    }
    
    try {
    
    // 전체 화면을 채우도록 동적으로 캔들 너비 계산
    const availableWidth = this.chartWidth - 20 // 좌우 패딩
    const dynamicCandleWidth = Math.max(1, Math.floor((availableWidth / candles.length) * 0.7))
    const dynamicCandleGap = Math.max(0, Math.floor((availableWidth / candles.length) * 0.3))
    const startX = 10 // 왼쪽 패딩
    
    // maxPrice 계산
    const prices = candles.flatMap(c => [c.high, c.low])
    const maxPrice = Math.max(...prices)

    candles.forEach((candle, index) => {
      try {
      const x = startX + index * (dynamicCandleWidth + dynamicCandleGap)
      const isUp = candle.close >= candle.open

      // 캔들 Y 좌표 계산
      const highY = ((maxPrice - candle.high) / priceRange) * this.chartHeight
      const lowY = ((maxPrice - candle.low) / priceRange) * this.chartHeight
      const openY = ((maxPrice - candle.open) / priceRange) * this.chartHeight
      const closeY = ((maxPrice - candle.close) / priceRange) * this.chartHeight

      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY) || 1

      // 캔들 그리기
      const graphics = this.add.graphics()
      if (!graphics) return
      
      graphics.lineStyle(1, isUp ? 0x00ff88 : 0xff4444)
      graphics.strokeLineShape(new Phaser.Geom.Line(
        x + dynamicCandleWidth / 2, highY,
        x + dynamicCandleWidth / 2, lowY
      ))

      graphics.fillStyle(isUp ? 0x00ff88 : 0xff4444)
      graphics.fillRect(x, bodyTop, dynamicCandleWidth, bodyHeight)

      this.candleGraphics.push(graphics)

      // 볼륨 바 그리기
      const volumeHeight = (candle.volume / maxVolume) * this.volumeHeight
      const volumeY = this.chartHeight + 20

      const volumeGraphics = this.add.graphics()
      if (!volumeGraphics) return
      
      volumeGraphics.fillStyle(isUp ? 0x00ff8844 : 0xff444444, 0.5)
      volumeGraphics.fillRect(
        x,
        volumeY + (this.volumeHeight - volumeHeight),
        dynamicCandleWidth,
        volumeHeight
      )

      this.volumeGraphics.push(volumeGraphics)
      } catch (error) {
        console.error('Error rendering candle:', error)
      }
    })

    // 마지막 캔들의 마커 위치만 저장 (원은 그리지 않음)
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1]
      const lastIndex = candles.length - 1
      const x = startX + lastIndex * (dynamicCandleWidth + dynamicCandleGap) + dynamicCandleWidth / 2
      const closeY = ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight
      
      // 마커 위치만 저장 (이펙트 발생 위치로 사용)
      this.currentMarkerX = x
      this.currentMarkerY = closeY
    }
    } catch (error) {
      console.error('Error in renderCandlestickChart:', error)
    }
  }

  private renderAreaChart(
    candles: CandleData[],
    minPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0) return
    
    // Scene의 add 시스템이 초기화되었는지 확인
    if (!this.add) {
      console.warn('Scene add system not initialized')
      return
    }
    
    try {
      const graphics = this.add.graphics()
      if (!graphics) {
        console.error('Failed to create graphics object')
        return
      }
      this.areaFillGraphics = graphics

      // 전체 화면을 채우도록 동적으로 포인트 간격 계산
      const availableWidth = this.chartWidth - 20
      const pointSpacing = candles.length > 1 ? availableWidth / (candles.length - 1) : availableWidth
      const startX = 10
      
      // maxPrice 계산
      const prices = candles.flatMap(c => [c.high, c.low])
      const maxPrice = Math.max(...prices)

      // 선 그리기
      graphics.lineStyle(3, 0x00ff88, 1)
      graphics.beginPath()

      const isUp = candles[candles.length - 1].close >= candles[0].open
      const lineColor = isUp ? 0x00ff88 : 0xff4444
      graphics.lineStyle(3, lineColor, 1)

      candles.forEach((candle, index) => {
        const x = startX + index * pointSpacing
        const y = ((maxPrice - candle.close) / priceRange) * this.chartHeight

        if (index === 0) {
          graphics.moveTo(x, y)
        } else {
          graphics.lineTo(x, y)
        }
      })
      graphics.strokePath()

      // 영역 채우기
      graphics.fillStyle(isUp ? 0x00ff8844 : 0xff444444, 0.3)
      graphics.beginPath()
      
      candles.forEach((candle, index) => {
        const x = startX + index * pointSpacing
        const y = ((maxPrice - candle.close) / priceRange) * this.chartHeight

        if (index === 0) {
          graphics.moveTo(x, this.chartHeight)
          graphics.lineTo(x, y)
        } else {
          graphics.lineTo(x, y)
        }
      })
      
      graphics.lineTo(startX + (candles.length - 1) * pointSpacing, this.chartHeight)
      graphics.closePath()
      graphics.fillPath()

      this.candleGraphics.push(graphics)

      // 마지막 포인트에 원형 마커 추가
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1]
        const lastIndex = candles.length - 1
        const x = startX + lastIndex * pointSpacing
        const y = ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight
        
        // 마커 위치 저장
        this.currentMarkerX = x
        this.currentMarkerY = y
        
        // 원형 마커 그리기 (선 두께 3px의 4배 = 12px 반지름)
        const markerGraphics = this.add.graphics()
        if (markerGraphics) {
          markerGraphics.fillStyle(lineColor, 1)
          markerGraphics.fillCircle(x, y, 6)
          this.markerCircle = markerGraphics
        }
      }

      // 볼륨 바 그리기
      this.renderVolumeBars(candles, maxVolume, startX, pointSpacing)
    } catch (error) {
      console.error('Error rendering area chart:', error)
    }
  }

  private renderLineChart(
    candles: CandleData[],
    minPrice: number,
    priceRange: number,
    maxVolume: number
  ) {
    if (candles.length === 0) return
    
    // Scene의 add 시스템이 초기화되었는지 확인
    if (!this.add) {
      console.warn('Scene add system not initialized')
      return
    }
    
    try {
      const graphics = this.add.graphics()
      if (!graphics) {
        console.error('Failed to create graphics object')
        return
      }
      this.areaFillGraphics = graphics

      // 전체 화면을 채우도록 동적으로 포인트 간격 계산
      const availableWidth = this.chartWidth - 20
      const pointSpacing = candles.length > 1 ? availableWidth / (candles.length - 1) : availableWidth
      const startX = 10
      
      // maxPrice 계산
      const prices = candles.flatMap(c => [c.high, c.low])
      const maxPrice = Math.max(...prices)

      const isUp = candles[candles.length - 1].close >= candles[0].open
      const lineColor = isUp ? 0x00ff88 : 0xff4444

      graphics.lineStyle(3, lineColor, 1)
      graphics.beginPath()

      candles.forEach((candle, index) => {
        const x = startX + index * pointSpacing
        const y = ((maxPrice - candle.close) / priceRange) * this.chartHeight

        if (index === 0) {
          graphics.moveTo(x, y)
        } else {
          graphics.lineTo(x, y)
        }
      })
      graphics.strokePath()

      this.candleGraphics.push(graphics)

      // 마지막 포인트에 원형 마커 추가
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1]
        const lastIndex = candles.length - 1
        const x = startX + lastIndex * pointSpacing
        const y = ((maxPrice - lastCandle.close) / priceRange) * this.chartHeight
        
        // 마커 위치 저장
        this.currentMarkerX = x
        this.currentMarkerY = y
        
        // 원형 마커 그리기 (선 두께 3px의 4배 = 12px 반지름)
        const markerGraphics = this.add.graphics()
        if (markerGraphics) {
          markerGraphics.fillStyle(lineColor, 1)
          markerGraphics.fillCircle(x, y, 6)
          this.markerCircle = markerGraphics
        }
      }

      // 볼륨 바 그리기
      this.renderVolumeBars(candles, maxVolume, startX, pointSpacing)
    } catch (error) {
      console.error('Error rendering line chart:', error)
    }
  }

  private renderVolumeBars(candles: CandleData[], maxVolume: number, startX: number, spacing?: number) {
    if (candles.length === 0) return
    
    // Scene의 add 시스템이 초기화되었는지 확인
    if (!this.add) {
      console.warn('Scene add system not initialized')
      return
    }
    
    try {
      const availableWidth = this.chartWidth - 20
      const barWidth = spacing ? Math.max(1, spacing * 0.7) : Math.max(1, Math.floor((availableWidth / candles.length) * 0.7))
      
      candles.forEach((candle, index) => {
        try {
          const x = spacing 
            ? startX + index * spacing - barWidth / 2
            : startX + index * (barWidth + Math.floor((availableWidth / candles.length) * 0.3))
            
          const volumeHeight = (candle.volume / maxVolume) * this.volumeHeight
          const volumeY = this.chartHeight + 20

          const volumeGraphics = this.add.graphics()
          if (!volumeGraphics) return
          
          const isUp = index > 0 ? candle.close >= candles[index - 1].close : true
          volumeGraphics.fillStyle(isUp ? 0x00ff8844 : 0xff444444, 0.5)
          volumeGraphics.fillRect(
            x,
            volumeY + (this.volumeHeight - volumeHeight),
            barWidth,
            volumeHeight
          )

          this.volumeGraphics.push(volumeGraphics)
        } catch (error) {
          console.error('Error rendering volume bar:', error)
        }
      })
    } catch (error) {
      console.error('Error in renderVolumeBars:', error)
    }
  }

  private changeChartType(type: 'candle' | 'area' | 'line') {
    console.log(`Changing chart type to: ${type}`)
    try {
      this.chartType = type
      this.renderChart()
    } catch (error) {
      console.error('Error changing chart type:', error)
    }
  }

  private changeSpeed(multiplier: number) {
    try {
      this.speedMultiplier = multiplier
      this.startCandleGeneration()
    } catch (error) {
      console.error('Error changing speed:', error)
    }
  }

  private changeCandleCount(count: number) {
    console.log(`BattleScene: changeCandleCount called with count: ${count}`)
    console.log(`Current candles length: ${this.candles.length}`)
    
    try {
      this.visibleCandleCount = count
    
    // 현재 캔들이 부족하면 추가 생성
    while (this.candles.length < count) {
      const lastCandle = this.candles[this.candles.length - 1] || {
        open: 125000,
        close: 125000,
        high: 127000,
        low: 123000,
        volume: 25000,
        id: 'initial'
      }
      
      const volatility = (Math.random() - 0.5) * 4000
      const open = lastCandle.close
      const close = open + volatility
      const high = Math.max(open, close) + Math.random() * 2000
      const low = Math.min(open, close) - Math.random() * 2000

      this.candles.push({
        id: `candle-${Date.now()}-${Math.random()}`,
        open,
        close,
        high,
        low,
        volume: Math.random() * 50000,
      })
    }
    
      console.log(`After generation, candles length: ${this.candles.length}`)
      console.log(`Visible candle count set to: ${this.visibleCandleCount}`)
      
      this.renderChart()
      console.log('renderChart completed successfully')
    } catch (error) {
      console.error('Error in changeCandleCount:', error)
    }
  }

  private onAttackEnemy(enemyId: string) {
    // Scene이 초기화되지 않았으면 효과를 건너뜀
    if (!this.add || !this.tweens) {
      return
    }
    
    try {
      // 공격 효과 애니메이션
      const x = Phaser.Math.Between(100, this.chartWidth - 100)
      const y = Phaser.Math.Between(50, this.chartHeight / 2)

      if (this.particles) {
        try {
          const emitter = this.particles as any
          if (emitter.explode) {
            emitter.explode(20, x, y)
          } else if (emitter.emitParticleAt) {
            for (let i = 0; i < 20; i++) {
              emitter.emitParticleAt(x, y)
            }
          }
        } catch (e) {
          // 파티클 실패 시 무시
        }
      }

      // 임팩트 이펙트
      const impact = this.add.circle(x, y, 5, 0xffff00)
      this.tweens.add({
        targets: impact,
        radius: 30,
        alpha: 0,
        duration: 300,
        onComplete: () => impact.destroy(),
      })
    } catch (error) {
      // 효과 실패 시 무시
    }
  }

  update() {
    // 매 프레임 업데이트 로직 (필요시)
  }

  shutdown() {
    // Scene 종료 시 이벤트 리스너 제거
    eventBus.off(EVENTS.NEW_CANDLE, this.addNewCandle.bind(this))
    eventBus.off(EVENTS.CHANGE_CHART_TYPE, this.changeChartType.bind(this))
    eventBus.off(EVENTS.CHANGE_SPEED, this.changeSpeed.bind(this))
    eventBus.off(EVENTS.CHANGE_CANDLE_COUNT, this.changeCandleCount.bind(this))
    eventBus.off(EVENTS.ATTACK_ENEMY, this.onAttackEnemy.bind(this))

    if (this.animationTimer) {
      this.animationTimer.destroy()
    }
  }
}
