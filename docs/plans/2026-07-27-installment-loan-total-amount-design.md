# Installment Loan Total Amount — Design

**Date:** 2026-07-27  
**Status:** Approved

## Problem

Personal (and other installment) loans only store current **balance**. Credit cards have a **limit** used for utilization. Without an original/total loan amount, payoff progress has no stable baseline for how much of the loan has been paid down.

## Decision

Reuse the existing nullable `limit` column:

| Debt type | UI label | Progress meaning |
|-----------|----------|------------------|
| Credit | Limit ($) | Utilization = balance / limit |
| Auto, Home, School, Personal | Total amount ($) | Payoff = (total − balance) / total |
| Other | (none) | Plan-based progress only |

No schema migration.

## UI

- Show a **Total amount ($)** editable field for Auto / Home / School / Personal, same layout as credit’s Limit row.
- Credit Limit + utilization bar unchanged.
- Field optional; empty → `null`.

## Payoff progress

When installment debt has `limit > 0`:

```
progress = clamp(0, 100, (total − displayedBalance) / total × 100)
```

- `displayedBalance` = projected plan-month balance if available, else current balance.
- Balance ≤ 0 → 100%.
- Balance > total → 0% (soft; still allow save).

When total is unset, keep existing plan-based progress:

```
(startBalance − projected) / startBalance
```

## Edge cases

- Soft validation only (no block when balance > total).
- Changing type Credit ↔ installment keeps the same `limit` value; label swaps.
- Demo debts for Auto / School / Personal include a sensible `limit` so progress is visible immediately.

## Out of scope

- New DB column / rename of `limit`
- Hard validation that balance ≤ total
- Total amount for `Other` debt type
