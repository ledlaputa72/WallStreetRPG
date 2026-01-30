'use client'

import { Shield, TrendingUp, Target, AlertTriangle, Calendar } from 'lucide-react'

interface StageInfoProps {
  stage: string
  currentWave: number
  maxWave: number
  profitPercent: string
  currentPrice: number
  targetPrice?: number
  resistancePrice?: number
  symbol?: string
  stockName?: string
  year?: number
  currentDate?: string // Current candle date
}

export function StageInfo({ 
  stage, 
  currentWave, 
  maxWave, 
  profitPercent, 
  currentPrice,
  targetPrice,
  resistancePrice,
  symbol = 'AAPL',
  stockName,
  year,
  currentDate,
}: StageInfoProps) {
  const isProfit = parseFloat(profitPercent) >= 0

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-foreground">
            {symbol}
            {stockName && <span className="text-sm md:text-base font-normal text-muted-foreground ml-2">({stockName})</span>}
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {year ? (
              <>
                <Calendar className="h-4 w-4" />
                <span>
                  {year}
                  {currentDate && <span className="ml-1 font-semibold text-foreground">{currentDate}</span>}
                </span>
              </>
            ) : (
              'Real-time Market Data'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {targetPrice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20">
            <Target className="h-4 w-4 text-green-500 shrink-0" />
            <div className="text-right">
              <div className="text-xs text-green-500/70 uppercase tracking-wide">Target</div>
              <div className="text-sm font-bold text-green-500">
                ${targetPrice.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {resistancePrice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            <div className="text-right">
              <div className="text-xs text-red-500/70 uppercase tracking-wide">Resistance</div>
              <div className="text-sm font-bold text-red-500">
                ${resistancePrice.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm md:text-base font-medium">Stage {stage}</span>
          <span className="text-sm text-muted-foreground">Wave {currentWave}/{maxWave}</span>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className={`h-5 w-5 shrink-0 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
          <div className="text-right">
            <div className="text-base font-bold text-foreground">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-medium ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{profitPercent}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
