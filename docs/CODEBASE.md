# Wall Street RPG — 코드베이스 정리

전체 폴더/파일, 라이브러리, 주요 함수·변수 정리 및 유지보수 가이드입니다.

---

## 1. 프로젝트 구조

```
WallStreetRPG/
├── app/                    # Next.js App Router
│   ├── api/market/         # 시장 데이터 API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── battle/             # 배틀(차트) 시스템
│   │   ├── constants.ts
│   │   ├── event-bus.ts
│   │   ├── hooks/usePhaserGame.ts
│   │   ├── index.tsx
│   │   ├── phaser-game.tsx
│   │   ├── types.ts
│   │   ├── scenes/battle-scene.ts
│   │   └── ui/             # StageInfo, ChartControls, QuickInventory, QuickSkills, CharacterStats
│   ├── bottom-navigation.tsx
│   ├── pages/              # 화면별 페이지 컴포넌트
│   ├── theme-provider.tsx
│   └── ui/                 # shadcn/ui 공통 컴포넌트
├── hooks/                  # 전역 훅 (use-mobile, use-toast)
├── lib/                    # 공통 유틸·타입
│   ├── types.ts
│   └── utils.ts
├── public/                 # 정적 리소스
├── styles/                 # (globals.css 중복 가능성)
├── package.json
├── tsconfig.json
└── docs/
    └── CODEBASE.md         # 본 문서
```

---

## 2. 폴더·파일 역할 요약

### 2.1 `app/`

| 파일 | 역할 |
|------|------|
| `layout.tsx` | 루트 레이아웃, 메타데이터, Analytics, `globals.css` 로드 |
| `page.tsx` | 홈: `PageType` 상태, `BottomNavigation` + `AnimatePresence`로 페이지 전환, `renderPage()`로 Battle/Character/Partners/Items/Dungeon/Shop/Rewards 렌더 |
| `globals.css` | Tailwind, tw-animate, CSS 변수(테마), dark 모드 |
| `api/market/route.ts` | GET 시장 데이터: `symbol`, `type`(historical\|intraday\|quote)에 따라 역사적/데모/Alpha Vantage 연동 |

### 2.2 `components/battle/` (배틀·차트)

| 파일 | 역할 |
|------|------|
| `types.ts` | Character, Enemy, Boss, InventoryItem, Skill, ChartType, CandleCount, SpeedMultiplier, GameState |
| `constants.ts` | mockHero, mockPartners, mockEnemies, mockBoss, mockInventory, mockSkills |
| `event-bus.ts` | 싱글톤 EventBus, EVENTS 상수 (NEW_CANDLE, PRICE_CHANGED, SCENE_READY, CLEAR_CHART 등) |
| `index.tsx` | PhaserGame dynamic export, event-bus re-export |
| `phaser-game.tsx` | Phaser Game 래퍼, ref로 game/scene/fetchMarketData 노출, autoFetch/fetchInterval, EVENTS.UPDATE_MARKET_DATA/SCENE_READY |
| `hooks/usePhaserGame.ts` | phaserRef, phaserReady, currentPrice, priceChange, profitPercent, chartType/candleCount/speedMultiplier, EventBus 구독(PRICE_CHANGED, SCENE_READY), 핸들러(차트 타입/캔들 수/속도) |
| `scenes/battle-scene.ts` | Phaser Scene: 캔들/거래량/그리드/가격선 렌더, 줌·팬, NEW_CANDLE 수신 시 addNewCandle → PRICE_CHANGED 방출, target/resistance 라인 |
| `ui/StageInfo.tsx` | stage, wave, symbol, stockName, year, currentDate, targetPrice, resistancePrice, currentPrice, profitPercent |
| `ui/ChartControls.tsx` | Start/Stop, Chart type, Candle count, Speed 버튼 |
| `ui/QuickInventory.tsx` | items 그리드, rarity 스타일, Collapse/Expand |
| `ui/QuickSkills.tsx` | skills 그리드, Collapse/Expand |
| `ui/CharacterStats.tsx` | characters(HP/MP, Action Ready), Collapse/Expand |

### 2.3 `components/pages/`

| 파일 | 역할 |
|------|------|
| `battle-page.tsx` | 배틀 메인: gameState, stageData, usePhaserGame, fetchNewSimulation/stopSimulation, NEW_CANDLE 타이머, StageInfo/PhaserGame/ChartControls/QuickInventory/QuickSkills/CharacterStats |
| `battle-page.backup.tsx` | **폐기 예정** — 이전 단일 파일 백업, 참고용으로만 유지 |
| `character-page.tsx` | 캐릭터 상세 (스탯, 장비, 스킬) |
| `partners-page.tsx` | 파트너 목록·파티 편성 |
| `items-page.tsx` | 아이템 목록·필터 |
| `dungeon-page.tsx` | 던전 목록 |
| `shop-page.tsx` | 상점 (소환, 장비, 일일 상점) |
| `rewards-page.tsx` | 보상·퀘스트 |

### 2.4 `components/` 기타

| 파일 | 역할 |
|------|------|
| `bottom-navigation.tsx` | 하단 탭: PageType, navItems(character/partners/items/battle/dungeon/shop/rewards), onNavigate |
| `theme-provider.tsx` | (next-themes 등 테마 래퍼, 사용처 확인 필요) |

### 2.5 `lib/`

| 파일 | 역할 |
|------|------|
| `types.ts` | PageType, Character(공통), Enemy, Item, Partner, Dungeon, Quest — 앱 전역 타입 |
| `utils.ts` | `cn(...)` (clsx + tailwind-merge) |

### 2.6 `hooks/`

| 파일 | 역할 |
|------|------|
| `use-mobile.ts` | useIsMobile / useMobile, 768px 브레이크포인트 |
| `use-toast.ts` | toaster UI용 훅 (sonner 연동) |

### 2.7 `app/api/market/`

| 파일 | 역할 |
|------|------|
| `route.ts` | HISTORICAL_STOCKS, MARKET_EVENTS, generateHistoricalData, fetchIntradayData, fetchGlobalQuote, type별 분기 응답 |

---

## 3. 라이브러리·의존성 요약

- **Next.js 16** — App Router, API Routes  
- **React 19** — UI  
- **Phaser 3** — 차트/배틀 씬 렌더링  
- **framer-motion** — 페이지 전환, UI 애니메이션  
- **Tailwind CSS 4** — 스타일  
- **Radix UI** — 다이얼로그, 탭, 셀렉트 등 (components/ui)  
- **lucide-react** — 아이콘  
- **clsx, tailwind-merge** — cn()  
- **recharts** — (차트 UI용, 사용처 확인)  
- **zod, react-hook-form, @hookform/resolvers** — 폼 검증  
- **sonner** — 토스트  
- **@vercel/analytics** — 분석  

---

## 4. 주요 함수·변수 (진입점·상태·이벤트)

### 4.1 앱 진입점

- `app/page.tsx`: `currentPage`(PageType), `renderPage()`, `BottomNavigation(..., setCurrentPage)`
- `app/layout.tsx`: `metadata`, 루트 HTML/body

### 4.2 배틀 페이지

- **상태**: `gameState`(IDLE|LOADING|PLAYING), `stageData`(symbol, stockName, year, fullYearData, currentIndex), `animationIntervalRef`, `speedMultiplierRef`
- **데이터**: `displaySymbol`, `displayStockName`, `displayYear`, `displayDate`(useMemo)
- **함수**: `fetchNewSimulation()` — GET /api/market?type=historical → setStageData, EVENTS.CLEAR_CHART; `stopSimulation()`; `handleStartStop()`
- **이벤트**: `EVENTS.NEW_CANDLE` — fullYearData[currentIndex]를 1일씩 전달, currentIndex 증가

### 4.3 usePhaserGame

- **상태**: phaserReady, currentPrice, priceChange, chartType, candleCount, speedMultiplier
- **구독**: PRICE_CHANGED → setCurrentPrice, setPriceChange; SCENE_READY → setPhaserReady
- **계산**: profitPercent = (priceChange / currentPrice) * 100
- **핸들러**: handleChartTypeChange, handleCandleCountChange, handleSpeedChange → EventBus emit

### 4.4 EventBus (event-bus.ts)

- **React → Phaser**: NEW_CANDLE, CHANGE_CHART_TYPE, CHANGE_SPEED, CHANGE_CANDLE_COUNT, UPDATE_MARKET_DATA, CLEAR_CHART
- **Phaser → React**: PRICE_CHANGED, SCENE_READY, CANDLE_GENERATED, PARTICLE_EFFECT

### 4.5 BattleScene (Phaser)

- **주요 필드**: candles, historicalQueue, currentPrice, chartType, speedMultiplier, visibleCandleCount, targetPrice, resistancePrice
- **주요 메서드**: addNewCandle(), renderChart(), updateMarketData(), clearChart(), animateChartShift(), showPriceChangeEffect()

### 4.6 API (market route)

- **타입**: historical → generateHistoricalData(); intraday/quote → Alpha Vantage 또는 데모
- **응답**: success, symbol, stockName, year, data(MarketCandle[])

---

## 5. 타입·데이터 정리

### 5.1 타입 중복·역할

- **lib/types.ts**: 앱 공통 — PageType, Character(공통), Item, Partner, Dungeon, Quest  
- **components/battle/types.ts**: 배틀 전용 — Character(배틀용 단순 버전), Enemy, Boss, InventoryItem, Skill, ChartType, CandleCount, SpeedMultiplier, GameState  

**권장**: 배틀 Character는 “배틀용 캐릭터 스냅샷”으로 두고, 장기적으로는 lib/types의 Character를 확장해 배틀에서 필요한 필드만 사용하거나, BattleCharacter를 lib에서 정의하고 battle/types에서 re-export 하는 방식 고려.

### 5.2 battle-page 로컬 타입

- `MarketCandle`: app/api/market의 MarketCandle와 동일 — `lib/types.ts` 또는 `components/battle/types.ts`로 이동 후 import 권장.
- `StageData`: symbol, stockName, year, fullYearData, currentIndex — 배틀 전용이면 battle/types에 두고 battle-page에서 import.

---

## 6. UI 리소스·관리

- **공통 UI**: `components/ui/` — shadcn 기반 (button, card, dialog, tabs, select 등). 새 공통 컴포넌트는 여기 추가.
- **배틀 전용 UI**: `components/battle/ui/` — StageInfo, ChartControls, QuickInventory, QuickSkills, CharacterStats. 배틀 전용 레이아웃/스타일만 여기 유지.
- **아이콘**: `lucide-react` 일원화.
- **테마**: `app/globals.css`의 :root / .dark CSS 변수. 다크 모드는 layout에서 `className="dark"`로 고정 가능.

### 6.1 중복 제거

- `hooks/use-mobile.ts`만 사용. `components/ui/use-mobile.tsx`는 동일 로직이므로 제거하고, 필요 시 `@/hooks/use-mobile`만 참조.

---

## 7. 유지보수·개발 시 주의사항

1. **배틀 데이터 흐름**: Start → fetchNewSimulation → setStageData → setInterval에서 EVENTS.NEW_CANDLE로 1일씩 전달 → BattleScene addNewCandle → PRICE_CHANGED → usePhaserGame currentPrice/priceChange 갱신. 이 경로 외에 가격을 갱신하지 않도록 유지.
2. **Phaser/SSR**: Phaser는 브라우저 전용. `dynamic(..., { ssr: false })` 및 battle/index.tsx에서의 export 방식 유지.
3. **EventBus 구독 해제**: usePhaserGame의 useEffect cleanup에서 PRICE_CHANGED, SCENE_READY off 필수.
4. **백업 파일**: `battle-page.backup.tsx`는 참고용. 새 기능은 battle-page.tsx에만 반영하고, 필요 시 백업은 docs/archive 등으로 이동 고려.

---

## 8. 리팩토링 체크리스트 (적용 권장)

- [ ] `MarketCandle`, `StageData`를 `lib/types` 또는 `battle/types`로 이동 후 battle-page에서 import
- [ ] `components/ui/use-mobile.tsx` 삭제 (이미 `@/hooks/use-mobile`만 사용 중)
- [ ] usePhaserGame에서 `currentPrice === 0`일 때 profitPercent 계산 방지 (0 또는 '0.00' 반환)
- [ ] battle-page.backup.tsx 상단에 Deprecated 주석 추가 또는 docs/archive로 이동
- [ ] (선택) lib/types Character와 battle/types Character 통합 또는 re-export 정리

이 문서는 프로젝트 루트의 `docs/CODEBASE.md`에서 관리하며, 구조 변경 시 함께 갱신하는 것을 권장합니다.
