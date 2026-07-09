import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EnergyChart } from '../src/components/EnergyChart';
import type { UsageSummary } from '../src/types';

const summary: UsageSummary = {
  totalUsageKWh: 900,
  averageUsageKWh: 37.5,
  peakHour: 14,
  peakUsageKWh: 67,
  lowestHour: 1,
  lowestUsageKWh: 14,
  rowCount: 24,
  dayCount: 1,
  byHourMode: 'sum',
  regionLabel: '일반 중학교(수업용 가정)',
  byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, usageKWh: hour === 14 ? 67 : 20 }))
};

describe('EnergyChart solar active overlay copy', () => {
  it('shows the solar active hour caption when solar is above 0%', () => {
    const html = renderToStaticMarkup(
      createElement(EnergyChart, {
        summary,
        peakConfirmed: false,
        solarLevel: 1,
        solarActiveStartHour: 7,
        solarActiveEndHour: 18,
        onPeakConfirmed: () => undefined
      })
    );

    expect(html).toContain('태양광이 일하는 시간(수업용 단순화)');
    expect(html).toContain('밤에는 ESS와 다른 에너지가 필요해요');
  });

  it('hides the solar active hour caption when solar is 0%', () => {
    const html = renderToStaticMarkup(
      createElement(EnergyChart, {
        summary,
        peakConfirmed: false,
        solarLevel: 0,
        solarActiveStartHour: 7,
        solarActiveEndHour: 18,
        onPeakConfirmed: () => undefined
      })
    );

    expect(html).not.toContain('태양광이 일하는 시간(수업용 단순화)');
  });
});
