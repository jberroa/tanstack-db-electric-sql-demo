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
