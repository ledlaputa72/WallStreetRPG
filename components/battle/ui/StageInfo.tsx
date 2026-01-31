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

  const dateLabel = [year ?? '', currentDate ?? ''].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
      {/* 1행: 종목 티커 · 회사명 · 연도 · 날짜(연도-달-일) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap min-w-0">
        <h2 className="text-sm sm:text-base font-bold text-foreground truncate shrink-0">
          {symbol}
        </h2>
        {stockName && (
          <span className="text-xs sm:text-sm text-muted-foreground truncate min-w-0">· {stockName}</span>
        )}
        {year != null && (
          <span className="text-xs sm:text-sm text-muted-foreground shrink-0">· {year}</span>
        )}
        {(year != null || currentDate) && (
          <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-0.5 shrink-0">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="whitespace-nowrap">{dateLabel}</span>
          </p>
        )}
      </div>

      {/* 2행: Target ~ 금액까지 동일 간격, 왼쪽·오른쪽 꽉 차게 */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 w-full flex-nowrap min-w-0 overflow-hidden">
        {targetPrice != null && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 flex-1 min-w-0 justify-center">
            <Target className="h-3 w-3 text-green-500 shrink-0" />
            <div className="text-center leading-tight min-w-0">
              <div className="text-[9px] text-green-500/70 uppercase">Target</div>
              <div className="text-[10px] sm:text-xs font-bold text-green-500 truncate">${targetPrice.toFixed(2)}</div>
            </div>
          </div>
        )}
        {resistancePrice != null && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 flex-1 min-w-0 justify-center">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
            <div className="text-center leading-tight min-w-0">
              <div className="text-[9px] text-red-500/70 uppercase">Resist.</div>
              <div className="text-[10px] sm:text-xs font-bold text-red-500 truncate">${resistancePrice.toFixed(2)}</div>
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5 flex-1 min-w-0 justify-center text-[10px] sm:text-xs">
          <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-medium whitespace-nowrap">S{stage}</span>
          <span className="text-muted-foreground whitespace-nowrap">W{currentWave}/{maxWave}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-1 min-w-0 justify-end text-right">
          <TrendingUp className={`h-3.5 w-3.5 shrink-0 ${isProfit ? 'text-green-500' : 'text-red-500'}`} />
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate">${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={`text-[10px] sm:text-xs font-medium leading-tight ${isProfit ? 'text-green-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{profitPercent}%</div>
          </div>
        </div>
      </div>
    </div>
  )
}
