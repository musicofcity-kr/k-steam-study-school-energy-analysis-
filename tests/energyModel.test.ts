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
  solarMaxKWhPerHour: 75,
  hydrogenMaxKWhPerHour: 100,
  nuclearMaxKWhPerHour: 125,
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
    expect(summary.dayCount).toBe(1);
    expect(summary.byHourMode).toBe('sum');
  });

  it('averages by hour when data spans multiple dates', () => {
    const multiDayRows: EnergyUsageRow[] = [
      { date: '2026-07-01', hour: 9, usageKWh: 120 },
      { date: '2026-07-01', hour: 14, usageKWh: 300 },
      { date: '2026-07-02', hour: 9, usageKWh: 100 },
      { date: '2026-07-02', hour: 14, usageKWh: 240 },
      { date: '2026-07-03', hour: 9, usageKWh: 80 },
      { date: '2026-07-03', hour: 14, usageKWh: 180 }
    ];

    const summary = calculateUsageSummary(multiDayRows);

    expect(summary.dayCount).toBe(3);
    expect(summary.byHourMode).toBe('average');
    expect(summary.byHour).toEqual([
      { hour: 9, usageKWh: 100 },
      { hour: 14, usageKWh: 240 }
    ]);
    expect(summary.peakHour).toBe(14);
    expect(summary.peakUsageKWh).toBe(240);
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

  it('keeps self-sufficiency stable when the same daily pattern is repeated for 30 days', () => {
    const oneDay = Array.from({ length: 24 }, (_, hour) => ({
      date: '2026-07-01',
      hour,
      usageKWh: 100
    }));
    const thirtyDays = Array.from({ length: 30 }, (_, dayIndex) =>
      oneDay.map((row) => ({
        ...row,
        date: `2026-07-${String(dayIndex + 1).padStart(2, '0')}`
      }))
    ).flat();
    const hourlyAssumptions: TeacherAssumptions = {
      solarMaxKWhPerHour: 50,
      hydrogenMaxKWhPerHour: 25,
      nuclearMaxKWhPerHour: 0,
      savingMaxRate: 50,
      gridEmissionFactor: 0.45
    };
    const fullSupplyScenario: EnergyScenario = {
      solarLevel: 100,
      essLevel: 0,
      hydrogenLevel: 100,
      nuclearLevel: 0,
      savingRate: 0
    };

    const oneDayResult = calculateScenarioResult(oneDay, fullSupplyScenario, hourlyAssumptions);
    const thirtyDayResult = calculateScenarioResult(thirtyDays, fullSupplyScenario, hourlyAssumptions);

    expect(Math.abs(oneDayResult.selfSufficiencyRate - thirtyDayResult.selfSufficiencyRate)).toBeLessThanOrEqual(1);
  });

  it('reports surplus energy without changing the raw self-sufficiency calculation', () => {
    const result = calculateScenarioResult(
      [{ date: '2026-07-01', hour: 12, usageKWh: 100 }],
      { solarLevel: 100, essLevel: 0, hydrogenLevel: 100, nuclearLevel: 0, savingRate: 0 },
      {
        solarMaxKWhPerHour: 120,
        hydrogenMaxKWhPerHour: 80,
        nuclearMaxKWhPerHour: 0,
        savingMaxRate: 50,
        gridEmissionFactor: 0.45
      }
    );

    expect(result.selfSufficiencyRate).toBe(200);
    expect(result.isSurplus).toBe(true);
    expect(result.surplusKWh).toBe(100);
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

  it('returns zero diversity when no energy strategy is active', () => {
    expect(
      calculateDiversityScore({
        solarLevel: 0,
        essLevel: 0,
        hydrogenLevel: 0,
        nuclearLevel: 0,
        savingRate: 0
      })
    ).toBe(0);
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
