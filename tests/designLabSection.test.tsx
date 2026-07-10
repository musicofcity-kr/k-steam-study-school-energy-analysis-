import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DesignLabSection } from '../src/components/DesignLabSection';
import { TeacherSettingsPanel } from '../src/components/TeacherSettingsPanel';
import type { EnergyScenario, ScenarioResult, TeacherAssumptions } from '../src/types';

const scenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenFuelCellLevel: 20,
  savingRate: 15,
  smartControlLevel: 35
} as EnergyScenario;

const assumptions = {
  solarMaxKWhPerActiveHour: 50,
  hydrogenMaxKWhPerHour: 37.5,
  essMaxCapacityKWh: 120,
  essMaxChargeKWhPerHour: 30,
  essMaxDischargeKWhPerHour: 30,
  essRoundTripEfficiency: 0.9,
  savingMaxRate: 50,
  smartControlMaxPeakSavingRate: 10,
  gridEmissionFactor: 0.45,
  solarActiveStartHour: 7,
  solarActiveEndHour: 18,
  hydrogenSource: 'unspecified'
} as TeacherAssumptions;

const result = {
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
  hourlyBalance: [],
  supplyKWh: 82,
  sourceBreakdown: {
    solarGeneratedKWh: 110,
    hydrogenGeneratedKWh: 20,
    directLocalUseKWh: 82,
    essChargeKWh: 28,
    essDischargeKWh: 18,
    essEndStateOfChargeKWh: 10
  },
  localSupplyRate: 82,
  surplusKWh: 0,
  gridImportKWh: 18,
  nightGridDependent: true,
  peakGridImportKWh: 9,
  isSurplus: false,
  stabilityScore: 60,
  diversityScore: 40,
  environmentalScore: 70,
  realismScore: 55,
  estimatedAvoidedEmissionKg: 45,
  studentWarnings: []
} as ScenarioResult;

describe('DesignLabSection', () => {
  it('renders the five accessible controls without a nuclear control', () => {
    const html = renderDesignLab();

    expect(html.match(/type="range"/g)).toHaveLength(5);
    expect(html).toContain('aria-label="학교 지붕·주차장 태양광 비율"');
    expect(html).toContain('aria-label="ESS (전기 저장소) 용량 비율"');
    expect(html).toContain('aria-label="조건부 수소 연료전지 비율"');
    expect(html).toContain('aria-label="에너지 절감 비율"');
    expect(html).toContain('aria-label="스마트 에너지 관리 비율"');
    expect(html).not.toContain('차세대 원자력');
  });

  it('shows the future-school flow, external grid, conditional hydrogen, and ESS charge', () => {
    const html = renderDesignLab();

    expect(html).toContain('미래학교 에너지 시스템');
    expect(html).toContain('스마트 관리');
    expect(html).toContain('낮 충전');
    expect(html).toContain('필요할 때 방전');
    expect(html).toContain('외부 전력망 연결');
    expect(html).toContain('구역 가장자리');
    expect(html).toContain('조건부 수소 연료전지');
    expect(html).toContain('설계 20% · 생산·입지 확인');
    expect(html).toContain('잔량 10 kWh');
  });

  it('renders controlled A/B save, load, and final-selection state', () => {
    const html = renderDesignLab();

    expect(html).toContain('설계안 A/B');
    expect(html).toContain('aria-label="현재 설정을 설계안 A에 저장"');
    expect(html).toContain('aria-label="저장된 설계안 A 불러오기"');
    expect(html).toContain('aria-label="설계안 A를 최종 설계로 선택"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('A 최종 선택됨');
    expect(html).toContain('설계안 B</strong> · 비어 있음');
  });

  it('locks design controls until the data mission is complete', () => {
    const html = renderDesignLab(true);

    expect(html).not.toContain('type="range"');
    expect(html).toContain('미션 3에서 데이터와 피크 원인을 먼저 확인하세요.');
    expect(html).not.toContain('현재 설정을 설계안 A에 저장');
  });
});

describe('TeacherSettingsPanel', () => {
  it('renders only the new assumptions and marks every label as a classroom assumption', () => {
    const html = renderToStaticMarkup(
      createElement(TeacherSettingsPanel, {
        assumptions,
        onAssumptionsChange: () => undefined
      })
    );

    expect(html.match(/aria-label="[^"]*수업용 가정값/g)).toHaveLength(12);
    expect(html).toContain('태양광 활동 시간 100% 설치 시 공급량');
    expect(html).toContain('조건부 수소 연료전지 100% 공급량');
    expect(html).toContain('ESS 최대 저장 용량');
    expect(html).toContain('ESS 시간당 최대 충전량');
    expect(html).toContain('ESS 시간당 최대 방전량');
    expect(html).toContain('ESS 왕복 효율');
    expect(html).toContain('에너지 절감 최대 비율');
    expect(html).toContain('스마트 관리 최대 피크 추가 절감률');
    expect(html).toContain('전력망 배출계수');
    expect(html).toContain('수소 생산 방식');
    expect(html).not.toContain('차세대 원자력');
  });
});

function renderDesignLab(locked = false): string {
  return renderToStaticMarkup(
    createElement(DesignLabSection, {
      scenario,
      assumptions,
      result,
      savedScenarios: { A: scenario },
      selectedScenarioId: 'A',
      locked,
      onScenarioChange: () => undefined,
      onSaveScenario: () => undefined,
      onLoadScenario: () => undefined,
      onSelectScenario: () => undefined
    })
  );
}
