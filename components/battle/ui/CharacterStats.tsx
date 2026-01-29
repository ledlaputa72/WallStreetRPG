'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Character } from '../types'

interface CharacterStatsProps {
  characters: Character[]
}

export function CharacterStats({ characters }: CharacterStatsProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="bg-card/10 border-b border-primary/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Active Party
        </h3>
        <motion.button
          onClick={() => setExpanded(!expanded)}
          className="text-xs px-2 py-1 rounded bg-primary/10 border border-primary/30 hover:border-primary/50 transition-all"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </motion.button>
      </div>
      <motion.div
        layout
        className={cn(
          'grid gap-3',
          expanded ? 'grid-cols-2' : 'grid-cols-4'
        )}
      >
        {characters.map((char) => (
          <motion.div
            key={char.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={cn(
              'p-3 bg-card/50 border border-border hover:border-primary/50 transition-all duration-300',
              char.actionReady && 'ring-2 ring-primary/30 shadow-lg shadow-primary/10',
              !expanded && 'p-2'
            )}>
              <div className={cn(
                'flex flex-col items-center gap-2',
                !expanded && 'gap-1'
              )}>
                <div className={cn(
                  'w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center',
                  char.actionReady && 'animate-pulse',
                  !expanded && 'w-10 h-10'
                )}>
                  <Shield className={cn(
                    'w-7 h-7 text-primary',
                    !expanded && 'w-5 h-5'
                  )} />
                </div>
                {expanded && (
                  <>
                    <div className="text-center w-full">
                      <div className="font-semibold text-xs mb-1">{char.name}</div>
                      <Badge variant="secondary" className="text-[10px] mb-2">Lv.{char.level}</Badge>
                    </div>
                    <div className="w-full space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground w-5">HP</span>
                        <Progress value={(char.hp / char.maxHp) * 100} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{Math.round((char.hp / char.maxHp) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground w-5">MP</span>
                        <Progress value={(char.mp / char.maxMp) * 100} className="h-1.5 flex-1 bg-blue-950" />
                        <span className="text-[10px] text-muted-foreground">{Math.round((char.mp / char.maxMp) * 100)}%</span>
                      </div>
                    </div>
                    {char.actionReady && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-primary font-medium">
                        <Sparkles className="w-3 h-3" />
                        <span>Action Ready</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
