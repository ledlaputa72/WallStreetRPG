# 포트폴리오 계산 로직 검토 보고서

## 문제점 발견

게임 시작 직후 투자 종목과 금액이 비정상적으로 빠르게 증가하는 문제가 발견되었습니다. 계산 로직을 검토한 결과 여러 불일치와 중복 계산이 확인되었습니다.

---

## 현재 계산 수식 분석

### 1. 초기 자본 설정 (handleDraftComplete)

**위치**: `components/pages/battle-page.tsx:273-275`

```typescript
const initialAUM = aum || 0
useGameStore.setState({ realizedProfit: initialAUM - totalCost })
```

**수식**:
```
realizedProfit = AUM - totalCost
```

**설명**: 
- 초기 AUM에서 구매한 주식의 총 비용을 뺀 나머지가 현금(realizedProfit)으로 설정됩니다.
- ✅ 이 부분은 올바릅니다.

---

### 2. 일일 자본 유입 (incrementDay)

**위치**: `lib/stores/useGameStore.ts:208-224`

```typescript
incrementDay: () => {
  const newRealized = get().realizedProfit + get().dailyCapitalInflow
  set({
    currentDayIndex: current + 1,
    realizedProfit: newRealized,
  })
  get().calculatePortfolioValue()
}
```

**수식**:
```
dailyCapitalInflow = AUM × 0.001 × (1 + ceoCapitalBonus)
realizedProfit = realizedProfit + dailyCapitalInflow  // 매일 누적
```

**설명**:
- 매일 AUM의 0.1%가 현금으로 추가됩니다.
- 예: AUM $10,000 → 매일 $10 추가
- ✅ 이 부분도 올바릅니다.

---

### 3. 포트폴리오 가치 계산 (calculatePortfolioValue)

**위치**: `lib/stores/useGameStore.ts:234-253`

```typescript
calculatePortfolioValue: (): number => {
  const positions = get().portfolioAssets
  const unrealized = positions.reduce(
    (sum, p) => {
      const currentPrice = p.currentPrice ?? 0
      const quantity = p.quantity ?? 0
      return sum + currentPrice * quantity
    },
    0
  )
  const realizedProfit = get().realizedProfit ?? 0
  const total = realizedProfit + unrealized
  
  set({
    unrealizedProfit: unrealized,
    totalAssets: total,
  })
  
  return total
}
```

**수식**:
```
unrealizedProfit = Σ(currentPrice × quantity)  // 보유 주식의 현재 시가 총액
totalAssets = realizedProfit + unrealizedProfit
```

**설명**:
- ✅ 이 계산은 올바릅니다.
- `unrealizedProfit`: 보유 주식의 현재 시가 총액
- `realizedProfit`: 현금 잔액 (매일 dailyCapitalInflow가 추가됨)
- `totalAssets`: 현금 + 보유 주식 시가

---

### 4. 포트폴리오 수익률 계산 (calculatePortfolioReturn)

**위치**: `lib/stores/useGameStore.ts:255-260`

```typescript
calculatePortfolioReturn: (): number => {
  const aum = get().aum
  if (!aum || aum === 0) return 0
  const totalAssets = get().totalAssets ?? 0
  return ((totalAssets - aum) / aum) * 100
}
```

**수식**:
```
Return % = ((totalAssets - AUM) / AUM) × 100
```

**설명**:
- ✅ 이 계산도 올바릅니다.

---

## 🚨 문제점: battle-page.tsx의 포트폴리오 차트 계산

**위치**: `components/pages/battle-page.tsx:404-462`

### 현재 로직 (잘못된 계산):

```typescript
// Show portfolio total value
const aumValue = useGameStore.getState().aum || 0
const realizedProfit = useGameStore.getState().realizedProfit

// Calculate portfolio value at current day
let portfolioValue = aumValue  // ❌ 문제: AUM으로 시작
let previousValue = aumValue

// Calculate previous day value for open price
if (currentDay > 0) {
  portfolio.forEach(position => {
    if (position.data.length > currentDay) {
      previousValue += (position.data[currentDay].close - position.buyPrice) * position.quantity
    }
  })
}

// Calculate current day value
portfolio.forEach(position => {
  if (position.data.length > currentDay + 1) {
    portfolioValue += (position.data[currentDay + 1].close - position.buyPrice) * position.quantity
  } else if (position.data.length > currentDay) {
    portfolioValue += (position.data[currentDay].close - position.buyPrice) * position.quantity
  }
})

// Add realized profit (cash from sales)
portfolioValue += realizedProfit  // ❌ 문제: AUM + 손익 + 현금 = 중복 계산
```

### 문제점 분석:

1. **AUM으로 시작하는 문제**:
   - `portfolioValue = aumValue`로 시작하면, 초기 구매 비용이 이미 포함된 상태입니다.
   - 실제로는 `AUM - 구매비용 = 초기 현금`이어야 하는데, AUM 전체를 더하고 있습니다.

2. **손익만 더하는 문제**:
   - `(currentPrice - buyPrice) × quantity`는 손익만 계산합니다.
   - 하지만 실제 포트폴리오 가치는 `현금 + 보유 주식 시가`이므로, `currentPrice × quantity`를 더해야 합니다.

3. **중복 계산**:
   - `portfolioValue = AUM + 손익 + realizedProfit`
   - 하지만 `realizedProfit`에는 이미 `AUM - 구매비용 + dailyCapitalInflow`가 포함되어 있습니다.
   - 따라서 `AUM + (AUM - 구매비용 + dailyCapitalInflow) = 2×AUM - 구매비용 + dailyCapitalInflow`가 되어 비정상적으로 높아집니다.

### 올바른 계산 방식:

```typescript
// 올바른 포트폴리오 가치 계산
let portfolioValue = realizedProfit  // 현금 잔액으로 시작

// 보유 주식의 현재 시가를 더함
portfolio.forEach(position => {
  if (position.data.length > currentDay + 1) {
    const currentPrice = position.data[currentDay + 1].close
    portfolioValue += currentPrice * position.quantity  // 손익이 아닌 시가를 더함
  } else if (position.data.length > currentDay) {
    const currentPrice = position.data[currentDay].close
    portfolioValue += currentPrice * position.quantity
  }
})
```

**수식**:
```
portfolioValue = realizedProfit + Σ(currentPrice × quantity)
```

이것은 `useGameStore`의 `calculatePortfolioValue`와 동일한 로직입니다.

---

## 수정 방안

### 1. battle-page.tsx의 포트폴리오 차트 계산 수정

현재 잘못된 계산을 `useGameStore`의 `totalAssets`를 직접 사용하도록 변경해야 합니다:

```typescript
// 수정 전 (잘못된 계산)
let portfolioValue = aumValue
portfolio.forEach(position => {
  portfolioValue += (position.data[currentDay + 1].close - position.buyPrice) * position.quantity
})
portfolioValue += realizedProfit

// 수정 후 (올바른 계산)
const totalAssets = useGameStore.getState().totalAssets
let portfolioValue = totalAssets  // 또는 calculatePortfolioValue() 호출
```

또는 더 정확하게는:

```typescript
// 현금 잔액으로 시작
let portfolioValue = realizedProfit

// 보유 주식의 현재 시가를 더함
portfolio.forEach(position => {
  if (position.data.length > currentDay + 1) {
    portfolioValue += position.data[currentDay + 1].close * position.quantity
  } else if (position.data.length > currentDay) {
    portfolioValue += position.data[currentDay].close * position.quantity
  }
})
```

---

## 각 항목별 계산 수식 정리

### 1. Initial AUM (초기 투자금)
```
AUM = 사용자가 선택한 초기 투자금 ($1,000 ~ $1,000,000)
```

### 2. Total Assets (보유 총 자산)
```
Total Assets = Realized Profit + Unrealized Profit

where:
  Realized Profit = 현금 잔액
    = (AUM - 초기 구매 비용) + Σ(dailyCapitalInflow × 경과일수)
  
  Unrealized Profit = 보유 주식의 현재 시가 총액
    = Σ(currentPrice × quantity)
```

### 3. P&L ($) (평가 손익)
```
P&L ($) = Total Assets - AUM
```

### 4. P&L (%) (평가 손익률)
```
P&L (%) = ((Total Assets - AUM) / AUM) × 100
```

### 5. Cash Balance (예치금/현금)
```
Cash Balance = Realized Profit
  = (AUM - 초기 구매 비용) + Σ(dailyCapitalInflow × 경과일수)
```

### 6. Daily Funding (일 추가 자금)
```
Daily Funding = AUM × 0.001 × (1 + ceoCapitalBonus)
  = AUM × 0.001  (기본값, ceoCapitalBonus = 0일 때)
```

---

## 요약

### ✅ 올바른 계산:
- `useGameStore.calculatePortfolioValue()`: `totalAssets = realizedProfit + unrealizedProfit`
- `useGameStore.calculatePortfolioReturn()`: `((totalAssets - aum) / aum) × 100`
- 초기 자본 설정: `realizedProfit = AUM - totalCost`
- 일일 자본 유입: `realizedProfit += dailyCapitalInflow`

### ❌ 잘못된 계산:
- `battle-page.tsx`의 포트폴리오 차트 계산: `AUM + 손익 + realizedProfit` (중복 계산)
- 차트용 포트폴리오 가치는 `useGameStore.totalAssets`를 직접 사용하거나, 동일한 로직으로 재계산해야 합니다.

### 수정 필요:
`components/pages/battle-page.tsx`의 `tick()` 함수 내 포트폴리오 가치 계산 로직을 수정해야 합니다.
