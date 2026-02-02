# 초기 포트폴리오 가치 계산 버그 분석

## 문제 상황
- 초기 투자금: $10,000 (AUM)
- 주식 구매 비용: $6,000
- 예상 초기 총 자산: $10,000 (현금 $4,000 + 주식 $6,000)
- 실제 표시되는 총 자산: $13,000 (버그!)

## 문제 원인 분석

### 1. setAUM에서 totalAssets 초기화 문제

**위치**: `lib/stores/useGameStore.ts:111-125`

```typescript
setAUM: (aum) => {
  // ...
  set({
    aum,
    dailyCapitalInflow: dailyInflow,
    targetProfit,
    totalAssets: aum,  // ❌ 문제: totalAssets를 AUM으로 초기화
  })
}
```

**문제점**:
- `setAUM`이 호출될 때 `totalAssets`를 `aum`으로 설정합니다.
- 하지만 이 시점에는 아직 포트폴리오가 없으므로 `totalAssets = aum`이 맞습니다.
- 그러나 이후 포지션을 추가할 때 문제가 발생합니다.

### 2. handleDraftComplete의 실행 순서 문제

**위치**: `components/pages/battle-page.tsx:274-279`

```typescript
// Add all positions to portfolio
newPositions.forEach(position => addToPortfolio(position))

// Update realized profit (remaining capital after purchases)
const initialAUM = aum || 0
useGameStore.setState({ realizedProfit: initialAUM - totalCost })
```

**실행 순서**:
1. `addToPortfolio(position)` 호출 → 각 포지션마다 `calculatePortfolioValue()` 호출
2. 첫 번째 포지션 추가 시:
   - `realizedProfit = 0` (아직 설정 안됨)
   - `unrealizedProfit = buyPrice × quantity` (첫 번째 주식 가치)
   - `totalAssets = 0 + 첫번째주식가치`
3. 두 번째 포지션 추가 시:
   - `realizedProfit = 0` (아직 설정 안됨)
   - `unrealizedProfit = 첫번째주식가치 + 두번째주식가치`
   - `totalAssets = 0 + (첫번째주식가치 + 두번째주식가치)`
4. 모든 포지션 추가 완료:
   - `realizedProfit = 0` (아직 설정 안됨)
   - `unrealizedProfit = totalCost = $6,000`
   - `totalAssets = 0 + 6,000 = $6,000`
5. `useGameStore.setState({ realizedProfit: initialAUM - totalCost })` 실행
   - `realizedProfit = $10,000 - $6,000 = $4,000`
   - **하지만 `calculatePortfolioValue()`가 다시 호출되지 않음!**
   - 따라서 `totalAssets`는 여전히 $6,000으로 남아있음

### 3. 실제 버그의 원인

하지만 사용자가 $13,000을 본다는 것은 다른 문제가 있을 수 있습니다.

**가능한 원인들**:

#### 원인 1: setAUM의 totalAssets 초기화가 남아있음
- `setAUM`에서 `totalAssets: aum`으로 설정
- 이후 `addToPortfolio`에서 `calculatePortfolioValue()`가 호출되어 업데이트됨
- 하지만 `realizedProfit`가 설정된 후 `calculatePortfolioValue()`가 다시 호출되지 않아서:
  - `totalAssets = $6,000` (unrealized만 반영)
  - 실제로는 `$4,000 + $6,000 = $10,000`이어야 함

#### 원인 2: startSimulation에서 초기화 문제
- `startSimulation`이 호출될 때 초기 포트폴리오 가치가 잘못 설정될 수 있음

#### 원인 3: calculatePortfolioValue가 realizedProfit 업데이트 전에 호출됨
- `addToPortfolio` → `calculatePortfolioValue()` 호출
- 이때 `realizedProfit`가 아직 업데이트되지 않았음
- `realizedProfit = 0` 또는 이전 값 사용
- 이후 `realizedProfit`를 업데이트하지만 `calculatePortfolioValue()`가 다시 호출되지 않음

## 해결 방안

### 해결책 1: realizedProfit 설정 후 calculatePortfolioValue 재호출

```typescript
// Update realized profit (remaining capital after purchases)
const initialAUM = aum || 0
useGameStore.setState({ realizedProfit: initialAUM - totalCost })
// ✅ calculatePortfolioValue를 다시 호출하여 totalAssets 업데이트
useGameStore.getState().calculatePortfolioValue()
```

### 해결책 2: addToPortfolio 전에 realizedProfit 설정

```typescript
// 먼저 realizedProfit 설정
const initialAUM = aum || 0
useGameStore.setState({ realizedProfit: initialAUM - totalCost })

// 그 다음 포지션 추가 (이미 realizedProfit가 설정되어 있음)
newPositions.forEach(position => addToPortfolio(position))
```

### 해결책 3: setAUM에서 totalAssets 초기화 제거

`setAUM`에서 `totalAssets: aum` 설정을 제거하고, 항상 `calculatePortfolioValue()`를 통해 계산하도록 함.

## 권장 해결책

**해결책 2**가 가장 깔끔합니다:
1. `realizedProfit`를 먼저 설정
2. 그 다음 포지션을 추가하면 `calculatePortfolioValue()`가 올바른 `realizedProfit` 값을 사용하여 계산함
