import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScenarioResultPanel } from '../src/components/ScenarioResultPanel';
import type { ScenarioResult } from '../src/types';

const baseResult: ScenarioResult = {
  summary: {
    totalUsageKWh: 100,
    averageUsageKWh: 100,
    peakHour: 14,
    peakUsageKWh: 100,
    lowestHour: 14,
    lowestUsageKWh: 100,
    rowCount: 1,
    dayCount: 1,
    byHourMode: 'sum',
    regionLabel: 'A',
    byHour: [{ hour: 14, usageKWh: 100 }]
  },
  reducedUsageKWh: 100,
  supplyKWh: 200,
  sourceBreakdown: {
    solarKWh: 200,
    hydrogenKWh: 0,
    nuclearKWh: 0,
    essKWh: 0
  },
  selfSufficiencyRate: 200,
  surplusKWh: 100,
  isSurplus: true,
  stabilityScore: 60,
  diversityScore: 40,
  environmentalScore: 70,
  realismScore: 55,
  estimatedAvoidedEmissionKg: 45,
  studentWarnings: []
};

describe('ScenarioResultPanel', () => {
  it('shows 100% achieved and surplus guidance instead of a rate over 100%', () => {
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult }));

    expect(html).toContain('100% 달성');
    expect(html).toContain('잉여 전력 100 kWh');
    expect(html).toContain('이웃 지역과 나누는 방법');
    expect(html).not.toContain('200%');
  });

  it('shows the raw rate when there is no surplus', () => {
    const html = renderToStaticMarkup(
      createElement(ScenarioResultPanel, {
        result: {
          ...baseResult,
          selfSufficiencyRate: 75,
          surplusKWh: 0,
          isSurplus: false,
          supplyKWh: 75
        }
      })
    );

    expect(html).toContain('75%');
    expect(html).not.toContain('잉여 전력');
  });
});
