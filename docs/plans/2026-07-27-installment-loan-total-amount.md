# Installment Loan Total Amount Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let Auto / Home / School / Personal debts store original loan amount (via existing `limit`) and drive payoff progress from `(total − balance) / total`.

**Architecture:** Reuse `debts.limit` with type-specific UI labels. Extract pure progress helpers into `payoff-utils.ts` for unit tests; wire `DebtsList` and demo seed data. No schema migration.

**Tech Stack:** React, Decimal.js, Vitest, existing TanStack Start debt mutations

**Design:** @docs/plans/2026-07-27-installment-loan-total-amount-design.md

---

### Task 1: Payoff progress helpers + tests

**Files:**
- Modify: `src/lib/universal/payoff-utils.ts`
- Create: `src/lib/universal/payoff-utils.test.ts`

**Step 1: Write the failing tests**

Add `src/lib/universal/payoff-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  getInstallmentPayoffProgress,
  getPlanPayoffProgress,
} from './payoff-utils';

describe('getInstallmentPayoffProgress', () => {
  it('returns percent paid of original total', () => {
    expect(
      getInstallmentPayoffProgress(
        new Decimal(20000),
        new Decimal(15000),
      ),
    ).toBeCloseTo(25);
  });

  it('returns 100 when balance is zero or negative', () => {
    expect(
      getInstallmentPayoffProgress(new Decimal(10000), new Decimal(0)),
    ).toBe(100);
    expect(
      getInstallmentPayoffProgress(new Decimal(10000), new Decimal(-1)),
    ).toBe(100);
  });

  it('returns 0 when balance exceeds total', () => {
    expect(
      getInstallmentPayoffProgress(
        new Decimal(10000),
        new Decimal(12000),
      ),
    ).toBe(0);
  });

  it('returns null when total is missing or not positive', () => {
    expect(
      getInstallmentPayoffProgress(null, new Decimal(5000)),
    ).toBeNull();
    expect(
      getInstallmentPayoffProgress(new Decimal(0), new Decimal(5000)),
    ).toBeNull();
  });
});

describe('getPlanPayoffProgress', () => {
  it('measures plan progress from start vs projected', () => {
    expect(
      getPlanPayoffProgress(new Decimal(10000), new Decimal(7500)),
    ).toBeCloseTo(25);
  });

  it('returns 0 when start balance is not positive', () => {
    expect(
      getPlanPayoffProgress(new Decimal(0), new Decimal(0)),
    ).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/universal/payoff-utils.test.ts`

Expected: FAIL (exports missing)

**Step 3: Implement helpers in `payoff-utils.ts`**

Append:

```ts
/**
 * Payoff progress for installment loans with an original total (stored in `limit`).
 * Returns null when total is unset so callers can fall back to plan-based progress.
 */
export function getInstallmentPayoffProgress(
  total: Decimal | null | undefined,
  balance: Decimal,
): number | null {
  if (!total || total.lte(0)) return null;
  if (balance.lte(0)) return 100;
  if (balance.gte(total)) return 0;
  return total.minus(balance).div(total).mul(100).toNumber();
}

/**
 * Plan scrubber progress: how far projected balance has fallen from start balance.
 */
export function getPlanPayoffProgress(
  startBalance: Decimal,
  currentBalance: Decimal,
): number {
  if (startBalance.lte(0)) return 0;
  if (currentBalance.lte(0)) return 100;
  const paid = startBalance.minus(currentBalance);
  return paid.div(startBalance).mul(100).toNumber();
}
```

**Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/universal/payoff-utils.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/universal/payoff-utils.ts src/lib/universal/payoff-utils.test.ts
git commit -m "feat: add installment and plan payoff progress helpers"
```

---

### Task 2: Show Total amount UI for installment debts

**Files:**
- Modify: `src/routes/w/-components/DebtsList.tsx`

**Step 1: Add installment type helper near top of file (after DEBT_TYPE_STYLES)**

```ts
const INSTALLMENT_TYPES = new Set([
  DebtType.Auto,
  DebtType.Home,
  DebtType.School,
  DebtType.Personal,
]);

function isInstallmentDebt(type: DebtType): boolean {
  return INSTALLMENT_TYPES.has(type);
}
```

**Step 2: Extend the credit-only Limit row to also cover installment Total amount**

Replace the block currently gated by `debt.type === DebtType.Credit` (Limit + utilization) with:

```tsx
{(debt.type === DebtType.Credit || isInstallmentDebt(debt.type)) && (
  <div className="pt-3 mt-3 border-t border-border/60 pl-0 sm:pl-11 flex items-end gap-4 min-w-0 overflow-hidden">
    <div className="min-w-0 overflow-hidden">
      <label className="text-[10px] font-medium text-muted-foreground block mb-1">
        {debt.type === DebtType.Credit ? 'Limit ($)' : 'Total amount ($)'}
      </label>
      <div className="rounded-lg bg-muted/30 px-2.5 py-2 h-10 flex items-center border border-transparent focus-within:border-primary/25 focus-within:bg-muted/50 transition-colors duration-150">
        <EditableCell
          value={debt.limit?.toNumber() ?? ''}
          type="number"
          prefix="$"
          onSave={(val) =>
            onUpdateDebt(debt.id, 'limit', val as number)
          }
          className="text-sm font-medium"
          embedded
        />
      </div>
    </div>
    {debt.type === DebtType.Credit &&
      debt.limit &&
      debt.limit.gt(0) && (
        <UtilizationProgressBar
          percent={debt.balance.div(debt.limit).mul(100).toNumber()}
        />
      )}
  </div>
)}
```

**Step 3: Manual check**

Run: `pnpm dev`  
Open a workbook → create/select Personal (or Auto/Home/School) debt → confirm **Total amount ($)** appears; Credit still shows **Limit ($)** + utilization.

**Step 4: Commit**

```bash
git add src/routes/w/-components/DebtsList.tsx
git commit -m "feat: show total amount field on installment debts"
```

---

### Task 3: Wire payoff progress bar to helpers

**Files:**
- Modify: `src/routes/w/-components/DebtsList.tsx`

**Step 1: Import helpers**

Update existing import from `@/lib/universal/payoff-utils` to include:

```ts
import {
  getSuggestedMinPayment,
  getInstallmentPayoffProgress,
  getPlanPayoffProgress,
} from '@/lib/universal/payoff-utils';
```

**Step 2: Replace PayoffProgressBar progress IIFE**

```tsx
<PayoffProgressBar
  progress={(() => {
    const displayedBalance =
      projectedBalances?.get(debt.id) ?? debt.balance;

    if (isInstallmentDebt(debt.type)) {
      const installmentProgress = getInstallmentPayoffProgress(
        debt.limit,
        displayedBalance,
      );
      if (installmentProgress !== null) return installmentProgress;
    }

    return getPlanPayoffProgress(debt.balance, displayedBalance);
  })()}
  label="Payoff progress"
/>
```

**Step 3: Manual check**

- Personal loan with Total amount `$20000`, Balance `$15000` → ~25% progress without scrubbing months.
- Scrubbing plan months should move progress as projected balance changes.
- Credit cards unchanged; installment without total still uses plan-based progress.

**Step 4: Commit**

```bash
git add src/routes/w/-components/DebtsList.tsx
git commit -m "feat: drive installment payoff progress from total amount"
```

---

### Task 4: Seed demo installment totals

**Files:**
- Modify: `src/lib/client/demo-debts.ts`
- Modify: `src/lib/fn/debts.ts` (server `demoDebtsTemplate` + `createMany` mapping)

**Step 1: Add `limit` to installment demo rows**

Suggested values (original > current balance):

| Name | balance | limit (total) |
|------|---------|---------------|
| Student Loan | 32500 | 45000 |
| Car Loan | 8200 | 18000 |
| Personal Loan | 19500 | 25000 |

Client template example:

```ts
{
  name: 'Personal Loan',
  type: DebtType.Personal,
  rate: 11.99,
  balance: 19500.0,
  minPayment: 390.0,
  limit: 25000.0,
},
```

In `populateDemoDebts` insert, include:

```ts
limit: debt.limit?.toString() ?? null,
```

Mirror the same `limit` strings on the server template in `src/lib/fn/debts.ts` and pass `limit: debt.limit ?? null` into `createMany`.

**Step 2: Manual check**

Populate demo debts → Personal / Auto / School show total amount and non-zero payoff progress.

**Step 3: Commit**

```bash
git add src/lib/client/demo-debts.ts src/lib/fn/debts.ts
git commit -m "feat: seed original totals on demo installment debts"
```

---

### Task 5: Final verification

**Step 1: Run unit tests**

Run: `pnpm test src/lib/universal/payoff-utils.test.ts`  
Expected: all PASS

**Step 2: Typecheck / lint touched files if project habit**

Run: `pnpm exec tsc --noEmit` (or existing check)  
Expected: no new errors in touched files

**Step 3: Smoke UI**

- Edit total amount on Personal → progress updates immediately
- Clear total → falls back to plan progress
- Switch type Credit ↔ Personal → value retained, label swaps
