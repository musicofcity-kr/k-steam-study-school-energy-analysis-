import { describe, expect, it } from 'vitest';
import { buildReportDraft, buildReportJson } from '../src/utils/reportBuilder';
import { calculateScenarioResult } from '../src/utils/energyModel';
import type { EnergyScenario, EnergyUsageRow, TeacherAssumptions } from '../src/types';

const rows: EnergyUsageRow[] = [
  { date: 'practice', hour: 8, region: 'practice_area', usageKWh: 90 },
  { date: 'practice', hour: 13, region: 'practice_area', usageKWh: 220 }
];

const scenario: EnergyScenario = {
  solarLevel: 70,
  essLevel: 60,
  hydrogenLevel: 30,
  nuclearLevel: 0,
  savingRate: 20
};

const assumptions: TeacherAssumptions = {
  solarMaxKWhPerHour: 150,
  hydrogenMaxKWhPerHour: 200,
  nuclearMaxKWhPerHour: 250,
  savingMaxRate: 50,
  gridEmissionFactor: 0.45,
  solarActiveStartHour: 7,
  solarActiveEndHour: 18
};

describe('reportBuilder', () => {
  it('builds an editable one-minute report draft from scenario results', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);
    const draft = buildReportDraft({
      teamName: '태양팀',
      cityName: '솔라스쿨시티',
      dataSource: '수업 연습용 예시 데이터',
      scenario,
      result,
      keyStrategies: ['낮 시간 태양광 활용', 'ESS로 피크 시간 대응', '에너지 절감 먼저 실천']
    });

    expect(draft).toContain('태양팀');
    expect(draft).toContain('솔라스쿨시티');
    expect(draft).toContain('13시');
    expect(draft).toContain('낮 시간 태양광 활용');
    expect(draft).toContain('더 조사해야 할 점');
  });

  it('builds serializable JSON report data', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);
    const json = buildReportJson({
      teamName: '태양팀',
      cityName: '솔라스쿨시티',
      dataSource: '수업 연습용 예시 데이터',
      scenario,
      result,
      keyStrategies: ['태양광', 'ESS', '절감']
    });

    expect(json.teamName).toBe('태양팀');
    expect(json.scenario.solarLevel).toBe(70);
    expect(json.result.selfSufficiencyRate).toBeGreaterThan(0);
  });

  it('adds a surplus discussion prompt when supply exceeds reduced usage', () => {
    const result = calculateScenarioResult(
      rows,
      { ...scenario, solarLevel: 100, hydrogenLevel: 100, savingRate: 0 },
      assumptions
    );
    const draft = buildReportDraft({
      teamName: '태양팀',
      cityName: '솔라스쿨시티',
      dataSource: '수업 연습용 예시 데이터',
      scenario,
      result,
      keyStrategies: ['태양광', '수소', '나눔']
    });

    expect(result.isSurplus).toBe(true);
    expect(draft).toContain('잉여 전력');
    expect(draft).toContain('저장하거나 이웃 지역과 나누는 방법');
  });

  it('adds the external grid sentence when supply is below reduced usage', () => {
    const result = calculateScenarioResult(
      rows,
      { solarLevel: 0, essLevel: 20, hydrogenLevel: 0, nuclearLevel: 0, savingRate: 0 },
      assumptions
    );
    const draft = buildReportDraft({
      teamName: '전력망팀',
      cityName: '그리드시티',
      dataSource: '수업용 가정 데이터',
      scenario,
      result,
      keyStrategies: ['절감', '저장', '전력망']
    });

    expect(result.gridImportKWh).toBeGreaterThan(0);
    expect(draft).toContain('부족한 전기는 외부 전력망에서 가져옵니다');
    expect(draft).toContain('현실 도시도 대부분 전력망과 연결되어 있어요');
  });
});
