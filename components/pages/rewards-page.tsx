'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Gift, Target, Trophy, Mail, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

const dailyQuests = [
  { id: '1', title: 'Complete 5 Battles', description: 'Win 5 battles in any mode', progress: 3, max: 5, reward: '100 Gold', completed: false },
  { id: '2', title: 'Level Up a Character', description: 'Increase any character level', progress: 1, max: 1, reward: '50 Gems', completed: true },
  { id: '3', title: 'Enter a Dungeon', description: 'Complete any dungeon', progress: 0, max: 1, reward: 'Rare Item Box', completed: false },
  { id: '4', title: 'Upgrade Equipment', description: 'Enhance any equipment 3 times', progress: 2, max: 3, reward: '200 Gold', completed: false },
]

const achievements = [
  { id: '1', title: 'First Victory', description: 'Win your first battle', progress: 1, max: 1, reward: '500 Gold', completed: true },
  { id: '2', title: 'Collector', description: 'Obtain 50 different items', progress: 32, max: 50, reward: 'Epic Equipment Box', completed: false },
  { id: '3', title: 'Hero Master', description: 'Reach Level 50 with any hero', progress: 45, max: 50, reward: 'Legendary Weapon', completed: false },
  { id: '4', title: 'Dungeon Explorer', description: 'Complete 100 dungeons', progress: 67, max: 100, reward: '1000 Gems', completed: false },
  { id: '5', title: 'Full Party', description: 'Unlock all partners', progress: 5, max: 8, reward: 'Mythic Hero Ticket', completed: false },
]

const mailbox = [
  { id: '1', title: 'Daily Login Reward', description: 'Thank you for playing!', reward: '100 Gems', claimed: false, date: '2h ago' },
  { id: '2', title: 'Event Participation', description: 'You participated in the weekend event', reward: 'Rare Equipment', claimed: false, date: '1d ago' },
  { id: '3', title: 'Welcome Gift', description: 'Welcome to Idle RPG!', reward: 'Starter Pack', claimed: true, date: '3d ago' },
]

export function RewardsPage() {
  const [quests, setQuests] = useState(dailyQuests)
  const [mails, setMails] = useState(mailbox)

  const handleClaim = (type: 'quest' | 'achievement' | 'mail', id: string) => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })

    if (type === 'mail') {
      setMails(mails.map(mail => 
        mail.id === id ? { ...mail, claimed: true } : mail
      ))
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="container max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-8 h-8 text-primary" />
            Rewards
          </h2>
          <p className="text-sm text-muted-foreground">
            Complete quests and claim your rewards
          </p>
        </div>

        {/* Rewards Tabs */}
        <Tabs defaultValue="quests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quests">
              <Target className="w-4 h-4 mr-2" />
              Daily Quests
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="mailbox">
              <Mail className="w-4 h-4 mr-2" />
              Mailbox
              <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                {mails.filter(m => !m.claimed).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Daily Quests Tab */}
          <TabsContent value="quests" className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
              <span className="text-sm font-medium">Quests Reset In:</span>
              <Badge variant="secondary" className="text-sm">
                <Clock className="w-3 h-3 mr-1" />
                18h 24m
              </Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-3 pr-4">
                {quests.map((quest, idx) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      'p-4',
                      quest.completed && 'bg-primary/5 border-primary/30'
                    )}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{quest.title}</h4>
                              {quest.completed && (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{quest.description}</p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0">
                            <Gift className="w-3 h-3" />
                            {quest.reward}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{quest.progress}/{quest.max}</span>
                          </div>
                          <Progress value={(quest.progress / quest.max) * 100} className="h-2" />
                        </div>

                        {/* Claim Button */}
                        <Button 
                          size="sm" 
                          className="w-full"
                          disabled={!quest.completed}
                          variant={quest.completed ? 'default' : 'secondary'}
                          onClick={() => quest.completed && handleClaim('quest', quest.id)}
                        >
                          {quest.completed ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          ) : (
                            'In Progress'
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-3 pr-4">
                {achievements.map((achievement, idx) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      'p-4',
                      achievement.completed && 'bg-secondary/5 border-secondary/30'
                    )}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className={cn(
                                'w-5 h-5',
                                achievement.completed ? 'text-secondary' : 'text-muted-foreground'
                              )} />
                              <h4 className="font-semibold">{achievement.title}</h4>
                              {achievement.completed && (
                                <CheckCircle2 className="w-4 h-4 text-secondary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                          <Badge 
                            variant={achievement.completed ? 'default' : 'outline'}
                            className={cn(
                              'flex items-center gap-1 flex-shrink-0',
                              achievement.completed && 'bg-secondary'
                            )}
                          >
                            <Gift className="w-3 h-3" />
                            {achievement.reward}
                          </Badge>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.max}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.max) * 100} 
                            className={cn(
                              'h-2',
                              achievement.completed && 'bg-secondary/20'
                            )}
                          />
                        </div>

                        {/* Claim Button */}
                        <Button 
                          size="sm" 
                          className="w-full"
                          disabled={!achievement.completed}
                          variant={achievement.completed ? 'default' : 'secondary'}
                          onClick={() => achievement.completed && handleClaim('achievement', achievement.id)}
                        >
                          {achievement.completed ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          ) : (
                            `${Math.round((achievement.progress / achievement.max) * 100)}% Complete`
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Mailbox Tab */}
          <TabsContent value="mailbox" className="space-y-4">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-3 pr-4">
                {mails.map((mail, idx) => (
                  <motion.div
                    key={mail.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      'p-4',
                      mail.claimed ? 'opacity-60' : 'bg-primary/5 border-primary/30'
                    )}>
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className={cn(
                                'w-4 h-4',
                                mail.claimed ? 'text-muted-foreground' : 'text-primary'
                              )} />
                              <h4 className="font-semibold">{mail.title}</h4>
                              {mail.claimed && (
                                <Badge variant="outline" className="text-xs">Claimed</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{mail.description}</p>
                            <span className="text-xs text-muted-foreground">{mail.date}</span>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                            <Gift className="w-3 h-3" />
                            {mail.reward}
                          </Badge>
                        </div>

                        {/* Claim Button */}
                        <Button 
                          size="sm" 
                          className="w-full"
                          disabled={mail.claimed}
                          variant={mail.claimed ? 'secondary' : 'default'}
                          onClick={() => !mail.claimed && handleClaim('mail', mail.id)}
                        >
                          {mail.claimed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Claimed
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Claim Reward
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
