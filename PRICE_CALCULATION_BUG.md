# 주식 가격 계산 버그 분석

## 문제 상황
- 초기 투자: $6,000 (3개 주식 구매)
- 게임 시작 직후:
  - SLB: $7,172.92 (현재 가치)
  - KO: $14,321.54 (현재 가치)
  - BAC: $1,797.56 (현재 가치)
  - 총합: $23,292.02 (예상: $6,000)

## 문제 원인 분석

### 1. 포지션 생성 시 currentPrice 설정

**위치**: `components/pages/battle-page.tsx:255-268`

```typescript
const position = {
  id: `${card.symbol}-${Date.now()}-${Math.random()}`,
  symbol: card.symbol,
  stockName: card.stockName,
  sector: card.sector,
  rarity: card.rarity,
  buyPrice: priceInfo.price,        // ✅ 구매 가격 (첫 날 종가)
  quantity: priceInfo.quantity,
  currentPrice: priceInfo.price,    // ⚠️ 현재 가격도 첫 날 종가로 설정
  buyDayIndex: 0,
  data: stockResult.data,            // 전체 연도 데이터 (252일)
  currentDayIndex: 0,
}
```

**문제점**:
- `currentPrice: priceInfo.price`로 설정되는데, 이것은 `stockResult.data[0].close`와 동일해야 합니다.
- 하지만 `startSimulation`에서 `updatePositionPrice(position.id, position.data[0].close, 0)`를 호출하여 업데이트합니다.
- 만약 `priceInfo.price`와 `data[0].close`가 다르다면 문제가 발생할 수 있습니다.

### 2. startSimulation에서 가격 업데이트

**위치**: `components/pages/battle-page.tsx:190-195`

```typescript
// Initialize positions
const currentPortfolio = useGameStore.getState().portfolioAssets
currentPortfolio.forEach(position => {
  if (position.data.length > 0) {
    updatePositionPrice(position.id, position.data[0].close, 0)
  }
})
```

**문제점**:
- `startSimulation`이 호출될 때 이미 포지션이 추가되어 있고, `calculatePortfolioValue()`가 호출되었을 수 있습니다.
- 그런데 `updatePositionPrice`가 호출되기 전에 `calculatePortfolioValue()`가 호출되면, 잘못된 `currentPrice`로 계산됩니다.

### 3. 실제 버그의 원인

**가능한 원인들**:

#### 원인 1: priceInfo.price와 data[0].close가 다름
- `handleStartGame`에서 `priceInfo.price = stockResult.data[0].close`로 설정
- 하지만 `handleDraftComplete`에서 다시 `fetchHistoricalStockData`를 호출
- 두 번의 API 호출 사이에 데이터가 다를 수 있음 (하지만 같은 데이터여야 함)

#### 원인 2: currentPrice가 업데이트되기 전에 calculatePortfolioValue 호출
- `addToPortfolio` → `calculatePortfolioValue()` 호출 (currentPrice = priceInfo.price)
- `startSimulation` → `updatePositionPrice` 호출 (currentPrice = data[0].close)
- 만약 `priceInfo.price`와 `data[0].close`가 다르다면, 초기 계산이 잘못됨

#### 원인 3: data[0]이 실제 첫 거래일이 아님
- `data[0]`이 실제 첫 거래일의 가격이 아니라 다른 날의 가격일 수 있음
- 또는 인플레이션 조정 등으로 가격이 변경되었을 수 있음

## 해결 방안

### 해결책 1: 포지션 생성 시 data[0].close 사용

```typescript
// Create portfolio position
const position = {
  id: `${card.symbol}-${Date.now()}-${Math.random()}`,
  symbol: card.symbol,
  stockName: card.stockName,
  sector: card.sector,
  rarity: card.rarity,
  buyPrice: stockResult.data[0].close,  // ✅ 실제 첫 거래일 종가 사용
  quantity: priceInfo.quantity,
  currentPrice: stockResult.data[0].close,  // ✅ 실제 첫 거래일 종가 사용
  buyDayIndex: 0,
  data: stockResult.data,
  currentDayIndex: 0,
}
```

### 해결책 2: priceInfo.price와 data[0].close 일치 확인

```typescript
// Fetch stock data
const stockResult = await fetchHistoricalStockData(card.symbol, selectedYear)
if (!stockResult.success || stockResult.data.length === 0) {
  console.error('Failed to fetch stock data for', card.symbol)
  continue
}

// Ensure priceInfo.price matches actual first day close price
const actualFirstDayPrice = stockResult.data[0].close
if (Math.abs(priceInfo.price - actualFirstDayPrice) > 0.01) {
  console.warn(`Price mismatch for ${card.symbol}: priceInfo=${priceInfo.price}, data[0]=${actualFirstDayPrice}`)
  // Use actual price from data
  priceInfo.price = actualFirstDayPrice
  priceInfo.totalCost = actualFirstDayPrice * priceInfo.quantity
}
```

### 해결책 3: startSimulation 전에 가격 업데이트

```typescript
// Update realized profit FIRST
const initialAUM = aum || 0
useGameStore.setState({ realizedProfit: initialAUM - totalCost })

// Add all positions to portfolio
newPositions.forEach(position => {
  // Ensure currentPrice is set to actual first day price
  position.currentPrice = position.data[0]?.close ?? position.buyPrice
  addToPortfolio(position)
})

// Ensure totalAssets is recalculated with final values
useGameStore.getState().calculatePortfolioValue()
```

## 권장 해결책

**해결책 1 + 해결책 3**을 결합:
1. 포지션 생성 시 `data[0].close`를 직접 사용
2. `addToPortfolio` 전에 `currentPrice`를 확실히 설정
3. `startSimulation`에서 `updatePositionPrice` 호출은 중복이지만 안전을 위해 유지
