'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Phaser는 브라우저 전용이므로 SSR 비활성화
export const PhaserGame = dynamic(
  () => import('./phaser-game').then((mod) => mod.PhaserGame),
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

export * from './event-bus'
// BattleScene은 phaser-game.tsx 내부에서만 사용되므로 직접 export 제거 (SSR 이슈 방지)
