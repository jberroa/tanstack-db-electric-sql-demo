import { createServerFn } from '@tanstack/react-start';
import { WorkbookEntity, db } from '../server/db';
import { workbookSchema } from '../universal/entities';
import { authUser, authWorkbook, getTxId } from './helpers';

const serialize = (workbook: WorkbookEntity) => {
  return {
    ...workbook,
    monthlyPayment: workbook.monthlyPayment.toString(),
    planStartDate: workbook.planStartDate?.toISOString().slice(0, 10) ?? null,
    createdAt: workbook.createdAt.toISOString(),
    updatedAt: workbook.updatedAt.toISOString(),
  };
};

export const createWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(
    workbookSchema
      .pick({ id: true, name: true, monthlyPayment: true, strategy: true })
      .extend({
        name: workbookSchema.shape.name.optional().default('My Workbook'),
        monthlyPayment: workbookSchema.shape.monthlyPayment
          .optional()
          .default('0'),
        strategy: workbookSchema.shape.strategy.optional().default('avalanche'),
      }),
  )
  .handler(async ({ data }) => {
    const user = await authUser();
    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.create({
        data: { ...data, ownerId: user.id },
      }),
      getTxId(),
    ]);
    return { workbook: serialize(workbook), txid };
  });

export const updateWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(
    workbookSchema
      .pick({
        id: true,
        name: true,
        monthlyPayment: true,
        strategy: true,
        planStartDate: true,
      })
      .partial({
        name: true,
        monthlyPayment: true,
        strategy: true,
        planStartDate: true,
      }),
  )
  .handler(async ({ data }) => {
    const { id, ...restData } = data;
    await authWorkbook(id);

    const updateData = { ...restData };
    if (updateData.planStartDate !== undefined) {
      updateData.planStartDate = updateData.planStartDate
        ? new Date(updateData.planStartDate)
        : null;
    }

    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.update({ where: { id }, data: updateData }),
      getTxId(),
    ]);
    return { workbook: serialize(workbook), txid };
  });

export const deleteWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(workbookSchema.pick({ id: true }))
  .handler(async ({ data }) => {
    await authWorkbook(data.id);
    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.delete({
        where: { id: data.id },
      }),
      getTxId(),
    ]);
    return { workbook: serialize(workbook), txid };
  });

export const listWorkbooks = createServerFn({ method: 'GET' }).handler(
  async () => {
    const user = await authUser();
    const workbooks = await db.workbook.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    return workbooks.map(serialize);
  },
);
