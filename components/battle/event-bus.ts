/**
 * EventBus - React와 Phaser 간 통신을 위한 이벤트 시스템
 */

type EventCallback = (...args: any[]) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  removeAllListeners() {
    this.events.clear()
  }
}

export const eventBus = new EventBus()

// 이벤트 타입 정의
export const EVENTS = {
  // React -> Phaser
  NEW_CANDLE: 'new-candle',
  CHANGE_CHART_TYPE: 'change-chart-type',
  CHANGE_SPEED: 'change-speed',
  CHANGE_CANDLE_COUNT: 'change-candle-count',
  ATTACK_ENEMY: 'attack-enemy',
  USE_SKILL: 'use-skill',
  UPDATE_MARKET_DATA: 'update-market-data',
  CLEAR_CHART: 'clear-chart',
  
  // Phaser -> React
  CANDLE_GENERATED: 'candle-generated',
  PRICE_CHANGED: 'price-changed',
  PARTICLE_EFFECT: 'particle-effect',
  SCENE_READY: 'scene-ready',
} as const
