'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StockCard } from '@/lib/types/stock'
import { SECTOR_COLORS, RARITY_COLORS, RARITY_GLOW } from '@/lib/types/stock'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CardPriceInfo {
  cardId: string
  price: number
  quantity: number
  totalCost: number
}

interface SelectionOverlayProps {
  cards: StockCard[]
  layout: 'initial' | 'quarterly' // 3x3 grid or 1x3 horizontal
  onSelect: (card: StockCard) => void
  onClose?: () => void
  onComplete?: () => void // For initial draft completion
  title?: string
  showCompleteButton?: boolean
  availableCapital: number // Current available capital
  cardPrices: Map<string, CardPriceInfo> // Price info for each card
  selectedCards: Set<string> // Currently selected card IDs
}

export function SelectionOverlay({
  cards,
  layout,
  onSelect,
  onClose,
  onComplete,
  title = 'Select a Stock',
  showCompleteButton = false,
  availableCapital,
  cardPrices,
  selectedCards,
}: SelectionOverlayProps) {
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set())

  const handleCardClick = (card: StockCard) => {
    const priceInfo = cardPrices.get(card.id)
    if (!priceInfo) return
    
    const isRevealed = revealedCards.has(card.id)
    
    // If not revealed, reveal and select at the same time
    if (!isRevealed) {
      setRevealedCards(prev => new Set([...prev, card.id]))
      // Immediately select the card
      onSelect(card)
    } else {
      // If already revealed, just toggle selection
      onSelect(card)
    }
  }

  const handleReveal = (cardId: string) => {
    // This function is no longer used for card clicks, but kept for compatibility
    setRevealedCards(prev => new Set([...prev, cardId]))
  }

  // Calculate total cost of selected cards
  const totalSelectedCost = useMemo(() => {
    const cost = Array.from(selectedCards).reduce((sum, cardId) => {
      const info = cardPrices.get(cardId)
      return sum + (info?.totalCost || 0)
    }, 0)
    return cost
  }, [selectedCards, cardPrices])

  const remainingCapital = useMemo(() => {
    return availableCapital - totalSelectedCost
  }, [availableCapital, totalSelectedCost])

  const isGrid = layout === 'initial'
  const gridCols = isGrid ? 'grid-cols-3' : 'grid-cols-3'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background"
      style={{ height: 'calc(100vh - 4rem)', bottom: '4rem' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full h-full bg-card flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-primary/20 flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Capital Display */}
        <div className="p-3 md:p-4 bg-primary/10 border-b border-primary/20 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
            <div className="flex-1">
              <div className="text-muted-foreground">Available Capital</div>
              <div className="text-lg md:text-xl font-bold">${availableCapital.toLocaleString()}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-muted-foreground">Selected Cost</div>
              <div className={`text-lg md:text-xl font-bold ${totalSelectedCost > availableCapital ? 'text-red-500' : ''}`}>
                ${totalSelectedCost.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-muted-foreground">Remaining</div>
              <div className={`text-lg md:text-xl font-bold ${remainingCapital < 0 ? 'text-red-500' : 'text-green-500'}`}>
                ${remainingCapital.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid - Scrollable */}
        <div className={`grid ${gridCols} grid-rows-3 gap-2 md:gap-3 flex-1 overflow-y-auto min-h-0 p-2 md:p-3`}>
          <AnimatePresence>
            {cards.map((card, index) => {
              const isRevealed = revealedCards.has(card.id)
              const isSelected = selectedCards.has(card.id)
              const priceInfo = cardPrices.get(card.id)
              const sectorColor = SECTOR_COLORS[card.sector]
              const rarityColor = RARITY_COLORS[card.rarity]
              const glow = RARITY_GLOW[card.rarity]
              // Can afford if: not selected and has enough remaining capital, or already selected
              const canAfford = priceInfo ? (isSelected || priceInfo.totalCost <= remainingCapital) : false

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, rotateY: 180 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    rotateY: isRevealed ? 0 : 180,
                    scale: isSelected ? 1.05 : (isRevealed ? 1 : 0.9),
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.3,
                    type: 'tween',
                    ease: 'easeOut',
                  }}
                  style={{
                    perspective: '1000px',
                  }}
                  className="relative"
                >
                  <motion.button
                    onClick={() => {
                      handleCardClick(card)
                    }}
                    disabled={isRevealed && !canAfford && !isSelected}
                    className={`
                      w-full h-full min-h-[140px] rounded-lg border-2 p-2 md:p-3
                      flex flex-col items-center justify-center
                      transition-all duration-300
                      ${isSelected ? 'cursor-pointer' : isRevealed && !canAfford ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      ${isRevealed ? '' : 'bg-slate-800'}
                    `}
                    style={{
                      borderColor: isRevealed ? (isSelected ? rarityColor : sectorColor) : '#475569',
                      backgroundColor: isRevealed ? `${sectorColor}15` : '#1e293b',
                      boxShadow: isRevealed && isSelected ? glow : 'none',
                    }}
                    whileHover={isSelected ? {} : (canAfford && isRevealed ? { scale: 1.05 } : {})}
                    whileTap={isSelected ? {} : (canAfford && isRevealed ? { scale: 0.95 } : {})}
                  >
                    {!isRevealed ? (
                      // Card Back
                      <motion.div
                        animate={{ rotateY: 180 }}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2 p-1"
                      >
                        <div className="text-2xl md:text-3xl mb-1">?</div>
                        {priceInfo && (
                          <>
                            <div
                              className="px-1.5 py-0.5 rounded text-[10px] md:text-xs font-semibold"
                              style={{
                                backgroundColor: sectorColor,
                                color: '#fff',
                              }}
                            >
                              {card.sector}
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] md:text-xs text-muted-foreground">Price</div>
                              <div className="text-xs md:text-sm font-bold">${priceInfo.price.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] md:text-xs text-muted-foreground">Qty × Cost</div>
                              <div className="text-xs md:text-sm font-bold">
                                {priceInfo.quantity} × ${priceInfo.totalCost.toLocaleString()}
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ) : (
                      // Card Front
                      <motion.div
                        initial={{ rotateY: -180 }}
                        animate={{ rotateY: 0 }}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2"
                      >
                        {/* Rarity Badge */}
                        <div
                          className="px-1.5 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase"
                          style={{
                            backgroundColor: rarityColor,
                            color: '#000',
                          }}
                        >
                          {card.rarity}
                        </div>

                        {/* Symbol */}
                        <div className="text-lg md:text-xl font-bold">{card.symbol}</div>

                        {/* Stock Name */}
                        <div className="text-[10px] md:text-xs text-center text-muted-foreground line-clamp-1">
                          {card.stockName}
                        </div>

                        {/* Sector */}
                        <div
                          className="px-1.5 py-0.5 rounded text-[10px] md:text-xs font-semibold"
                          style={{
                            backgroundColor: sectorColor,
                            color: '#fff',
                          }}
                        >
                          {card.sector}
                        </div>

                        {/* Price Info */}
                        {priceInfo && (
                          <div className="mt-1 text-center">
                            <div className="text-[10px] md:text-xs text-muted-foreground">Cost</div>
                            <div className="text-xs md:text-sm font-bold">${priceInfo.totalCost.toLocaleString()}</div>
                          </div>
                        )}

                        {/* Selection Indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 border-2 md:border-4 rounded-lg"
                            style={{
                              borderColor: rarityColor,
                              boxShadow: `0 0 20px ${rarityColor}`,
                            }}
                          />
                        )}
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Fly Animation Target (invisible, positioned at inventory slot) */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0 }}
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                      style={{ y: 200 }} // Approximate inventory position
                    />
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Instructions and Button Container - Fixed at bottom */}
        <div className="p-4 md:p-6 border-t border-primary/20 flex-shrink-0 space-y-2 bg-card">
          <div className="text-center text-xs md:text-sm text-muted-foreground">
            {revealedCards.size === 0
              ? 'Click a card to reveal it'
              : selectedCards.size === 0
              ? 'Click a revealed card to select it'
              : `${selectedCards.size} card${selectedCards.size > 1 ? 's' : ''} selected`}
          </div>

          {/* Complete Button (for initial draft) */}
          {showCompleteButton && onComplete && (
            <div className="flex justify-center">
              <Button 
                onClick={onComplete} 
                size="lg"
                disabled={!selectedCards || selectedCards.size === 0}
                className="w-full md:w-auto"
              >
                Start Game {selectedCards && selectedCards.size > 0 && `(${selectedCards.size} selected)`}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
