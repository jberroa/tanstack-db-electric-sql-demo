import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import {
  getInstallmentPayoffProgress,
  getPlanPayoffProgress,
} from './payoff-utils';

describe('getInstallmentPayoffProgress', () => {
  it('returns percent paid of original total', () => {
    expect(
      getInstallmentPayoffProgress(
        new Decimal(20000),
        new Decimal(15000),
      ),
    ).toBeCloseTo(25);
  });

  it('returns 100 when balance is zero or negative', () => {
    expect(
      getInstallmentPayoffProgress(new Decimal(10000), new Decimal(0)),
    ).toBe(100);
    expect(
      getInstallmentPayoffProgress(new Decimal(10000), new Decimal(-1)),
    ).toBe(100);
  });

  it('returns 0 when balance exceeds total', () => {
    expect(
      getInstallmentPayoffProgress(
        new Decimal(10000),
        new Decimal(12000),
      ),
    ).toBe(0);
  });

  it('returns null when total is missing or not positive', () => {
    expect(
      getInstallmentPayoffProgress(null, new Decimal(5000)),
    ).toBeNull();
    expect(
      getInstallmentPayoffProgress(new Decimal(0), new Decimal(5000)),
    ).toBeNull();
  });
});

describe('getPlanPayoffProgress', () => {
  it('measures plan progress from start vs projected', () => {
    expect(
      getPlanPayoffProgress(new Decimal(10000), new Decimal(7500)),
    ).toBeCloseTo(25);
  });

  it('returns 0 when start balance is not positive', () => {
    expect(
      getPlanPayoffProgress(new Decimal(0), new Decimal(0)),
    ).toBe(0);
  });
});
