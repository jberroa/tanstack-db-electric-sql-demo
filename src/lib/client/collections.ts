import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/react-db';
import { QueryClient } from '@tanstack/react-query';
import { createDebt, deleteDebt, listDebts, updateDebt } from '../fn/debts';
import {
  createWorkbook,
  deleteWorkbook,
  listWorkbooks,
  updateWorkbook,
} from '../fn/workbooks';
import { debtSchema, workbookSchema } from '../universal/entities';

const queryClient = new QueryClient();

export const workbooksCollection = createCollection(
  queryCollectionOptions({
    id: 'workbooks',
    schema: workbookSchema,
    queryKey: ['workbooks'],
    queryFn: () => listWorkbooks(),
    queryClient,
    getKey: (item) => item.id,
    refetchInterval: 0,

    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified;
      await createWorkbook({ data: newItem });
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      await updateWorkbook({
        data: { ...changes, id: original.id },
      });
    },

    onDelete: async ({ transaction }) => {
      const deletedItem = transaction.mutations[0].original;
      await deleteWorkbook({
        data: { id: deletedItem.id },
      });
    },
  }),
);

export const debtsCollection = createCollection(
  queryCollectionOptions({
    id: 'debts',
    schema: debtSchema,
    queryKey: ['debts'],
    queryFn: () => listDebts(),
    queryClient,
    getKey: (item) => item.id,
    refetchInterval: 0,

    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified;
      await createDebt({ data: newItem });
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      await updateDebt({
        data: {
          id: original.id,
          ...changes,
        },
      });
    },

    onDelete: async ({ transaction }) => {
      const deletedItem = transaction.mutations[0].original;
      await deleteDebt({
        data: { id: deletedItem.id },
      });
    },
  }),
);
