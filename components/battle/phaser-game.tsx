'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import * as Phaser from 'phaser'
import BattleScene from './scenes/battle-scene'

export interface PhaserGameRef {
  game: Phaser.Game | null
  scene: BattleScene | null
}

interface PhaserGameProps {
  currentActiveScene?: (scene: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<PhaserGameRef, PhaserGameProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const gameRef = useRef<Phaser.Game | null>(null)
    const parentRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      game: gameRef.current,
      scene: gameRef.current?.scene.getScene('BattleScene') as BattleScene || null,
    }))

    useEffect(() => {
      if (typeof window === 'undefined' || !parentRef.current) return

      // 이미 게임이 생성되었으면 리턴
      if (gameRef.current) return

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: parentRef.current,
        transparent: true, // 배경 투명
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
      }

      gameRef.current = new Phaser.Game(config)

      // Scene이 준비되면 콜백 호출
      if (currentActiveScene) {
        gameRef.current.events.on('ready', () => {
          const scene = gameRef.current?.scene.getScene('BattleScene')
          if (scene) {
            currentActiveScene(scene)
          }
        })
      }

      // 리사이즈 핸들러
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
        window.removeEventListener('resize', handleResize)
        if (gameRef.current) {
          gameRef.current.destroy(true)
          gameRef.current = null
        }
      }
    }, [currentActiveScene])

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
