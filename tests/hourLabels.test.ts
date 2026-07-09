import { describe, expect, it } from 'vitest';
import { formatHourRanges, formatLowestHourLabel } from '../src/utils/hourLabels';
import type { UsageSummary } from '../src/types';

const summary = {
  lowestHour: 1,
  lowestUsageKWh: 14,
  byHour: [
    { hour: 0, usageKWh: 16 },
    { hour: 1, usageKWh: 14 },
    { hour: 2, usageKWh: 14 },
    { hour: 3, usageKWh: 14 },
    { hour: 4, usageKWh: 14 },
    { hour: 5, usageKWh: 16 }
  ]
} as UsageSummary;

describe('hour label formatting', () => {
  it('formats consecutive tied hours as a range', () => {
    expect(formatHourRanges([1, 2, 3, 4])).toBe('1~4시');
  });

  it('formats separate tied hours as comma-separated hour labels', () => {
    expect(formatHourRanges([1, 3, 4])).toBe('1시, 3~4시');
  });

  it('shows all lowest tied hours in the summary label', () => {
    expect(formatLowestHourLabel(summary)).toBe('1~4시');
  });
});
