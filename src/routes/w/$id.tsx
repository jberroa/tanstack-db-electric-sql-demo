import { useSession } from '@/lib/client/auth-client';
import { debtsCollection, workbooksCollection } from '@/lib/client/collections';
import { populateDemoDebts } from '@/lib/fn/debts';
import { Debt, PayoffCalculator } from '@/lib/universal/payoff';
import { formatNumber } from '@/lib/client/utils';
import { DebtType, PayoffStrategyType } from '@/lib/universal/types';
import { eq, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Temporal } from '@js-temporal/polyfill';
import Decimal from 'decimal.js';
import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { v7 as uuidv7 } from 'uuid';
import { Button } from '@/components/ui/button';
import { BalanceCharts } from './-components/BalanceCharts';
import { DebtsList } from './-components/DebtsList';
import { PayoffSchedule } from './-components/PayoffSchedule';
import { PayoffStrategy } from './-components/PayoffStrategy';
import { PayoffSummary } from './-components/PayoffSummary';
import { WorkbookNavBar } from './-components/WorkbookNavBar';

export const Route = createFileRoute('/w/$id')({
  ssr: false,
  component: WorkbookDetail,
});

function WorkbookDetail() {
  const navigate = useNavigate();
  const { id: workbookId } = Route.useParams();
  const { data: session, isPending } = useSession();

  const { data: workbook } = useLiveQuery((q) =>
    q
      .from({ workbook: workbooksCollection })
      .where(({ workbook }) => eq(workbook.id, workbookId))
      .findOne(),
  );

  const { data: allDebts } = useLiveQuery((q) =>
    q
      .from({ debt: debtsCollection })
      .where(({ debt }) => eq(debt.workbookId, workbookId))
      .orderBy(({ debt }) => debt.name),
  );

  // Filter debts by workbookId and ensure numeric fields are numbers
  const debts = allDebts
    .filter((debt) => debt.workbookId === workbookId)
    .map((debt) => ({
      ...debt,
      rate: new Decimal(debt.rate),
      balance: new Decimal(debt.balance),
      minPayment: new Decimal(debt.minPayment),
      limit: debt.limit ? new Decimal(debt.limit) : null,
      dueDay: debt.dueDay ?? null,
    }));

  // Payoff calculator state
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [newDebtId, setNewDebtId] = useState<string | null>(null);

  // Get strategy and monthlyPayment from workbook, with defaults
  const strategy: PayoffStrategyType =
    workbook?.strategy === 'snowball'
      ? PayoffStrategyType.Snowball
      : PayoffStrategyType.Avalanche;

  const totalMonthlyPayment = workbook?.monthlyPayment
    ? new Decimal(workbook.monthlyPayment)
    : new Decimal(0);

  // Update totalMonthlyPayment when totalMinPayment increases (e.g. user added a debt)
  const totalMinPayment = debts.reduce(
    (sum, debt) => sum.add(debt.minPayment),
    new Decimal(0),
  );
  const prevTotalMinRef = useRef<Decimal>(totalMinPayment);
  useEffect(() => {
    const prev = prevTotalMinRef.current;
    prevTotalMinRef.current = totalMinPayment;
    // Only auto-bump when totalMinPayment actually increased and is now above budget.
    // Avoids overwriting saved budget on initial load when workbook may load with stale/default.
    if (
      totalMinPayment.gt(prev) &&
      totalMinPayment.gt(totalMonthlyPayment) &&
      workbook
    ) {
      workbooksCollection.update(workbook.id, (draft) => {
        draft.monthlyPayment = totalMinPayment.toString();
      });
    }
  }, [totalMinPayment, totalMonthlyPayment, workbook]);

  // Calculate payoff schedule
  const payoffSchedule =
    debts.length === 0 || totalMonthlyPayment.eq(0)
      ? null
      : (() => {
          const payment = totalMonthlyPayment;
          if (payment.lt(totalMinPayment)) {
            return null;
          }

          const payoffDebts = debts.map((d) =>
            new Debt({
              id: d.id,
              name: d.name,
              startBalance: d.balance,
              rate: d.rate.div(100),
              fixedMinPayment: d.minPayment, // Use user-entered min for all types
            }),
          );

          const startDate =
            workbook?.planStartDate &&
            workbook.planStartDate !== '' &&
            !Number.isNaN(new Date(workbook.planStartDate).getTime())
              ? Temporal.PlainDate.from(
                  new Date(workbook.planStartDate).toISOString().slice(0, 10),
                ).toPlainYearMonth()
              : Temporal.Now.plainDateISO().toPlainYearMonth();

          const calculator = new PayoffCalculator(
            payoffDebts,
            payment,
            strategy,
            startDate,
          );
          const result = calculator.calculate();

          // Minimum-only comparison: interest if paying only minimums
          const minOnlyCalculator = new PayoffCalculator(
            payoffDebts,
            totalMinPayment,
            strategy,
            startDate,
          );
          const minOnlyResult = minOnlyCalculator.calculate();
          const extraPaymentSavings =
            payment.gt(totalMinPayment) &&
            minOnlyResult.totalInterestPaid.gt(result.totalInterestPaid)
              ? minOnlyResult.totalInterestPaid.minus(result.totalInterestPaid)
              : null;

          // Strategy comparison: run opposite strategy for interest diff (same budget)
          const oppositeStrategy =
            strategy === PayoffStrategyType.Avalanche
              ? PayoffStrategyType.Snowball
              : PayoffStrategyType.Avalanche;
          const oppCalculator = new PayoffCalculator(
            payoffDebts,
            payment,
            oppositeStrategy,
            startDate,
          );
          const oppResult = oppCalculator.calculate();
          const strategyInterestDiff = oppResult.totalInterestPaid.minus(
            result.totalInterestPaid,
          );

          return {
            ...result,
            strategyInterestDiff,
            oppositeStrategyName:
              oppositeStrategy === PayoffStrategyType.Avalanche
                ? 'Avalanche'
                : 'Snowball',
            oppositeStrategyTotalInterest: oppResult.totalInterestPaid,
            minPaymentOnlyInterest: minOnlyResult.totalInterestPaid,
            extraPaymentSavings,
          };
        })();

  // Plan start date: compute elapsed months for "You are here" and projected balances
  const planStartDate =
    workbook?.planStartDate &&
    workbook.planStartDate !== '' &&
    !Number.isNaN(new Date(workbook.planStartDate).getTime())
      ? new Date(workbook.planStartDate)
      : null;
  const today = Temporal.Now.plainDateISO();
  const planStartPlain =
    planStartDate &&
    Temporal.PlainDate.from(planStartDate.toISOString().slice(0, 10));
  const elapsedMonths =
    planStartPlain && payoffSchedule
      ? Math.min(
          Math.max(
            0,
            Math.floor(planStartPlain.until(today).months),
          ),
          payoffSchedule.months.length - 1,
        )
      : 0;
  const currentMonthIndex = Math.max(0, elapsedMonths);
  const projectedBalances =
    payoffSchedule &&
    currentMonthIndex < payoffSchedule.months.length &&
    elapsedMonths > 0
      ? new Map(
          payoffSchedule.months[currentMonthIndex].payments.map((p) => [
            p.debtId,
            p.newBalance,
          ]),
        )
      : null;

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' });
    }
  }, [session, isPending, navigate]);

  const handlePopulateDemoDebts = async () => {
    await populateDemoDebts({ data: { workbookId } });
  };

  const handleAddDebt = () => {
    const id = uuidv7();
    setNewDebtId(id);
    const now = new Date().toISOString();
    debtsCollection.insert({
      id,
      workbookId,
      name: 'New Debt',
      type: DebtType.Credit,
      rate: '0',
      minPayment: '0',
      balance: '0',
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleTypeChange = (debtId: string, newType: DebtType) => {
    debtsCollection.update(debtId, (draft) => {
      draft.type = newType;
    });
  };

  const handleUpdateDebt = (
    debtId: string,
    field:
      | 'name'
      | 'balance'
      | 'minPayment'
      | 'rate'
      | 'limit'
      | 'dueDay',
    value: string | number,
  ) => {
    debtsCollection.update(debtId, (draft) => {
      if (field === 'balance' || field === 'rate' || field === 'minPayment') {
        // @ts-ignore - dynamic assignment
        draft[field] = value.toString();
      } else if (field === 'limit') {
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        // @ts-ignore - dynamic assignment
        draft.limit =
          value === '' || Number.isNaN(num) ? null : num.toString();
      } else if (field === 'dueDay') {
        const num = typeof value === 'number' ? value : parseInt(String(value), 10);
        // @ts-ignore - dynamic assignment
        draft.dueDay =
          value === '' || Number.isNaN(num) || num < 1 || num > 31
            ? null
            : num;
      } else {
        // @ts-ignore - dynamic assignment
        draft[field] = value;
      }
    });
  };

  const handleDeleteDebt = (debtId: string) => {
    debtsCollection.delete(debtId);
  };

  const handleStrategyChange = (newStrategy: PayoffStrategyType) => {
    if (!workbook) return;
    workbooksCollection.update(workbook.id, (draft) => {
      draft.strategy = newStrategy;
    });
  };

  const handleMonthlyPaymentChange = (value: Decimal) => {
    if (!workbook) return;
    workbooksCollection.update(workbook.id, (draft) => {
      draft.monthlyPayment = value.toString();
    });
  };

  const handlePlanStartDateChange = (value: string | null) => {
    if (!workbook) return;
    workbooksCollection.update(workbook.id, (draft) => {
      // @ts-ignore - planStartDate exists on workbook
      draft.planStartDate = value || null;
    });
  };

  const handleSyncToPlan = () => {
    if (!projectedBalances) return;
    projectedBalances.forEach((balance, debtId) => {
      debtsCollection.update(debtId, (draft) => {
        draft.balance = balance.toString();
      });
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <WorkbookNavBar user={session.user} workbook={workbook} />

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Left Column: Data Entry */}
          <div className="lg:col-span-1 h-full flex flex-col min-h-0 bg-gradient-to-b from-slate-50 to-slate-100/80">
            <div className="flex-1 overflow-hidden min-h-0 pt-4 px-4 lg:pt-6 lg:px-6 pb-0.5">
              <div className="max-w-xl ml-auto mr-auto lg:mr-0 h-full">
                <DebtsList
                  debts={debts}
                  newDebtId={newDebtId}
                  onNewDebtFocused={() => setNewDebtId(null)}
                  onPopulateDemoDebts={handlePopulateDemoDebts}
                  onAddDebt={handleAddDebt}
                  onTypeChange={handleTypeChange}
                  onUpdateDebt={handleUpdateDebt}
                  onDeleteDebt={handleDeleteDebt}
                  projectedBalances={projectedBalances}
                />
              </div>
            </div>
            <div className="flex-none px-4 lg:px-6 pt-3 pb-4 lg:pb-6">
              <div className="max-w-xl ml-auto mr-auto lg:mr-0">
                <PayoffStrategy
                  strategy={strategy}
                  onStrategyChange={handleStrategyChange}
                  totalMonthlyPayment={totalMonthlyPayment}
                  onTotalMonthlyPaymentChange={handleMonthlyPaymentChange}
                  totalMinPayment={totalMinPayment}
                  extraMoney={
                    payoffSchedule
                      ? totalMonthlyPayment.minus(totalMinPayment)
                      : new Decimal(0)
                  }
                  extraTargetDebtName={
                    payoffSchedule?.sortedDebts?.[0]?.name ?? undefined
                  }
                  planStartDate={
                    workbook?.planStartDate &&
                    workbook.planStartDate !== ''
                      ? workbook.planStartDate
                      : null
                  }
                  onPlanStartDateChange={handlePlanStartDateChange}
                  projectedBalances={projectedBalances}
                  onSyncToPlan={handleSyncToPlan}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Visualization */}
          <div className="lg:col-span-2 h-full overflow-y-auto bg-slate-50/50">
            <div className="p-6 lg:p-10 max-w-5xl space-y-6">
              {debts.length > 0 ? (
                <>
                  {totalMonthlyPayment.gt(0) &&
                  totalMonthlyPayment.lt(totalMinPayment) ? (
                    <>
                      <BalanceCharts debts={debts} />
                      <div className="p-4 rounded-xl border border-border/50 bg-card/50 shadow-sm">
                        <p className="text-sm text-foreground">
                          Your budget ($
                          {formatNumber(totalMonthlyPayment.toNumber())}) is
                          below the required minimum ($
                          {formatNumber(totalMinPayment.toNumber())}). Increase
                          your monthly budget or reduce debts to see a payoff
                          plan.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Payoff Summary + Balance Charts side by side */}
                      <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                        <div className="flex-1 min-w-0">
                          {payoffSchedule && (
                            <PayoffSummary
                              payoffSchedule={payoffSchedule}
                              strategyInterestDiff={
                                'strategyInterestDiff' in payoffSchedule
                                  ? payoffSchedule.strategyInterestDiff
                                  : undefined
                              }
                              oppositeStrategyName={
                                'oppositeStrategyName' in payoffSchedule
                                  ? payoffSchedule.oppositeStrategyName
                                  : undefined
                              }
                              oppositeStrategyTotalInterest={
                                'oppositeStrategyTotalInterest' in payoffSchedule
                                  ? payoffSchedule.oppositeStrategyTotalInterest
                                  : undefined
                              }
                              extraMoney={totalMonthlyPayment.minus(totalMinPayment)}
                            />
                          )}
                        </div>
                        <div className="xl:w-[360px] flex-shrink-0">
                          <BalanceCharts debts={debts} />
                        </div>
                      </div>

                      {/* Payoff Table */}
                      {payoffSchedule && (
                        <PayoffSchedule
                          payoffSchedule={payoffSchedule}
                          debts={debts}
                          showAllMonths={showAllMonths}
                          onShowAllMonthsChange={setShowAllMonths}
                          currentMonthIndex={
                            planStartDate ? currentMonthIndex : undefined
                          }
                        />
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to be debt-free?
                  </h3>
                  <ol className="text-left text-muted-foreground max-w-md space-y-2 mb-6 list-decimal list-inside">
                    <li>Add your debts (balance, rate, min payment from statements)</li>
                    <li>Enter your monthly budget above minimums</li>
                    <li>Choose Avalanche or Snowball</li>
                    <li>View your payoff plan</li>
                  </ol>
                  <Button
                    onClick={handlePopulateDemoDebts}
                    variant="outline"
                    size="sm"
                    className="mb-4"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Populate Demo
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Not sure where to start? Try the demo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
