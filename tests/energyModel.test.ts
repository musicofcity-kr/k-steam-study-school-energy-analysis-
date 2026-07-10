import { describe, expect, it } from 'vitest';
import {
  buildStudentExplanation,
  calculateDiversityScore,
  calculateScenarioResult,
  calculateStabilityScore,
  calculateUsageSummary,
  isSolarActiveHour,
  simulateHourlyEnergyBalance
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
  hydrogenFuelCellLevel: 20,
  savingRate: 10,
  smartControlLevel: 50
};

const assumptions: TeacherAssumptions = {
  solarMaxKWhPerActiveHour: 75,
  hydrogenMaxKWhPerHour: 100,
  essMaxCapacityKWh: 200,
  essMaxChargeKWhPerHour: 100,
  essMaxDischargeKWhPerHour: 80,
  essRoundTripEfficiency: 0.8,
  savingMaxRate: 50,
  smartControlMaxPeakSavingRate: 20,
  gridEmissionFactor: 0.45,
  solarActiveStartHour: 7,
  solarActiveEndHour: 18,
  hydrogenSource: 'unspecified'
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

  it('selects peak and lowest hours before display rounding', () => {
    const summary = calculateUsageSummary([
      { hour: 9, usageKWh: 10.04 },
      { hour: 14, usageKWh: 10.049 }
    ]);

    expect(summary.byHour).toEqual([
      { hour: 9, usageKWh: 10 },
      { hour: 14, usageKWh: 10 }
    ]);
    expect(summary.peakHour).toBe(14);
    expect(summary.lowestHour).toBe(9);
  });
});

describe('simulateHourlyEnergyBalance', () => {
  it('generates solar only inside the inclusive active-hour boundaries', () => {
    const balances = simulateHourlyEnergyBalance(
      [6, 7, 18, 19].map((hour) => ({ hour, usageKWh: 100 })),
      { ...scenario, solarLevel: 100, essLevel: 0, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, solarMaxKWhPerActiveHour: 50 }
    );

    expect(balances.map((balance) => balance.solarGeneratedKWh)).toEqual([0, 50, 50, 0]);
    expect(isSolarActiveHour(7, 7, 18)).toBe(true);
    expect(isSolarActiveHour(18, 7, 18)).toBe(true);
    expect(isSolarActiveHour(19, 7, 18)).toBe(false);
    expect(isSolarActiveHour(23, 19, 6)).toBe(false);
  });

  it('charges ESS from solar surplus, applies efficiency, then discharges within all limits', () => {
    const balances = simulateHourlyEnergyBalance(
      [
        { date: '2026-07-01', hour: 12, usageKWh: 20 },
        { date: '2026-07-01', hour: 22, usageKWh: 100 }
      ],
      { solarLevel: 100, essLevel: 100, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      {
        ...assumptions,
        solarMaxKWhPerActiveHour: 100,
        essMaxCapacityKWh: 50,
        essMaxChargeKWhPerHour: 40,
        essMaxDischargeKWhPerHour: 30,
        essRoundTripEfficiency: 0.8
      }
    );

    expect(balances[0]).toMatchObject({
      directLocalUseKWh: 20,
      essChargeKWh: 40,
      essDischargeKWh: 0,
      essStateOfChargeKWh: 32,
      gridImportKWh: 0,
      surplusKWh: 40
    });
    expect(balances[1]).toMatchObject({
      essChargeKWh: 0,
      essDischargeKWh: 30,
      essStateOfChargeKWh: 2,
      gridImportKWh: 70
    });
  });

  it('processes dated rows chronologically so reversed input produces the same ESS result', () => {
    const chronologicalRows: EnergyUsageRow[] = [
      { date: '2026-07-01', hour: 12, usageKWh: 20 },
      { date: '2026-07-01', hour: 22, usageKWh: 100 },
      { date: '2026-07-02', hour: 12, usageKWh: 20 },
      { date: '2026-07-02', hour: 22, usageKWh: 100 }
    ];
    const storageScenario: EnergyScenario = {
      solarLevel: 100,
      essLevel: 100,
      hydrogenFuelCellLevel: 0,
      savingRate: 0,
      smartControlLevel: 0
    };
    const storageAssumptions: TeacherAssumptions = {
      ...assumptions,
      solarMaxKWhPerActiveHour: 100,
      essMaxCapacityKWh: 50,
      essMaxChargeKWhPerHour: 40,
      essMaxDischargeKWhPerHour: 30,
      essRoundTripEfficiency: 0.8
    };
    const reversedRows = [...chronologicalRows].reverse();

    const chronologicalBalances = simulateHourlyEnergyBalance(
      chronologicalRows,
      storageScenario,
      storageAssumptions
    );
    const reversedBalances = simulateHourlyEnergyBalance(reversedRows, storageScenario, storageAssumptions);

    expect(calculateUsageSummary(reversedRows)).toEqual(calculateUsageSummary(chronologicalRows));
    expect(reversedBalances).toEqual(chronologicalBalances);
    expect(reversedBalances.map(({ date, hour }) => ({ date, hour }))).toEqual(
      chronologicalRows.map(({ date, hour }) => ({ date, hour }))
    );
    expect(
      calculateScenarioResult(reversedRows, storageScenario, storageAssumptions)
    ).toEqual(calculateScenarioResult(chronologicalRows, storageScenario, storageAssumptions));
  });

  it('never charges above capacity or discharges above stored energy', () => {
    const balances = simulateHourlyEnergyBalance(
      [
        { hour: 12, usageKWh: 20 },
        { hour: 22, usageKWh: 100 }
      ],
      { solarLevel: 100, essLevel: 100, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      {
        ...assumptions,
        solarMaxKWhPerActiveHour: 100,
        essMaxCapacityKWh: 10,
        essMaxChargeKWhPerHour: 100,
        essMaxDischargeKWhPerHour: 100,
        essRoundTripEfficiency: 0.5
      }
    );

    expect(balances[0].essChargeKWh).toBe(20);
    expect(balances[0].essStateOfChargeKWh).toBe(10);
    expect(balances[1].essDischargeKWh).toBe(10);
    expect(balances[1].essStateOfChargeKWh).toBe(0);
  });

  it('does not charge ESS from hydrogen surplus', () => {
    const [balance] = simulateHourlyEnergyBalance(
      [{ hour: 22, usageKWh: 10 }],
      { solarLevel: 0, essLevel: 100, hydrogenFuelCellLevel: 100, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, hydrogenMaxKWhPerHour: 50 }
    );

    expect(balance.essChargeKWh).toBe(0);
    expect(balance.essStateOfChargeKWh).toBe(0);
    expect(balance.surplusKWh).toBe(40);
  });

  it('applies smart control as an additional saving only at the raw-value peak hour', () => {
    const balances = simulateHourlyEnergyBalance(
      [
        { hour: 9, usageKWh: 100.04 },
        { hour: 14, usageKWh: 100.049 }
      ],
      { solarLevel: 0, essLevel: 0, hydrogenFuelCellLevel: 0, savingRate: 10, smartControlLevel: 100 },
      { ...assumptions, smartControlMaxPeakSavingRate: 20 }
    );

    expect(balances[0].reducedDemandKWh).toBe(90);
    expect(balances[1].reducedDemandKWh).toBe(72);
  });

  it('clamps ESS efficiency to the supported 0 to 1 range', () => {
    const highEfficiency = simulateHourlyEnergyBalance(
      [{ hour: 12, usageKWh: 0 }],
      { solarLevel: 100, essLevel: 100, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, solarMaxKWhPerActiveHour: 10, essRoundTripEfficiency: 2 }
    );
    const negativeEfficiency = simulateHourlyEnergyBalance(
      [{ hour: 12, usageKWh: 0 }],
      { solarLevel: 100, essLevel: 100, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, solarMaxKWhPerActiveHour: 10, essRoundTripEfficiency: -1 }
    );

    expect(highEfficiency[0].essStateOfChargeKWh).toBe(10);
    expect(negativeEfficiency[0].essStateOfChargeKWh).toBe(0);
  });
});

describe('calculateScenarioResult', () => {
  it('calculates local supply from energy actually used without counting ESS as generation', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);

    expect(result.reducedUsageKWh).toBe(518.4);
    expect(result.supplyKWh).toBe(230);
    expect(result.gridImportKWh).toBe(288.4);
    expect(result.sourceBreakdown.essChargeKWh).toBe(0);
    expect(result.sourceBreakdown.essDischargeKWh).toBe(0);
    expect(result.localSupplyRate).toBeCloseTo(44.4, 1);
    expect(result.stabilityScore).toBeGreaterThan(60);
  });

  it('keeps local supply rate stable when the same daily pattern is repeated for 30 days', () => {
    const oneDay = Array.from({ length: 24 }, (_, hour) => ({ date: '2026-07-01', hour, usageKWh: 100 }));
    const thirtyDays = Array.from({ length: 30 }, (_, dayIndex) =>
      oneDay.map((row) => ({ ...row, date: `2026-07-${String(dayIndex + 1).padStart(2, '0')}` }))
    ).flat();
    const fullSupplyScenario: EnergyScenario = {
      solarLevel: 100,
      essLevel: 0,
      hydrogenFuelCellLevel: 100,
      savingRate: 0,
      smartControlLevel: 0
    };
    const hourlyAssumptions: TeacherAssumptions = {
      ...assumptions,
      solarMaxKWhPerActiveHour: 50,
      hydrogenMaxKWhPerHour: 25
    };

    const oneDayResult = calculateScenarioResult(oneDay, fullSupplyScenario, hourlyAssumptions);
    const thirtyDayResult = calculateScenarioResult(thirtyDays, fullSupplyScenario, hourlyAssumptions);

    expect(Math.abs(oneDayResult.localSupplyRate - thirtyDayResult.localSupplyRate)).toBeLessThanOrEqual(0.1);
  });

  it('reports unused generation as surplus while capping local supply rate at 100', () => {
    const result = calculateScenarioResult(
      [{ date: '2026-07-01', hour: 12, usageKWh: 100 }],
      { solarLevel: 100, essLevel: 0, hydrogenFuelCellLevel: 100, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, solarMaxKWhPerActiveHour: 120, hydrogenMaxKWhPerHour: 80 }
    );

    expect(result.localSupplyRate).toBe(100);
    expect(result.supplyKWh).toBe(100);
    expect(result.isSurplus).toBe(true);
    expect(result.surplusKWh).toBe(100);
    expect(result.gridImportKWh).toBe(0);
  });

  it('reports grid import, night dependency, and peak grid import', () => {
    const result = calculateScenarioResult(
      [
        { hour: 14, usageKWh: 40 },
        { hour: 22, usageKWh: 100 }
      ],
      { solarLevel: 0, essLevel: 0, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      assumptions
    );

    expect(result.localSupplyRate).toBe(0);
    expect(result.isSurplus).toBe(false);
    expect(result.surplusKWh).toBe(0);
    expect(result.gridImportKWh).toBe(140);
    expect(result.nightGridDependent).toBe(true);
    expect(result.peakGridImportKWh).toBe(100);
  });

  it('reports neither surplus nor grid import when local supply exactly matches reduced usage', () => {
    const result = calculateScenarioResult(
      [{ date: '2026-07-01', hour: 14, usageKWh: 100 }],
      { solarLevel: 100, essLevel: 0, hydrogenFuelCellLevel: 0, savingRate: 0, smartControlLevel: 0 },
      { ...assumptions, solarMaxKWhPerActiveHour: 100, hydrogenMaxKWhPerHour: 0 }
    );

    expect(result.localSupplyRate).toBe(100);
    expect(result.isSurplus).toBe(false);
    expect(result.surplusKWh).toBe(0);
    expect(result.gridImportKWh).toBe(0);
  });

  it('returns zeroed safe values for empty data', () => {
    const result = calculateScenarioResult([], scenario, assumptions);

    expect(result.localSupplyRate).toBe(0);
    expect(result.reducedUsageKWh).toBe(0);
    expect(result.hourlyBalance).toEqual([]);
    expect(result.studentWarnings).toContain('전력 사용 데이터가 아직 없습니다.');
  });

  it('clamps saving assumptions so reduced usage never becomes negative', () => {
    const result = calculateScenarioResult(rows, { ...scenario, savingRate: 150 }, { ...assumptions, savingMaxRate: 150 });

    expect(result.reducedUsageKWh).toBe(0);
    expect(result.localSupplyRate).toBe(0);
  });

  it('adds hydrogen environmental credit only for green hydrogen', () => {
    const hydrogenScenario = { ...scenario, solarLevel: 0, essLevel: 0, savingRate: 0, smartControlLevel: 0, hydrogenFuelCellLevel: 100 };
    const green = calculateScenarioResult(rows, hydrogenScenario, { ...assumptions, hydrogenSource: 'green' });
    const mixed = calculateScenarioResult(rows, hydrogenScenario, { ...assumptions, hydrogenSource: 'mixed' });
    const unspecified = calculateScenarioResult(rows, hydrogenScenario, { ...assumptions, hydrogenSource: 'unspecified' });

    expect(green.environmentalScore).toBeGreaterThan(mixed.environmentalScore);
    expect(mixed.environmentalScore).toBe(unspecified.environmentalScore);
  });
});

describe('scenario scores and explanation', () => {
  it('scores diverse scenarios higher than one-source scenarios', () => {
    const diverse = calculateDiversityScore(scenario);
    const oneSource = calculateDiversityScore({
      solarLevel: 100,
      essLevel: 0,
      hydrogenFuelCellLevel: 0,
      savingRate: 0,
      smartControlLevel: 0
    });

    expect(diverse).toBeGreaterThan(oneSource);
  });

  it('returns zero diversity when no energy strategy is active', () => {
    expect(
      calculateDiversityScore({
        solarLevel: 0,
        essLevel: 0,
        hydrogenFuelCellLevel: 0,
        savingRate: 0,
        smartControlLevel: 0
      })
    ).toBe(0);
  });

  it('uses ESS and smart control in stability score but not as generators', () => {
    const withControls = calculateStabilityScore({ ...scenario, essLevel: 100, smartControlLevel: 100 });
    const withoutControls = calculateStabilityScore({ ...scenario, essLevel: 0, smartControlLevel: 0 });

    expect(withControls).toBeGreaterThan(withoutControls);
  });

  it('builds middle-school friendly explanation sentences', () => {
    const result = calculateScenarioResult(rows, scenario, assumptions);
    const explanation = buildStudentExplanation(result);

    expect(explanation).toContain('14시');
    expect(explanation).toContain('태양광');
    expect(explanation).toContain('ESS');
    expect(explanation).toContain('외부 전력망');
    expect(explanation).toContain('수업용 비교 지표');
  });
});
