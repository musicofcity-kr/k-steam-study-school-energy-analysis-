import { describe, expect, it } from 'vitest';
import {
  buildStudentExplanation,
  calculateDiversityScore,
  calculateScenarioResult,
  calculateStabilityScore,
  calculateUsageSummary
} from '../src/utils/energyModel';
import type { EnergyScenario, EnergyUsageRow, TeacherAssumptions } from '../src/types';

const rows: EnergyUsageRow[] = [
  { date: 'practice', hour: 9, region: 'practice_area', usageKWh: 100 },
  { date: 'practice', hour: 12, region: 'practice_area', usageKWh: 160 },
  { date: 'practice', hour: 14, region: 'practice_area', usageKWh: 240 },
  { date: 'practice', hour: 18, region: 'practice_area', usageKWh: 100 }
];

const scenario: EnergyScenario = {
  solarLevel: 50,
  essLevel: 80,
  hydrogenLevel: 20,
  nuclearLevel: 10,
  savingRate: 10
};

const assumptions: TeacherAssumptions = {
  solarMaxKWh: 300,
  hydrogenMaxKWh: 400,
  nuclearMaxKWh: 500,
  savingMaxRate: 50,
  gridEmissionFactor: 0.45
};

describe('calculateUsageSummary', () => {
  it('summarizes total, average, peak hour, and low-use hour', () => {
    const summary = calculateUsageSummary(rows);

    expect(summary.totalUsageKWh).toBe(600);
    expect(summary.averageUsageKWh).toBe(150);
    expect(summary.peakHour).toBe(14);
    expect(summary.peakUsageKWh).toBe(240);
    expect(summary.lowestHour).toBe(9);
  });
});

describe('calculateScenarioResult', () => {
  it('calculates self-sufficiency without counting ESS as generation', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);

    expect(result.reducedUsageKWh).toBe(540);
    expect(result.supplyKWh).toBe(280);
    expect(result.sourceBreakdown.essKWh).toBe(0);
    expect(result.selfSufficiencyRate).toBeCloseTo(51.9, 1);
    expect(result.stabilityScore).toBeGreaterThan(60);
  });

  it('returns zeroed safe values for empty data', () => {
    const result = calculateScenarioResult([], scenario, assumptions);

    expect(result.selfSufficiencyRate).toBe(0);
    expect(result.reducedUsageKWh).toBe(0);
    expect(result.studentWarnings).toContain('전력 사용 데이터가 아직 없습니다.');
  });

  it('clamps teacher saving assumptions so reduced usage never becomes negative', () => {
    const result = calculateScenarioResult(
      rows,
      { ...scenario, savingRate: 150 },
      { ...assumptions, savingMaxRate: 150 }
    );

    expect(result.reducedUsageKWh).toBe(0);
    expect(result.selfSufficiencyRate).toBe(0);
  });
});

describe('scenario scores and explanation', () => {
  it('scores diverse scenarios higher than one-source scenarios', () => {
    const diverse = calculateDiversityScore(scenario);
    const oneSource = calculateDiversityScore({
      solarLevel: 100,
      essLevel: 0,
      hydrogenLevel: 0,
      nuclearLevel: 0,
      savingRate: 0
    });

    expect(diverse).toBeGreaterThan(oneSource);
  });

  it('uses ESS in stability score but not as a generator', () => {
    const withEss = calculateStabilityScore({ ...scenario, essLevel: 100 });
    const withoutEss = calculateStabilityScore({ ...scenario, essLevel: 0 });

    expect(withEss).toBeGreaterThan(withoutEss);
  });

  it('builds middle-school friendly explanation sentences', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);
    const explanation = buildStudentExplanation(result);

    expect(explanation).toContain('14시');
    expect(explanation).toContain('태양광');
    expect(explanation).toContain('ESS');
    expect(explanation).toContain('수업용 비교 지표');
  });
});
