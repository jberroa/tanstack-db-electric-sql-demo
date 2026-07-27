import Decimal from 'decimal.js';

const MIN_PAYMENT_THRESHOLD = 35;

/**
 * Get suggested minimum payment for credit cards.
 * Formula: max(35, 1% of balance + monthly interest)
 * Must stay in sync with payoff.ts Debt.getMinPayment when fixedMinPayment is undefined.
 */
export function getSuggestedMinPayment(balance: Decimal, rate: Decimal): Decimal {
  if (balance.lte(0)) return new Decimal(0);

  const monthlyRate = rate.div(12);
  const interest = balance.mul(monthlyRate);
  const onePercentPlusInterest = balance.mul(0.01).plus(interest);

  return Decimal.max(
    Decimal.min(balance, MIN_PAYMENT_THRESHOLD),
    onePercentPlusInterest,
  );
}

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
