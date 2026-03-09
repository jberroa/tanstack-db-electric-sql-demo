import { Card, CardContent } from '@/components/ui/card';
import Decimal from 'decimal.js';
import { useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

/** Tooltip formatter for currency values */
function tooltipFormatter(
  value: number,
  name: string,
  item: { payload?: { fill?: string }; color?: string },
) {
  const fill = item?.color ?? item?.payload?.fill;
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      {fill && (
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
          style={{ backgroundColor: fill }}
        />
      )}
      <div className="flex flex-1 justify-between items-center gap-2">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono font-medium text-foreground tabular-nums">
          {formatCurrency(value)}
        </span>
      </div>
    </div>
  );
}

import { DebtType } from '@/lib/universal/types';

const DEBT_TYPE_LABELS: Record<string, string> = {
  [DebtType.Auto]: 'Auto',
  [DebtType.Home]: 'Home',
  [DebtType.Credit]: 'Credit Card',
  [DebtType.School]: 'School',
  [DebtType.Personal]: 'Personal Loan',
  [DebtType.Other]: 'Other',
};

/** Chart config for category donut - uses category CSS variables */
const CATEGORY_CHART_CONFIG = {
  [DebtType.Auto]: { label: DEBT_TYPE_LABELS[DebtType.Auto], color: 'var(--category-auto)' },
  [DebtType.Home]: { label: DEBT_TYPE_LABELS[DebtType.Home], color: 'var(--category-home)' },
  [DebtType.Credit]: { label: DEBT_TYPE_LABELS[DebtType.Credit], color: 'var(--category-credit)' },
  [DebtType.School]: { label: DEBT_TYPE_LABELS[DebtType.School], color: 'var(--category-school)' },
  [DebtType.Personal]: { label: DEBT_TYPE_LABELS[DebtType.Personal], color: 'var(--category-personal)' },
  [DebtType.Other]: { label: DEBT_TYPE_LABELS[DebtType.Other], color: 'var(--category-other)' },
} satisfies ChartConfig;

/** Fallback palette for by-debt chart */
const DEBT_PALETTE = [
  'var(--category-credit)',
  'var(--category-auto)',
  'var(--category-school)',
  'var(--category-home)',
  'var(--category-personal)',
  'var(--category-other)',
  'var(--chart-4)',
  'var(--chart-5)',
];

interface WorkbookDebt {
  id: string;
  name: string;
  type: string;
  balance: Decimal;
}

interface BalanceChartsProps {
  debts: WorkbookDebt[];
}

function formatCurrency(v: number) {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

export function BalanceCharts({ debts }: BalanceChartsProps) {
  const totalBalance = debts.reduce(
    (sum, d) => sum.add(d.balance),
    new Decimal(0),
  );
  const totalNum = totalBalance.toNumber();

  const byCategory = useMemo(() => {
    const grouped = debts
      .filter((d) => d.balance.gt(0))
      .reduce(
        (acc, d) => {
          const t = d.type || DebtType.Other;
          if (!acc[t]) acc[t] = new Decimal(0);
          acc[t] = acc[t].add(d.balance);
          return acc;
        },
        {} as Record<string, Decimal>,
      );

    return Object.entries(grouped)
      .map(([type, sum]) => ({
        category: type,
        name: DEBT_TYPE_LABELS[type] ?? type,
        value: sum.toNumber(),
        fill: `var(--color-${type})`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [debts]);

  const byDebt = useMemo(() => {
    const items = debts
      .filter((d) => d.balance.gt(0))
      .map((d, i) => ({
        key: d.id,
        name: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
        value: d.balance.toNumber(),
        fill:
          (CATEGORY_CHART_CONFIG as Record<string, { color: string }>)[d.type]?.color ??
          DEBT_PALETTE[i % DEBT_PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);

    return items;
  }, [debts]);

  const debtChartConfig = useMemo((): ChartConfig => {
    const config: ChartConfig = {};
    byDebt.forEach((item) => {
      config[item.key] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [byDebt]);

  if (debts.length === 0 || totalNum <= 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="border border-border/50 bg-card/50 rounded-xl overflow-hidden shadow-sm min-w-0">
        <CardContent className="px-4 sm:px-5 pt-4 sm:pt-5 pb-5 flex flex-col min-h-[140px] sm:min-h-[160px]">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Balance by category
          </h3>
          <div className="relative flex-1 min-h-[120px] pt-1 pb-2 flex flex-col items-center min-w-0">
            {byCategory.length > 0 && (
              <ChartContainer
                config={CATEGORY_CHART_CONFIG}
                className="mx-auto aspect-square w-full max-w-[180px] sm:max-w-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) =>
                          tooltipFormatter(value as number, name as string, item)
                        }
                      />
                    }
                  />
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={4}
                    stroke="var(--card)"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-lg font-bold"
                              >
                                {formatCurrency(totalNum)}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 gap-2">
              {byCategory.map((entry) => (
                <div key={entry.category} className="flex items-center gap-1.5">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-card/50 rounded-xl overflow-hidden shadow-sm min-w-0">
        <CardContent className="px-4 sm:px-5 pt-4 sm:pt-5 pb-5 flex flex-col min-h-[140px] sm:min-h-[160px]">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Balance by debt
          </h3>
          <div className="relative flex-1 min-h-[120px] pt-1 pb-2 flex flex-col items-center min-w-0">
            {byDebt.length > 0 && (
              <ChartContainer
                config={debtChartConfig}
                className="mx-auto aspect-square w-full max-w-[180px] sm:max-w-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, item) =>
                          tooltipFormatter(value as number, name as string, item)
                        }
                      />
                    }
                  />
                  <Pie
                    data={byDebt.map((d) => ({ ...d, fill: `var(--color-${d.key})` }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={4}
                    stroke="var(--card)"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-lg font-bold"
                              >
                                {formatCurrency(totalNum)}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 gap-2">
              {byDebt.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5">
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
