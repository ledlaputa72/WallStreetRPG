'use client'

import { User, Users, Package, Swords, Castle, ShoppingBag, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageType } from '@/lib/types'

interface BottomNavigationProps {
  currentPage: PageType
  onNavigate: (page: PageType) => void
}

const navItems = [
  { id: 'character' as PageType, icon: User, label: 'Character' },
  { id: 'partners' as PageType, icon: Users, label: 'Partners' },
  { id: 'items' as PageType, icon: Package, label: 'Items' },
  { id: 'battle' as PageType, icon: Swords, label: 'Battle' },
  { id: 'dungeon' as PageType, icon: Castle, label: 'Dungeon' },
  { id: 'shop' as PageType, icon: ShoppingBag, label: 'Shop' },
  { id: 'rewards' as PageType, icon: Gift, label: 'Rewards' },
]

export function BottomNavigation({ currentPage, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
                'hover:bg-accent/50 active:scale-95',
                isActive && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon 
                className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
              <span className={cn(
                'text-[10px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
