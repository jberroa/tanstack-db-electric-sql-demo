import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatNumber } from '@/lib/client/utils';
import { PayoffScheduleResult } from '@/lib/universal/payoff';
import { Temporal } from '@js-temporal/polyfill';
import Decimal from 'decimal.js';
import { WorkbookDebt } from './DebtsList';

interface PayoffScheduleProps {
  payoffSchedule: PayoffScheduleResult;
  debts: WorkbookDebt[];
  showAllMonths: boolean;
  onShowAllMonthsChange: (show: boolean) => void;
  currentMonthIndex?: number;
}

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function PayoffSchedule({
  payoffSchedule,
  debts,
  showAllMonths,
  onShowAllMonthsChange,
  currentMonthIndex,
}: PayoffScheduleProps) {
  const visibleMonths = showAllMonths
    ? payoffSchedule.months
    : payoffSchedule.months.slice(0, 24);

  const debtMap = new Map(debts.map((debt) => [debt.id, debt]));
  const orderedDebts = payoffSchedule.sortedDebts
    .map((sortedDebt) => debtMap.get(sortedDebt.id))
    .filter((debt): debt is WorkbookDebt => debt !== undefined);

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border">
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">
          Payoff Schedule
        </h3>
      </div>

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3 p-4">
        {visibleMonths.map((month) => {
          const monthDate = Temporal.PlainYearMonth.from(month.date);
          const isCurrentMonth =
            currentMonthIndex !== undefined &&
            month.month === currentMonthIndex;
          return (
            <Card
              key={month.month}
              className={cn(
                'border border-border/60',
                isCurrentMonth && 'ring-2 ring-primary/20 bg-primary/5',
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground text-sm">
                    {monthDate.toPlainDate({ day: 1 }).toLocaleString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      You are here
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {orderedDebts.map((debt) => {
                    const payment = month.payments.find(
                      (p) => p.debtId === debt.id,
                    );
                    if (
                      !payment ||
                      (payment.newBalance.eq(0) && payment.payment.eq(0))
                    ) {
                      return (
                        <div
                          key={debt.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate pr-2">
                            {debt.name}
                          </span>
                          <span className="text-green-600 font-medium shrink-0">
                            Paid off
                          </span>
                        </div>
                      );
                    }
                    const extraAmount =
                      payment.extraAmount ?? new Decimal(0);
                    const isPayoff = payment.newBalance.eq(0);
                    const hasExtra = extraAmount.gt(0);
                    const label = isPayoff
                      ? 'Payoff'
                      : payment.isMinimum && !hasExtra
                        ? 'Min'
                        : hasExtra
                          ? `Min + $${formatNumber(extraAmount.toNumber())}`
                          : formatCurrency(payment.payment.toNumber());
                    return (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate pr-2">
                          {debt.name}
                        </span>
                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              'text-[10px] font-medium px-2 py-0.5 rounded mr-2',
                              payment.isMinimum && !hasExtra
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-green-50 text-green-700',
                            )}
                          >
                            {label}
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(payment.newBalance.toNumber())}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatCurrency(month.remainingBalance.toNumber())}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border">
              <TableHead className="w-32 pl-6 py-3 text-xs font-medium text-muted-foreground">
                Month
              </TableHead>
              {orderedDebts.map((debt) => (
                <TableHead
                  key={debt.id}
                  className="text-center min-w-[120px] py-3 text-xs font-medium text-muted-foreground"
                >
                  {debt.name}
                </TableHead>
              ))}
              <TableHead className="text-center min-w-[120px] bg-muted/30 py-3 text-xs font-bold text-muted-foreground">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleMonths.map((month) => {
              const monthDate = Temporal.PlainYearMonth.from(month.date);
              const isJanuary = monthDate.month === 1 && month.month > 0;
              const isCurrentMonth =
                currentMonthIndex !== undefined &&
                month.month === currentMonthIndex;
              return (
                <TableRow
                  key={month.month}
                  className={cn(
                    'hover:bg-muted/30 border-b-border',
                    isJanuary && 'border-t-2 border-t-foreground/40',
                    isCurrentMonth && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                  )}
                >
                  <TableCell className="font-medium text-sm text-foreground/80 pl-6 py-3">
                    <div className="flex items-center gap-2">
                      {monthDate.toPlainDate({ day: 1 }).toLocaleString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                      {isCurrentMonth && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-px rounded">
                          You are here
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {orderedDebts.map((debt) => {
                    const payment = month.payments.find(
                      (p) => p.debtId === debt.id,
                    );
                    if (
                      !payment ||
                      (payment.newBalance.eq(0) && payment.payment.eq(0))
                    ) {
                      return (
                        <TableCell key={debt.id} className="text-center py-3">
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-50 text-green-500">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </TableCell>
                      );
                    }
                    const extraAmount =
                      payment.extraAmount ?? new Decimal(0);
                    const isPayoff = payment.newBalance.eq(0);
                    const hasExtra = extraAmount.gt(0);
                    const label = isPayoff
                      ? 'Payoff'
                      : payment.isMinimum && !hasExtra
                        ? 'Min'
                        : hasExtra
                          ? `Min + $${formatNumber(extraAmount.toNumber())}`
                          : payment.payment
                              .toNumber()
                              .toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              });

                    return (
                      <TableCell key={debt.id} className="text-center py-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <div
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-px rounded-full',
                              payment.isMinimum && !hasExtra
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-green-50 text-green-700',
                            )}
                          >
                            {label}
                          </div>
                          <div className="text-xs font-medium text-foreground">
                            {payment.newBalance
                              .toNumber()
                              .toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                          </div>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-muted/30 py-3">
                    <div className="text-sm font-bold text-foreground">
                      {month.remainingBalance
                        .toNumber()
                        .toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Show More/Less Button */}
      {payoffSchedule.months.length > 24 && (
        <div className="p-4 text-center border-t border-border bg-muted/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowAllMonthsChange(!showAllMonths)}
            className="rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted h-8"
          >
            {showAllMonths
              ? 'Show Less'
              : `Show All ${payoffSchedule.months.length} Months`}
          </Button>
        </div>
      )}
    </div>
  );
}
