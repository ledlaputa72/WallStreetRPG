'use client'

import { Shield, TrendingUp, Target, AlertTriangle } from 'lucide-react'

interface StageInfoProps {
  stage: string
  currentWave: number
  maxWave: number
  profitPercent: string
  currentPrice: number
  targetPrice?: number
  resistancePrice?: number
  symbol?: string
}

export function StageInfo({ 
  stage, 
  currentWave, 
  maxWave, 
  profitPercent, 
  currentPrice,
  targetPrice,
  resistancePrice,
  symbol = 'AAPL'
}: StageInfoProps) {
  const isProfit = parseFloat(profitPercent) >= 0

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">{symbol}</h2>
          <p className="text-xs text-muted-foreground">Real-time Market Data</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Target Price */}
        {targetPrice && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
            <Target className="h-3.5 w-3.5 text-green-500" />
            <div className="text-right">
              <div className="text-[10px] text-green-500/70 uppercase tracking-wide">Target</div>
              <div className="text-xs font-bold text-green-500">
                ${targetPrice.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Resistance Price */}
        {resistancePrice && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <div className="text-right">
              <div className="text-[10px] text-red-500/70 uppercase tracking-wide">Resistance</div>
              <div className="text-xs font-bold text-red-500">
                ${resistancePrice.toFixed(2)}
              </div>
            </div>
          </div>
        )}

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
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
