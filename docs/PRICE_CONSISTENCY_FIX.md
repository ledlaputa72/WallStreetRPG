# 카드 선택가 vs 게임 시작 후 금액 불일치 수정

## 증상
- 게임 시작 시 2개 종목에 각각 약 $1,900씩 투자해 시작
- 시작 직후 한 종목은 약 $2,600, 다른 종목은 약 $3,700으로 표시됨
- 카드에서 본 “시작가/투자금”과 실제 포트폴리오의 Initial/Current/Total이 맞지 않음

## 원인

1. **API가 `symbol`·`year`를 사용하지 않음**  
   `/api/market?type=historical`은 쿼리 파라미터를 무시하고 **호출할 때마다 랜덤 종목·연도**로 데이터를 생성해 반환했습니다.

2. **카드 가격과 포지션 데이터가 서로 다른 데이터셋**  
   - **카드 가격**: `handleStartGame`에서 `fetchHistoricalStockData(card.symbol, year)` → 랜덤 A (예: GM 1985) 반환 → 카드에는 A의 1일차 종가 표시  
   - **포지션 생성**: `handleDraftComplete`에서 같은 카드에 대해 다시 fetch → 랜덤 B (예: KO 1975) 반환 → `buyPrice`/`currentPrice`와 `position.data`는 B 기준  
   - 그 결과, “시작가”는 A의 가격, “현재가/총 평가”는 B 시계열로 계산되어 금액이 어긋남.

3. **인플레이션**  
   `dataFetcher`에서 `applyInflationToCandles(result.data, year)`로 연도별 CPI 반영은 하고 있었으나, 위처럼 **서로 다른 연도/종목 데이터**가 섞이면서 일관성이 깨짐.

## 수정 사항

### 1. API: `symbol`·`year` 지원 및 동일 데이터 보장 (`app/api/market/route.ts`)

- `type=historical`일 때 쿼리에서 `symbol`, `year`를 읽어 사용.
- **같은 (symbol, year) 요청 → 항상 같은 시계열**이 나오도록:
  - `generateHistoricalDataForSymbolYear(symbol, year)` 추가
  - `symbol`+`year`로 시드를 만든 **seeded PRNG**로 캔들 생성 (같은 seed → 같은 수열)
- 게임 카드용 종목(PEP, PG, BRK, JPM 등)을 `HISTORICAL_STOCKS`에 추가해, 요청한 symbol에 맞는 basePrice/name 사용.
- `symbol`이 목록에 없으면 `getBasePriceAndName(symbol)`에서 symbol 문자열 해시로 **결정론적** basePrice 생성.

### 2. 데이터 흐름 (수정 후)

- `handleStartGame`: `selectedYear` 고정 → 각 카드에 대해 `fetchHistoricalStockData(card.symbol, selectedYear)`  
  → API는 **요청한 symbol·year**로 동일 데이터 반환 → 카드 표시가는 이 데이터의 1일차 종가(인플레이션 적용값).
- `handleDraftComplete`: 같은 `card.symbol`, `selectedYear`로 다시 fetch  
  → **동일한 시계열** 수신 → `actualFirstDayPrice` = 카드에 보여준 가격과 동일.
- 포지션의 `buyPrice`·`currentPrice`와 `position.data`가 **같은 연도·같은 종목** 기준이 되므로, 시작가와 시작 직후 금액이 일치.

### 3. 인플레이션

- `lib/utils/inflationEngine.ts`: `applyInflation(price, year)` → `P_now = P_t × (CPI_2024 / CPI_year)`.
- `dataFetcher`: API에서 받은 해당 연도 raw 데이터에 대해 `applyInflationToCandles(result.data, result.year || year)` 적용.
- 이제 카드·포지션 모두 **동일 (symbol, year)** 데이터에 같은 연도 CPI를 적용하므로, 인플레이션 반영도 일관됨.

### 4. dataFetcher fallback (추가 수정)

- **문제**: API 키가 없거나 첫 요청이 실패할 때 fallback이 `/api/market?type=historical`만 호출해 **symbol·year 없이** 요청 → API가 랜덤 종목/연도 데이터를 반환 → 카드와 포지션이 서로 다른 데이터 사용.
- **수정** (`lib/utils/dataFetcher.ts`): fallback에서도 `symbol`, `year`를 쿼리에 포함해 호출.  
  `fetch(\`/api/market?type=historical&symbol=${symbol}&year=${year}\`)`  
  → 동일 (symbol, year)에 대해 항상 같은 시계열을 받아 카드/포지션 금액 일치.

### 5. 카드별 투자 비율 결정론화 (추가 수정)

- **문제**: `handleStartGame`에서 카드별 수량을 `Math.random()`으로 계산해, 같은 카드라도 호출마다 다른 totalCost가 나올 수 있음.
- **수정** (`components/pages/battle-page.tsx`): `card.id` 기준 시드 해시로 15–30% 구간을 결정론적으로 계산.  
  동일 카드는 항상 같은 투자 비율·수량·totalCost로 표시되고, `handleDraftComplete`에서 사용하는 `cardPrices`와 일치.

### 6. 주가 동기화 및 수익률 0% 시작 (Critical)

- **증상**: 게임 시작 직후 수익률이 +6000% 또는 -80% 등으로 튀는 현상 (카드 매입가 ≠ 시뮬레이션 시작가).
- **원칙**: "카드 가격 = 포트폴리오 매입가 = 시뮬레이션 해당일 종가"를 **항상 position.data에서만** 사용.
- **수정**  
  - **초기 드래프트 (Day 0)**  
    - 카드: `data[0].close` (이미 `handleStartGame`에서 사용).  
    - 포지션: `handleDraftComplete`에서 **매입가/현재가는 오직 `stockResult.data[0].close`만 사용**.  
    - 현금 차감: `actualFirstDayPrice * quantity`로 해서 (현금 + 주식 평가액) = AUM, 수익률 0%에서 시작.  
  - **분기 드래프트 (Quarterly)**  
    - 카드: `data[currentDayIndex].close` (이미 quarterly 카드 가격 설정에서 사용).  
    - 포지션: `data[currentDayIndex].close`를 매입가/현재가로 사용, 현금 차감도 `actualPrice * quantity`로 통일.  
  - **스토어** (`useGameStore.addToPortfolio`):  
    - 추가 시 **항상 `position.data[buyDayIndex].close`를 조회해 `buyPrice`/`currentPrice`로 강제 설정**.  
    - 호출부에서 잘못된 가격이 넘어와도 시뮬레이션과 동일한 가격으로 정규화.  
- **인플레이션**: `dataFetcher`가 API 응답에 `applyInflationToCandles(result.data, year)` 적용 후 반환하므로, 카드·포지션·시뮬레이션 모두 **동일한 보정된 가격** 사용.  
- **대시보드**: `totalAssets = realizedProfit + Σ(currentPrice × quantity)`, `P&L ($) = totalAssets - AUM`, `P&L (%) = (totalAssets - AUM) / AUM × 100`.  
  시작 시점에 위 로직으로 현금·주가를 맞추면 수익률이 0.00%에서 시작함.

## 검증 포인트

- 동일 연도에서 카드 선택 시 표시된 “투자금”과 포트폴리오의 Initial Price × Qty, Total Value가 시작 시점에 맞는지.
- 시뮬레이션 진행 시 같은 종목의 Current Price가 `position.data[currentDayIndex].close`(인플레이션 적용값)와 일치하는지.
