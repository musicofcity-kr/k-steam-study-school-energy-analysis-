import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScenarioResultPanel } from '../src/components/ScenarioResultPanel';
import type { EnergyScenario, ScenarioResult } from '../src/types';

const baseScenario: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenLevel: 20,
  nuclearLevel: 5,
  savingRate: 15
};

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
  gridImportKWh: 0,
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
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult, scenario: baseScenario }));

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
          gridImportKWh: 25,
          isSurplus: false,
          supplyKWh: 75
        },
        scenario: baseScenario
      })
    );

    expect(html).toContain('75%');
    expect(html).toContain('외부 전력망에서 가져오는 전기: 25 kWh');
    expect(html).toContain('<dt>잉여 전력</dt><dd>없음</dd>');
    expect(html).not.toContain('잉여 전력 100 kWh');
  });

  it('renders worksheet values in the same order as mission 4', () => {
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult, scenario: baseScenario }));

    expect(html).toContain('활동지에 적을 값');
    expect(html.indexOf('태양광 %')).toBeLessThan(html.indexOf('ESS %'));
    expect(html.indexOf('ESS %')).toBeLessThan(html.indexOf('수소 %'));
    expect(html.indexOf('수소 %')).toBeLessThan(html.indexOf('차세대 원자력 %'));
    expect(html.indexOf('차세대 원자력 %')).toBeLessThan(html.indexOf('에너지 절감 %'));
  });
});
