'use client'

import { useState } from 'react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import { BottomNavigation } from '@/components/bottom-navigation'
import { BattlePage } from '@/components/pages/battle-page'
import { CharacterPage } from '@/components/pages/character-page'
import { PartnersPage } from '@/components/pages/partners-page'
import { ItemsPage } from '@/components/pages/items-page'
import { DungeonPage } from '@/components/pages/dungeon-page'
import { ShopPage } from '@/components/pages/shop-page'
import { RewardsPage } from '@/components/pages/rewards-page'
import type { PageType } from '@/lib/types'

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageType>('battle')

  const renderPage = () => {
    switch (currentPage) {
      case 'character':
        return <CharacterPage key="character" />
      case 'partners':
        return <PartnersPage key="partners" />
      case 'items':
        return <ItemsPage key="items" />
      case 'battle':
        return <BattlePage key="battle" />
      case 'dungeon':
        return <DungeonPage key="dungeon" />
      case 'shop':
        return <ShopPage key="shop" />
      case 'rewards':
        return <RewardsPage key="rewards" />
      default:
        return <BattlePage key="battle" />
    }
  }

  return (
    <div className="min-h-screen pb-16 bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
          className="h-[calc(100vh-4rem)]"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      
      <BottomNavigation currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  )
}
