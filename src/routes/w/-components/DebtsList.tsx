import { sortBy } from 'es-toolkit';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  cn,
  formatNumber,
  parseNumericInput,
  toNumericValue,
} from '@/lib/client/utils';
import { getSuggestedMinPayment } from '@/lib/universal/payoff-utils';
import { DebtType } from '@/lib/universal/types';
import Decimal from 'decimal.js';
import { AnimatePresence, Reorder } from 'framer-motion';
import {
  Calendar,
  Car,
  ChevronDown,
  ChevronUp,
  CreditCard,
  GraduationCap,
  Home,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface WorkbookDebt {
  id: string;
  name: string;
  type: string;
  rate: Decimal;
  balance: Decimal;
  minPayment: Decimal;
  limit?: Decimal | null;
  dueDay?: number | null;
}

interface DebtTypeOption {
  value: DebtType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const debtTypeOptions: DebtTypeOption[] = [
  { value: DebtType.Auto, label: 'Auto', icon: Car },
  { value: DebtType.Home, label: 'Home', icon: Home },
  { value: DebtType.Credit, label: 'Credit', icon: CreditCard },
  { value: DebtType.School, label: 'School', icon: GraduationCap },
  { value: DebtType.Personal, label: 'Personal', icon: User },
  { value: DebtType.Other, label: 'Other', icon: Wallet },
];

const debtTypeAccent: Record<string, { border: string; icon: string }> = {
  [DebtType.Auto]: { border: 'border-l-amber-400', icon: 'bg-amber-50 text-amber-600' },
  [DebtType.Home]: { border: 'border-l-blue-400', icon: 'bg-blue-50 text-blue-600' },
  [DebtType.Credit]: { border: 'border-l-violet-400', icon: 'bg-violet-50 text-violet-600' },
  [DebtType.School]: { border: 'border-l-emerald-400', icon: 'bg-emerald-50 text-emerald-600' },
  [DebtType.Personal]: { border: 'border-l-rose-400', icon: 'bg-rose-50 text-rose-600' },
  [DebtType.Other]: { border: 'border-l-slate-400', icon: 'bg-slate-100 text-slate-600' },
};

interface DebtsListProps {
  debts: WorkbookDebt[];
  newDebtId?: string | null;
  onNewDebtFocused?: () => void;
  onPopulateDemoDebts: () => void;
  onAddDebt: () => void;
  onTypeChange: (debtId: string, newType: DebtType) => void;
  onUpdateDebt: (
    debtId: string,
    field: 'name' | 'balance' | 'minPayment' | 'rate' | 'limit' | 'dueDay',
    value: string | number,
  ) => void;
  onDeleteDebt: (debtId: string) => void;
  projectedBalances?: Map<string, Decimal> | null;
}

const EditableCell = ({
  value,
  onSave,
  type = 'text',
  prefix,
  suffix,
  className = '',
  shouldFocus,
  onFocus,
  embedded = false,
}: {
  value: string | number | Decimal;
  onSave: (val: string | number) => void;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  className?: string;
  shouldFocus?: boolean;
  onFocus?: () => void;
  embedded?: boolean;
}) => {
  const [localValue, setLocalValue] = useState<string | number>(
    toNumericValue(value),
  );
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pendingSavedRef = React.useRef<string | number | null>(null);

  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [shouldFocus]);

  useEffect(() => {
    const incoming = toNumericValue(value);
    if (pendingSavedRef.current !== null) {
      const saved = pendingSavedRef.current;
      const incomingNum = type === 'number' ? parseNumericInput(incoming) : incoming;
      const savedNum = type === 'number' ? (typeof saved === 'number' ? saved : parseNumericInput(saved)) : saved;
      const matches =
        type === 'number'
          ? !Number.isNaN(incomingNum) &&
            !Number.isNaN(savedNum) &&
            Math.abs(Number(incomingNum) - Number(savedNum)) < 0.01
          : incoming === saved;
      if (matches) {
        pendingSavedRef.current = null;
      } else if (incoming === '' || incoming === null || incoming === undefined) {
        return;
      }
    }
    setLocalValue(incoming);
  }, [value, type]);

  const displayValue = isFocused
    ? String(localValue ?? '')
    : type === 'number'
      ? formatNumber(localValue) || String(localValue ?? '')
      : String(localValue ?? '');

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
    if (type === 'number') {
      const num = parseNumericInput(localValue);
      setLocalValue(isNaN(num) ? localValue : num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleanValue =
      type === 'number' ? parseNumericInput(localValue) : localValue;
    const originalValue = toNumericValue(value);
    const normalizedOriginal = type === 'number' ? parseNumericInput(originalValue) : originalValue;
    const normalizedClean = type === 'number' ? (Number.isNaN(cleanValue) ? cleanValue : Number(cleanValue)) : cleanValue;

    if (normalizedClean !== normalizedOriginal) {
      const toSave = type === 'number' ? Number(cleanValue) : cleanValue;
      const isClearing = type === 'number' ? Number.isNaN(cleanValue) : cleanValue === '';
      if (!isClearing) {
        pendingSavedRef.current = toSave;
      }
      onSave(toSave);
    } else {
      setLocalValue(originalValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =
      type === 'number'
        ? e.target.value.replace(/[^\d.-]/g, '')
        : e.target.value;
    setLocalValue(newValue);
  };

  const isRightAligned = className.includes('justify-end');
  const showBackground = type === 'number' && !embedded;

  return (
    <div className={cn('flex items-center min-w-0 group', className)}>
      <div
        className={cn(
          'flex items-center w-full min-w-0 rounded transition-colors',
          !embedded && 'border border-transparent px-1.5 py-0.5 hover:border-border/30 focus-within:border-border/60',
          showBackground && 'bg-muted/30 focus-within:bg-background',
          isRightAligned && 'justify-end',
        )}
      >
        {prefix && (
          <span className="text-muted-foreground text-xs mr-1 select-none">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'bg-transparent border-none p-0 h-auto focus:ring-0 flex-1 min-w-0 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none',
            isRightAligned && 'text-right',
          )}
        />
        {suffix && (
          <span className="text-muted-foreground text-xs ml-1.5 select-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};

const DebtField = ({
  label,
  value,
  onSave,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onSave: (val: number) => void;
  prefix?: string;
  suffix?: string;
}) => (
  <div>
    <EditableCell
      value={value}
      type="number"
      prefix={prefix}
      suffix={suffix}
      onSave={(val) => onSave(val as number)}
      className="text-sm text-foreground/80"
    />
    <div className="text-[10px] font-semibold text-muted-foreground mt-0.5 text-left pl-1.5">
      {label}
    </div>
  </div>
);

const TotalDisplay = ({ label, amount }: { label: string; amount: number }) => (
  <div className="text-right">
    <span className="block font-bold text-foreground">
      {amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })}
    </span>
    <span className="block text-[10px] font-semibold text-muted-foreground mt-0.5">
      {label}
    </span>
  </div>
);

const RateDisplay = ({ label, rate }: { label: string; rate: number }) => (
  <div className="text-right">
    <span className="block font-bold text-foreground">{rate.toFixed(2)}%</span>
    <span className="block text-[10px] font-semibold text-muted-foreground mt-0.5">
      {label}
    </span>
  </div>
);

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Horizontal progress bar for utilization % (0–100). Green <30%, amber 30–70%, red >70%. */
function UtilizationProgressBar({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, percent));
  const fillColor =
    pct < 30 ? 'bg-emerald-500' : pct < 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="space-y-1 min-w-[80px] flex-1">
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>Util</span>
        <span className="font-semibold text-foreground">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', fillColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Horizontal payoff progress bar. progress 0–100. */
function PayoffProgressBar({ progress, label = 'Payoff' }: { progress: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/80 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DayOfMonthPicker({
  value,
  onSelect,
}: {
  value: number | null;
  onSelect: (day: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center justify-center gap-1.5 w-full h-10 px-2.5 py-2 rounded-lg text-sm font-semibold transition-colors',
            'bg-muted/30 hover:bg-muted/50 border border-transparent focus-visible:border-primary/25 focus-visible:bg-muted/50',
            'focus:outline-none',
          )}
        >
          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className={value ? 'text-foreground' : 'text-muted-foreground truncate'}>
            {value ? value : '—'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Payment due day (1–31)
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => {
                onSelect(value === day ? null : day);
                setOpen(false);
              }}
              className={cn(
                'h-8 w-8 rounded-md text-sm font-medium transition-colors',
                value === day
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              {day}
            </button>
          ))}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground w-full text-left"
          >
            Clear
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DebtsList({
  debts,
  newDebtId,
  onNewDebtFocused,
  onPopulateDemoDebts,
  onAddDebt,
  onTypeChange,
  onUpdateDebt,
  onDeleteDebt,
  projectedBalances,
}: DebtsListProps) {
  const sortedDebts = sortBy(debts, [
    (debt) => debt.balance.toNumber() * -1,
    'name',
  ]);

  const totalBalance = debts.reduce(
    (sum, debt) => sum.add(debt.balance),
    new Decimal(0),
  );
  const totalMinPayment = debts.reduce(
    (sum, debt) => sum.add(debt.minPayment),
    new Decimal(0),
  );

  // Calculate weighted average rate
  const weightedRateSum = debts.reduce(
    (sum, debt) => sum.add(debt.rate.mul(debt.balance)),
    new Decimal(0),
  );
  const avgRate = totalBalance.greaterThan(0)
    ? weightedRateSum.div(totalBalance).toNumber()
    : 0;

  const getDebtIcon = (debtType: string) => {
    return (
      debtTypeOptions.find((opt) => opt.value === debtType)?.icon || Wallet
    );
  };

  const [isSectionExpanded, setIsSectionExpanded] = useState(true);
  useEffect(() => {
    if (newDebtId) {
      setIsSectionExpanded(true);
    }
  }, [newDebtId]);

  return (
    <div className="min-h-0 lg:min-h-[200px] lg:h-full flex flex-col bg-card/80 rounded-2xl border border-border/60 mb-1 shadow-sm">
      {/* Header: tappable on mobile to collapse/expand */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => setIsSectionExpanded((p) => !p)}
          className="lg:pointer-events-none lg:cursor-default flex items-center gap-2 -mx-2 px-2 py-1 rounded-lg hover:bg-muted/50 lg:hover:bg-transparent transition-colors"
        >
          <h2 className="text-base font-semibold text-foreground">Debts</h2>
          <span className="lg:hidden flex items-center text-muted-foreground">
            {isSectionExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {debts.length === 0 && (
            <Button
              onClick={onPopulateDemoDebts}
              variant="outline"
              size="sm"
              className="h-8 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Populate Demo
            </Button>
          )}
          <Button
            onClick={onAddDebt}
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Debt
          </Button>
        </div>
      </div>

      {/* Debts List + Footer: collapsible on mobile */}
      <div
        className={cn(
          'flex-1 min-h-0 flex flex-col lg:flex lg:flex-col',
          !isSectionExpanded && 'hidden lg:flex',
        )}
      >
      <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-visible p-0 relative lg:overflow-y-auto">
        {debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <p className="text-sm">No debts added yet</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={debts}
            onReorder={() => {}}
            className="flex flex-col p-3 gap-4 lg:gap-3 min-w-0"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {sortedDebts.map((debt, index) => {
                const Icon = getDebtIcon(debt.type);
                const isLastDebt = index === sortedDebts.length - 1;
                const accent = debtTypeAccent[debt.type] ?? debtTypeAccent[DebtType.Other];

                return (
                  <Reorder.Item
                    key={debt.id}
                    value={debt}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    dragListener={false} // Disable manual drag sorting
                    className=""
                  >
                    <Card className={cn('group relative overflow-visible transition-shadow hover:shadow-md border border-slate-200/80 bg-white shadow-sm border-l-4', accent.border)}>
                      <CardContent className="px-3 py-4 sm:px-4">
                        {/* Header: Icon, Name, Actions */}
                        <div className="flex items-center gap-3 mb-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn('h-9 w-9 rounded-lg flex items-center justify-center transition-colors focus:outline-none shrink-0 hover:opacity-90', accent.icon)}
                            title={
                              debtTypeOptions.find(
                                (opt) => opt.value === debt.type,
                              )?.label
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="rounded-xl border-border shadow-lg"
                        >
                          {debtTypeOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() =>
                                onTypeChange(debt.id, option.value)
                              }
                            >
                              <option.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="flex-1 min-w-0">
                        <EditableCell
                          value={debt.name}
                          shouldFocus={debt.id === newDebtId}
                          onFocus={
                            debt.id === newDebtId ? onNewDebtFocused : undefined
                          }
                          onSave={(val) =>
                            onUpdateDebt(debt.id, 'name', val as string)
                          }
                          className="text-base font-semibold text-foreground"
                        />
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl border-border shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => onDeleteDebt(debt.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                            Delete Debt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Primary metrics - equal columns, 2x2 on mobile */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-0 sm:pl-11 min-w-0 overflow-hidden">
                      <div className="min-w-0 overflow-hidden">
                        <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                          Rate (%)
                        </label>
                        <div className="rounded-lg bg-muted/30 px-2.5 py-2 h-10 flex items-center border border-transparent focus-within:border-primary/25 focus-within:bg-muted/50 transition-colors duration-150">
                          <EditableCell
                            value={debt.rate}
                            type="number"
                            onSave={(val) =>
                              onUpdateDebt(debt.id, 'rate', val as number)
                            }
                            className="text-sm font-semibold"
                            embedded
                          />
                        </div>
                        {debt.rate.gt(40) && (
                          <p className="text-[10px] text-destructive mt-0.5">
                            High
                          </p>
                        )}
                      </div>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <div className="min-w-0 overflow-hidden">
                              <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                                Min ($)
                              </label>
                              <div className="rounded-lg bg-muted/30 px-2.5 py-2 h-10 flex items-center border border-transparent focus-within:border-primary/25 focus-within:bg-muted/50 transition-colors duration-150">
                                <EditableCell
                                  value={debt.minPayment}
                                  type="number"
                                  prefix="$"
                                  onSave={(val) =>
                                    onUpdateDebt(
                                      debt.id,
                                      'minPayment',
                                      val as number,
                                    )
                                  }
                                  className="text-sm font-semibold"
                                  embedded
                                />
                              </div>
                              {debt.type === DebtType.Credit && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  Suggested: ≈ $${formatNumber(getSuggestedMinPayment(debt.balance, debt.rate.div(100)).toNumber())}
                                </p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[220px] text-xs p-2.5"
                          >
                            {debt.type === DebtType.Credit ? (
                              <>
                                <p className="font-medium mb-1">Minimum from statement</p>
                                <p className="text-muted-foreground">
                                  Suggested: ≈ $${formatNumber(getSuggestedMinPayment(debt.balance, debt.rate.div(100)).toNumber())}
                                </p>
                              </>
                            ) : (
                              'Minimum monthly payment.'
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div className="min-w-0 overflow-hidden">
                        <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                          Balance ($)
                        </label>
                        <div className="rounded-lg bg-muted/30 px-2.5 py-2 h-10 flex items-center border border-transparent focus-within:border-primary/25 focus-within:bg-muted/50 transition-colors duration-150">
                          <EditableCell
                            value={debt.balance}
                            type="number"
                            prefix="$"
                            onSave={(val) =>
                              onUpdateDebt(debt.id, 'balance', val as number)
                            }
                            className="text-sm font-semibold"
                            embedded
                          />
                        </div>
                        {debt.balance.lt(0) && (
                          <p className="text-[10px] text-destructive mt-0.5">Invalid</p>
                        )}
                        {projectedBalances?.has(debt.id) && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            → ${formatNumber(projectedBalances.get(debt.id)!.toNumber())}
                          </p>
                        )}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                          Due (day)
                        </label>
                        <DayOfMonthPicker
                          value={debt.dueDay ?? null}
                                onSelect={(day) =>
                                  onUpdateDebt(
                                    debt.id,
                                    'dueDay',
                                    day ?? '',
                                  )
                                }
                        />
                      </div>
                    </div>
                    {debt.type === DebtType.Credit && (
                      <div className="pt-3 mt-3 border-t border-border/60 pl-0 sm:pl-11 flex items-end gap-4 min-w-0 overflow-hidden">
                        <div className="min-w-0 overflow-hidden">
                          <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                            Limit ($)
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
                        {debt.limit && debt.limit.gt(0) && (
                          <UtilizationProgressBar
                            percent={debt.balance.div(debt.limit).mul(100).toNumber()}
                          />
                        )}
                      </div>
                    )}
                    {debt.balance.gt(0) && (
                      <div className="pt-3 mt-3 border-t border-border/60 pl-0 sm:pl-11">
                        <PayoffProgressBar
                          progress={
                            (() => {
                              const startBalance = debt.balance;
                              const currentBalance =
                                projectedBalances?.get(debt.id) ?? startBalance;
                              if (startBalance.lte(0)) return 0;
                              if (currentBalance.lte(0)) return 100;
                              const paid = startBalance.minus(currentBalance);
                              return paid.div(startBalance).mul(100).toNumber();
                            })()
                          }
                          label="Payoff progress"
                        />
                      </div>
                    )}
                      </CardContent>
                    </Card>
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Totals Footer */}
      {debts.length > 0 && (
        <div className="bg-card border-t border-border p-4 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">Total</span>
            <div className="flex gap-6">
              <RateDisplay label="Avg Rate" rate={avgRate} />
              <TotalDisplay
                label="Min Payment"
                amount={totalMinPayment.toNumber()}
              />
              <TotalDisplay label="Balance" amount={totalBalance.toNumber()} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
