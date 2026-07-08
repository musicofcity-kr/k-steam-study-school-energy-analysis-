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
  solarMaxKWh: 300,
  hydrogenMaxKWh: 400,
  nuclearMaxKWh: 500,
  savingMaxRate: 50,
  gridEmissionFactor: 0.45
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
});
