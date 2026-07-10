import type {
  EnergyScenario,
  EnergyUsageRow,
  HourlyEnergyBalance,
  ScenarioResult,
  TeacherAssumptions,
  UsageSummary
} from '../types';
import { scoreWeights } from '../data/scoreWeights';

const round1 = (value: number) => Math.round((value + Number.EPSILON) * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);
const nonNegative = (value: number) => Math.max(0, finiteOr(value, 0));
const percent = (value: number) => clamp(finiteOr(value, 0), 0, 100) / 100;
const sumBy = (items: HourlyEnergyBalance[], select: (item: HourlyEnergyBalance) => number) =>
  items.reduce((sum, item) => sum + select(item), 0);

const compareUsageRowsChronologically = (left: EnergyUsageRow, right: EnergyUsageRow) => {
  const leftDate = left.date?.trim() ?? '';
  const rightDate = right.date?.trim() ?? '';
  const dateOrder = leftDate.localeCompare(rightDate, undefined, { numeric: true, sensitivity: 'base' });

  return dateOrder || left.hour - right.hour;
};

type RawHourlyEnergyBalance = HourlyEnergyBalance;

export function calculateUsageSummary(rows: EnergyUsageRow[]): UsageSummary {
  if (rows.length === 0) {
    return {
      totalUsageKWh: 0,
      averageUsageKWh: 0,
      peakHour: null,
      peakUsageKWh: 0,
      lowestHour: null,
      lowestUsageKWh: 0,
      rowCount: 0,
      dayCount: 0,
      byHourMode: 'sum',
      regionLabel: '데이터 없음',
      byHour: []
    };
  }

  const chronologicalRows = [...rows].sort(compareUsageRowsChronologically);
  const dates = [...new Set(chronologicalRows.map((row) => row.date).filter((date): date is string => Boolean(date)))];
  const dayCount = dates.length > 0 ? dates.length : 1;
  const byHourMode: UsageSummary['byHourMode'] = dayCount >= 2 ? 'average' : 'sum';
  const byHourMap = new Map<number, { total: number; count: number }>();
  for (const row of chronologicalRows) {
    const current = byHourMap.get(row.hour) ?? { total: 0, count: 0 };
    byHourMap.set(row.hour, { total: current.total + row.usageKWh, count: current.count + 1 });
  }

  const rawByHour = [...byHourMap.entries()]
    .map(([hour, value]) => ({
      hour,
      usageKWh: byHourMode === 'average' ? value.total / value.count : value.total
    }))
    .sort((a, b) => a.hour - b.hour);
  const byHour = rawByHour.map((item) => ({ hour: item.hour, usageKWh: round1(item.usageKWh) }));
  const rawTotalUsageKWh = chronologicalRows.reduce((sum, row) => sum + row.usageKWh, 0);
  const peak = rawByHour.reduce((current, item) => (item.usageKWh > current.usageKWh ? item : current), rawByHour[0]);
  const lowest = rawByHour.reduce((current, item) => (item.usageKWh < current.usageKWh ? item : current), rawByHour[0]);
  const regions = [...new Set(chronologicalRows.map((row) => row.region).filter(Boolean))];

  return {
    totalUsageKWh: round1(rawTotalUsageKWh),
    averageUsageKWh: round1(rawTotalUsageKWh / chronologicalRows.length),
    peakHour: peak.hour,
    peakUsageKWh: round1(peak.usageKWh),
    lowestHour: lowest.hour,
    lowestUsageKWh: round1(lowest.usageKWh),
    rowCount: chronologicalRows.length,
    dayCount,
    byHourMode,
    regionLabel: regions.length > 0 ? regions.join(', ') : '지역 정보 없음',
    byHour
  };
}

export function isSolarActiveHour(hour: number, startHour: number, endHour: number): boolean {
  if (![hour, startHour, endHour].every(Number.isFinite)) {
    return false;
  }

  const activeStart = Math.min(startHour, endHour);
  const activeEnd = Math.max(startHour, endHour);
  return hour >= activeStart && hour <= activeEnd;
}

function simulateRawHourlyEnergyBalance(
  rows: EnergyUsageRow[],
  scenario: EnergyScenario,
  assumptions: TeacherAssumptions
): RawHourlyEnergyBalance[] {
  const chronologicalRows = [...rows].sort(compareUsageRowsChronologically);
  const peakHour = calculateUsageSummary(chronologicalRows).peakHour;
  const savingRate = Math.min(percent(scenario.savingRate), percent(assumptions.savingMaxRate));
  const smartPeakSavingRate = percent(scenario.smartControlLevel) * percent(assumptions.smartControlMaxPeakSavingRate);
  const solarPerActiveHour = nonNegative(assumptions.solarMaxKWhPerActiveHour) * percent(scenario.solarLevel);
  const hydrogenPerHour = nonNegative(assumptions.hydrogenMaxKWhPerHour) * percent(scenario.hydrogenFuelCellLevel);
  const essScale = percent(scenario.essLevel);
  const essCapacity = nonNegative(assumptions.essMaxCapacityKWh) * essScale;
  const essChargeLimit = nonNegative(assumptions.essMaxChargeKWhPerHour) * essScale;
  const essDischargeLimit = nonNegative(assumptions.essMaxDischargeKWhPerHour) * essScale;
  const essEfficiency = clamp(finiteOr(assumptions.essRoundTripEfficiency, 0), 0, 1);
  const solarStartHour = clamp(finiteOr(assumptions.solarActiveStartHour, 7), 0, 23);
  const solarEndHour = clamp(finiteOr(assumptions.solarActiveEndHour, 18), 0, 23);
  let essStateOfChargeKWh = 0;

  return chronologicalRows.map((row) => {
    const demandKWh = nonNegative(row.usageKWh);
    const afterSavingKWh = demandKWh * (1 - savingRate);
    const reducedDemandKWh =
      row.hour === peakHour ? afterSavingKWh * (1 - smartPeakSavingRate) : afterSavingKWh;
    const solarGeneratedKWh = isSolarActiveHour(row.hour, solarStartHour, solarEndHour) ? solarPerActiveHour : 0;
    const hydrogenGeneratedKWh = hydrogenPerHour;

    const directSolarUseKWh = Math.min(reducedDemandKWh, solarGeneratedKWh);
    const demandAfterSolarKWh = reducedDemandKWh - directSolarUseKWh;
    const directHydrogenUseKWh = Math.min(demandAfterSolarKWh, hydrogenGeneratedKWh);
    const directLocalUseKWh = directSolarUseKWh + directHydrogenUseKWh;
    const solarSurplusKWh = solarGeneratedKWh - directSolarUseKWh;
    const hydrogenSurplusKWh = hydrogenGeneratedKWh - directHydrogenUseKWh;

    const remainingCapacityKWh = Math.max(0, essCapacity - essStateOfChargeKWh);
    const chargeInputAllowedByCapacityKWh = essEfficiency > 0 ? remainingCapacityKWh / essEfficiency : 0;
    const essChargeKWh = Math.min(solarSurplusKWh, essChargeLimit, chargeInputAllowedByCapacityKWh);
    essStateOfChargeKWh = Math.min(essCapacity, essStateOfChargeKWh + essChargeKWh * essEfficiency);

    const remainingDemandKWh = Math.max(0, reducedDemandKWh - directLocalUseKWh);
    const essDischargeKWh = Math.min(remainingDemandKWh, essDischargeLimit, essStateOfChargeKWh);
    essStateOfChargeKWh = Math.max(0, essStateOfChargeKWh - essDischargeKWh);
    const gridImportKWh = Math.max(0, remainingDemandKWh - essDischargeKWh);
    const surplusKWh = Math.max(0, solarSurplusKWh - essChargeKWh) + hydrogenSurplusKWh;

    return {
      date: row.date,
      hour: row.hour,
      demandKWh,
      reducedDemandKWh,
      solarGeneratedKWh,
      hydrogenGeneratedKWh,
      directLocalUseKWh,
      essChargeKWh,
      essDischargeKWh,
      essStateOfChargeKWh,
      gridImportKWh,
      surplusKWh
    };
  });
}

function roundHourlyBalance(balance: RawHourlyEnergyBalance): HourlyEnergyBalance {
  return {
    date: balance.date,
    hour: balance.hour,
    demandKWh: round1(balance.demandKWh),
    reducedDemandKWh: round1(balance.reducedDemandKWh),
    solarGeneratedKWh: round1(balance.solarGeneratedKWh),
    hydrogenGeneratedKWh: round1(balance.hydrogenGeneratedKWh),
    directLocalUseKWh: round1(balance.directLocalUseKWh),
    essChargeKWh: round1(balance.essChargeKWh),
    essDischargeKWh: round1(balance.essDischargeKWh),
    essStateOfChargeKWh: round1(balance.essStateOfChargeKWh),
    gridImportKWh: round1(balance.gridImportKWh),
    surplusKWh: round1(balance.surplusKWh)
  };
}

export function simulateHourlyEnergyBalance(
  rows: EnergyUsageRow[],
  scenario: EnergyScenario,
  assumptions: TeacherAssumptions
): HourlyEnergyBalance[] {
  return simulateRawHourlyEnergyBalance(rows, scenario, assumptions).map(roundHourlyBalance);
}

export function calculateDiversityScore(scenario: EnergyScenario): number {
  const activeParts = [
    scenario.solarLevel > 0,
    scenario.essLevel > 0,
    scenario.hydrogenFuelCellLevel > 0,
    scenario.savingRate > 0,
    scenario.smartControlLevel > 0
  ].filter(Boolean).length;

  if (activeParts === 0) {
    return 0;
  }

  const balanceBonus =
    100 -
    Math.max(
      scenario.solarLevel,
      scenario.essLevel,
      scenario.hydrogenFuelCellLevel,
      scenario.savingRate * 2,
      scenario.smartControlLevel
    ) *
      scoreWeights.diversity.dominancePenalty;

  return round1(
    clamp(activeParts * scoreWeights.diversity.activePartScore + balanceBonus * scoreWeights.diversity.balanceScale, 0, 100)
  );
}

export function calculateStabilityScore(scenario: EnergyScenario): number {
  const essContribution = scenario.essLevel * scoreWeights.stability.ess;
  const savingContribution = scenario.savingRate * scoreWeights.stability.saving;
  const dispatchableContribution = scenario.hydrogenFuelCellLevel * scoreWeights.stability.hydrogen;
  const smartControlContribution = scenario.smartControlLevel * scoreWeights.stability.smartControl;
  const diversityContribution = calculateDiversityScore(scenario) * scoreWeights.stability.diversity;

  return round1(
    clamp(
      scoreWeights.stability.base +
        essContribution +
        savingContribution +
        dispatchableContribution +
        smartControlContribution +
        diversityContribution,
      0,
      100
    )
  );
}

function calculateEnvironmentalScore(scenario: EnergyScenario, hydrogenSource: TeacherAssumptions['hydrogenSource']): number {
  const resourceAndDemandManagement =
    scenario.solarLevel * scoreWeights.environmental.solar +
    scenario.savingRate * scoreWeights.environmental.saving +
    scenario.essLevel * scoreWeights.environmental.ess +
    scenario.smartControlLevel * scoreWeights.environmental.smartControl;
  const hydrogenContribution =
    hydrogenSource === 'green' ? scenario.hydrogenFuelCellLevel * scoreWeights.environmental.greenHydrogen : 0;

  return round1(clamp(scoreWeights.environmental.base + resourceAndDemandManagement + hydrogenContribution, 0, 100));
}

function calculateRealismScore(scenario: EnergyScenario): number {
  const practicalParts =
    scenario.solarLevel * scoreWeights.realism.solar +
    scenario.essLevel * scoreWeights.realism.ess +
    scenario.savingRate * scoreWeights.realism.saving +
    scenario.smartControlLevel * scoreWeights.realism.smartControl;
  const conditionalInfrastructurePenalty = scenario.hydrogenFuelCellLevel * scoreWeights.realism.hydrogenPenalty;

  return round1(clamp(scoreWeights.realism.base + practicalParts - conditionalInfrastructurePenalty, 0, 100));
}

export function calculateScenarioResult(
  rows: EnergyUsageRow[],
  scenario: EnergyScenario,
  assumptions: TeacherAssumptions
): ScenarioResult {
  const summary = calculateUsageSummary(rows);
  const warnings: string[] = [];

  if (rows.length === 0) {
    warnings.push('전력 사용 데이터가 아직 없습니다.');
  }

  const rawHourlyBalance = simulateRawHourlyEnergyBalance(rows, scenario, assumptions);
  const reducedUsageKWhRaw = sumBy(rawHourlyBalance, (item) => item.reducedDemandKWh);
  const gridImportKWhRaw = sumBy(rawHourlyBalance, (item) => item.gridImportKWh);
  const surplusKWhRaw = sumBy(rawHourlyBalance, (item) => item.surplusKWh);
  const directLocalUseKWhRaw = sumBy(rawHourlyBalance, (item) => item.directLocalUseKWh);
  const essDischargeKWhRaw = sumBy(rawHourlyBalance, (item) => item.essDischargeKWh);
  const supplyKWhRaw = directLocalUseKWhRaw + essDischargeKWhRaw;
  const localSupplyRate =
    reducedUsageKWhRaw > 0 ? round1(clamp(((reducedUsageKWhRaw - gridImportKWhRaw) / reducedUsageKWhRaw) * 100, 0, 100)) : 0;
  const surplusKWh = round1(surplusKWhRaw);
  const gridImportKWh = round1(gridImportKWhRaw);
  const avoidedKWh = Math.max(0, rows.reduce((sum, row) => sum + nonNegative(row.usageKWh), 0) - gridImportKWhRaw);
  const solarStartHour = clamp(finiteOr(assumptions.solarActiveStartHour, 7), 0, 23);
  const solarEndHour = clamp(finiteOr(assumptions.solarActiveEndHour, 18), 0, 23);

  return {
    summary,
    reducedUsageKWh: round1(reducedUsageKWhRaw),
    hourlyBalance: rawHourlyBalance.map(roundHourlyBalance),
    localSupplyRate,
    supplyKWh: round1(supplyKWhRaw),
    gridImportKWh,
    surplusKWh,
    nightGridDependent: rawHourlyBalance.some(
      (item) => !isSolarActiveHour(item.hour, solarStartHour, solarEndHour) && item.gridImportKWh > 0
    ),
    peakGridImportKWh: round1(Math.max(0, ...rawHourlyBalance.map((item) => item.gridImportKWh))),
    sourceBreakdown: {
      solarGeneratedKWh: round1(sumBy(rawHourlyBalance, (item) => item.solarGeneratedKWh)),
      hydrogenGeneratedKWh: round1(sumBy(rawHourlyBalance, (item) => item.hydrogenGeneratedKWh)),
      directLocalUseKWh: round1(directLocalUseKWhRaw),
      essChargeKWh: round1(sumBy(rawHourlyBalance, (item) => item.essChargeKWh)),
      essDischargeKWh: round1(essDischargeKWhRaw),
      essEndStateOfChargeKWh: round1(rawHourlyBalance.at(-1)?.essStateOfChargeKWh ?? 0)
    },
    isSurplus: surplusKWh > 0,
    stabilityScore: calculateStabilityScore(scenario),
    diversityScore: calculateDiversityScore(scenario),
    environmentalScore: calculateEnvironmentalScore(scenario, assumptions.hydrogenSource),
    realismScore: calculateRealismScore(scenario),
    estimatedAvoidedEmissionKg: round1(avoidedKWh * nonNegative(assumptions.gridEmissionFactor)),
    studentWarnings: warnings
  };
}

export function buildStudentExplanation(result: ScenarioResult): string {
  if (result.summary.peakHour === null) {
    return '전력 사용 데이터를 불러오면 우리 도시의 피크 시간과 에너지 전략 설명이 만들어집니다.';
  }

  const localSupplySentence = result.isSurplus
    ? `현재 설계는 지역 에너지 충당률 100%를 달성했고, 잉여 전력 ${result.surplusKWh} kWh가 생깁니다. 이 전기를 저장하거나 이웃 지역과 나누는 방법을 토론해 보세요.`
    : result.gridImportKWh > 0
      ? `현재 설계의 지역 에너지 충당률은 약 ${result.localSupplyRate}%이며, 이 값은 수업용 비교 지표입니다. 부족한 전기는 외부 전력망에서 가져옵니다. 현실 도시도 대부분 전력망과 연결되어 있어요.`
      : `현재 설계의 지역 에너지 충당률은 약 ${result.localSupplyRate}%이며, 이 값은 실제 공학값이 아니라 수업용 비교 지표입니다.`;

  return [
    `이 데이터에서 전력 사용량이 가장 높은 시간은 ${result.summary.peakHour}시입니다.`,
    `태양광은 설정된 낮 시간에만 전기를 만들고, ESS (전기 저장소)는 낮에 남는 태양광을 저장해 부족한 시간에 공급합니다.`,
    localSupplySentence
  ].join(' ');
}
