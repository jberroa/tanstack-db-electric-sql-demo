import { DebtType } from '@/lib/universal/types';
import { v7 as uuidv7 } from 'uuid';
import { debtsCollection } from './collections';

// Demo debt data template
// Credit cards use 1-2% of balance + interest for minimum payments
// Auto and home loans have fixed monthly payments
export const demoDebtsTemplate = [
  {
    name: 'Credit Card - Chase',
    type: DebtType.Credit,
    rate: 18.99,
    balance: 15420.0,
    minPayment: 397.0, // ~2% of balance + interest (percentage-based)
  },
  {
    name: 'Student Loan',
    type: DebtType.School,
    rate: 4.5,
    balance: 32500.0,
    minPayment: 447.0, // ~1% of balance + interest (percentage-based)
    limit: 45000.0,
  },
  {
    name: 'Car Loan',
    type: DebtType.Auto,
    rate: 6.25,
    balance: 8200.0,
    minPayment: 185.0, // Fixed monthly payment (installment loan)
    limit: 18000.0,
  },
  {
    name: 'Credit Card - Discover',
    type: DebtType.Credit,
    rate: 24.99,
    balance: 3850.0,
    minPayment: 119.0, // ~2% of balance + interest (percentage-based)
  },
  {
    name: 'Personal Loan',
    type: DebtType.Personal,
    rate: 11.99,
    balance: 19500.0,
    minPayment: 390.0, // ~1.5% of balance + interest (percentage-based)
    limit: 25000.0,
  },
];

export function populateDemoDebts(workbookId: string) {
  const now = new Date().toISOString();
  demoDebtsTemplate.forEach((debt) => {
    debtsCollection.insert({
      id: uuidv7(),
      workbookId,
      name: debt.name,
      type: debt.type,
      rate: debt.rate.toString(),
      minPayment: debt.minPayment.toString(),
      balance: debt.balance.toString(),
      limit: debt.limit?.toString() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  });
}
