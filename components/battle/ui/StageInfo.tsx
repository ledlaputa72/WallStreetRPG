'use client'

import { Shield, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface StageInfoProps {
  stage: string
  currentWave: number
  maxWave: number
  profitPercent: string
  currentPrice: number
}

export function StageInfo({ stage, currentWave, maxWave, profitPercent, currentPrice }: StageInfoProps) {
  const isProfit = parseFloat(profitPercent) >= 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">WALL STREET INDEX (WSI)</h2>
          <p className="text-xs text-muted-foreground">Real-time Market Data</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Stage Info */}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Stage {stage}</span>
          <span className="text-xs text-muted-foreground">Wave {currentWave}/{maxWave}</span>
        </div>

        {/* Price Info */}
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-4 w-4 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">
              ${currentPrice.toLocaleString()}
            </div>
            <div className={`text-xs font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{profitPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
