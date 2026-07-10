import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ScenarioResultPanel } from '../src/components/ScenarioResultPanel';
import type { EnergyScenario, ScenarioResult } from '../src/types';

const baseScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenFuelCellLevel: 20,
  savingRate: 15,
  smartControlLevel: 35
} as EnergyScenario;

const baseResult = {
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
  supplyKWh: 120,
  sourceBreakdown: {
    solarGeneratedKWh: 110,
    hydrogenGeneratedKWh: 20,
    directLocalUseKWh: 82,
    essChargeKWh: 28,
    essDischargeKWh: 18,
    essEndStateOfChargeKWh: 10
  },
  localSupplyRate: 100,
  surplusKWh: 12,
  gridImportKWh: 0,
  nightGridDependent: false,
  peakGridImportKWh: 4,
  stabilityScore: 60,
  diversityScore: 40,
  environmentalScore: 70,
  realismScore: 55,
  estimatedAvoidedEmissionKg: 45,
  studentWarnings: []
} as unknown as ScenarioResult;

describe('ScenarioResultPanel', () => {
  it('shows only the three priority indicators before detailed scores', () => {
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult, scenario: baseScenario }));
    const primaryContent = html.slice(0, html.indexOf('상세 비교 보기'));

    expect(primaryContent.indexOf('지역 에너지 충당률')).toBeLessThan(primaryContent.indexOf('외부 전력망 사용량'));
    expect(primaryContent.indexOf('외부 전력망 사용량')).toBeLessThan(primaryContent.indexOf('피크 대응 정도'));
    expect(primaryContent).not.toContain('다양성 점수');
    expect(primaryContent).not.toContain('환경성 점수');
    expect(primaryContent).not.toContain('현실성 점수');
  });

  it('puts comparison scores and the hourly-balance totals in details', () => {
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult, scenario: baseScenario }));

    expect(html).toContain('상세 비교 보기');
    expect(html).toContain('다양성 점수');
    expect(html).toContain('환경성 점수');
    expect(html).toContain('현실성 점수');
    expect(html).toContain('에너지 수지 보기');
    expect(html).toContain('<dt>태양광 생산량</dt><dd>110 kWh</dd>');
    expect(html).toContain('<dt>ESS 충전량</dt><dd>28 kWh</dd>');
    expect(html).toContain('<dt>ESS 방전량</dt><dd>18 kWh</dd>');
    expect(html).toContain('<dt>밤 시간 외부 전력 의존</dt><dd>없음</dd>');
  });

  it('shows external-grid use without treating it as a failed design', () => {
    const html = renderToStaticMarkup(
      createElement(ScenarioResultPanel, {
        result: {
          ...baseResult,
          localSupplyRate: 75,
          surplusKWh: 0,
          gridImportKWh: 25,
          nightGridDependent: true,
          peakGridImportKWh: 12
        },
        scenario: baseScenario
      })
    );

    expect(html).toContain('지역 에너지 충당률 75%');
    expect(html).toContain('외부 전력망 사용량: 25 kWh');
    expect(html).toContain('전력망 연결은 부족분을 보충하는 정상적인 시스템입니다.');
    expect(html).toContain('<dt>밤 시간 외부 전력 의존</dt><dd>있음</dd>');
    expect(html).not.toContain('잉여 전력 12 kWh');
  });

  it('renders worksheet controls in the mission 4 order without nuclear', () => {
    const html = renderToStaticMarkup(createElement(ScenarioResultPanel, { result: baseResult, scenario: baseScenario }));

    expect(html).toContain('활동지에 적을 값');
    expect(html.indexOf('태양광 %')).toBeLessThan(html.indexOf('ESS (전기 저장소) %'));
    expect(html.indexOf('ESS (전기 저장소) %')).toBeLessThan(html.indexOf('조건부 수소 연료전지 %'));
    expect(html.indexOf('조건부 수소 연료전지 %')).toBeLessThan(html.indexOf('에너지 절감 %'));
    expect(html.indexOf('에너지 절감 %')).toBeLessThan(html.indexOf('스마트 에너지 관리 %'));
    expect(html).not.toContain('차세대 원자력');
  });
});
