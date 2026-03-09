import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { db } from '../server/db';
import { debtSchema } from '../universal/entities';
import { DebtType } from '../universal/types';
import { authDebt, authUser, authWorkbook, getTxId } from './helpers';

export const createDebt = createServerFn({ method: 'POST' })
  .inputValidator(
    debtSchema
      .pick({
        id: true,
        workbookId: true,
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
        limit: true,
        dueDay: true,
      })
      .extend({
        name: debtSchema.shape.name.optional().default('Chase Visa'),
        type: debtSchema.shape.type.optional().default(DebtType.Credit),
        rate: debtSchema.shape.rate.optional().default('0'),
        balance: debtSchema.shape.balance.optional().default('0'),
        minPayment: debtSchema.shape.minPayment.optional().default('0'),
        limit: debtSchema.shape.limit.optional(),
        dueDay: debtSchema.shape.dueDay.optional(),
      }),
  )
  .handler(async ({ data }) => {
    await authWorkbook(data.workbookId);

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.create({
        data: {
          ...data,
          limit: data.limit ?? null,
          dueDay: data.dueDay ?? null,
        },
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
        limit: debt.limit?.toString(),
      },
      txid,
    };
  });

export const updateDebt = createServerFn({ method: 'POST' })
  .inputValidator(
    debtSchema
      .pick({
        id: true,
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
        limit: true,
        dueDay: true,
      })
      .partial({
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
        limit: true,
        dueDay: true,
      }),
  )
  .handler(async ({ data }) => {
    await authDebt(data.id);

    const updateData: {
      name?: string;
      type?: string;
      rate?: string;
      balance?: string;
      minPayment?: string;
      limit?: string | null;
      dueDay?: number | null;
    } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.minPayment !== undefined) updateData.minPayment = data.minPayment;
    if (data.limit !== undefined) updateData.limit = data.limit;
    if (data.dueDay !== undefined) updateData.dueDay = data.dueDay;

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.update({
        where: { id: data.id },
        data: updateData,
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
        limit: debt.limit?.toString(),
      },
      txid,
    };
  });

export const deleteDebt = createServerFn({ method: 'POST' })
  .inputValidator(debtSchema.pick({ id: true }))
  .handler(async ({ data }) => {
    await authDebt(data.id);

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.delete({
        where: { id: data.id },
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
      },
      txid,
    };
  });

export const listDebts = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await authUser();
  const userWorkbooks = await db.workbook.findMany({
    select: { id: true },
    where: { ownerId: user.id },
  });
  const workbookIds = userWorkbooks.map((w) => w.id);
  if (workbookIds.length === 0) return [];

  const debts = await db.debt.findMany({
    where: { workbookId: { in: workbookIds } },
  });
  return debts.map((debt) => ({
    ...debt,
    rate: debt.rate.toString(),
    balance: debt.balance.toString(),
    minPayment: debt.minPayment.toString(),
    limit: debt.limit?.toString() ?? null,
    createdAt: debt.createdAt.toISOString(),
    updatedAt: debt.updatedAt.toISOString(),
  }));
});

// Demo debt data template
// Credit cards use 1-2% of balance + interest for minimum payments
// Auto and home loans have fixed monthly payments
const demoDebtsTemplate = [
  {
    name: 'Credit Card - Chase',
    type: DebtType.Credit,
    rate: '18.99',
    balance: '15420.00',
    minPayment: '397.00',
  },
  {
    name: 'Student Loan',
    type: DebtType.School,
    rate: '4.50',
    balance: '32500.00',
    minPayment: '447.00',
  },
  {
    name: 'Car Loan',
    type: DebtType.Auto,
    rate: '6.25',
    balance: '8200.00',
    minPayment: '185.00',
  },
  {
    name: 'Credit Card - Discover',
    type: DebtType.Credit,
    rate: '24.99',
    balance: '3850.00',
    minPayment: '119.00',
  },
  {
    name: 'Personal Loan',
    type: DebtType.Personal,
    rate: '11.99',
    balance: '19500.00',
    minPayment: '390.00',
  },
];

export const populateDemoDebts = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ workbookId: z.uuidv7() }))
  .handler(async ({ data }) => {
    await authWorkbook(data.workbookId);

    const [debts, [{ txid }]] = await db.$transaction([
      db.debt.createMany({
        data: demoDebtsTemplate.map((debt) => ({
          workbookId: data.workbookId,
          name: debt.name,
          type: debt.type,
          rate: debt.rate,
          balance: debt.balance,
          minPayment: debt.minPayment,
        })),
      }),
      getTxId(),
    ]);

    return {
      count: debts.count,
      txid,
    };
  });
