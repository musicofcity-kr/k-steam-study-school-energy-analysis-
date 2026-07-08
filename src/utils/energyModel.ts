import type { EnergyScenario, EnergyUsageRow, ScenarioResult, TeacherAssumptions, UsageSummary } from '../types';

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
      regionLabel: '데이터 없음',
      byHour: []
    };
  }

  const byHourMap = new Map<number, number>();
  for (const row of rows) {
    byHourMap.set(row.hour, (byHourMap.get(row.hour) ?? 0) + row.usageKWh);
  }

  const byHour = [...byHourMap.entries()]
    .map(([hour, usageKWh]) => ({ hour, usageKWh: round1(usageKWh) }))
    .sort((a, b) => a.hour - b.hour);

  const totalUsageKWh = round1(rows.reduce((sum, row) => sum + row.usageKWh, 0));
  const averageUsageKWh = round1(totalUsageKWh / rows.length);
  const peak = byHour.reduce((current, item) => (item.usageKWh > current.usageKWh ? item : current), byHour[0]);
  const lowest = byHour.reduce((current, item) => (item.usageKWh < current.usageKWh ? item : current), byHour[0]);
  const regions = [...new Set(rows.map((row) => row.region).filter(Boolean))];

  return {
    totalUsageKWh,
    averageUsageKWh,
    peakHour: peak.hour,
    peakUsageKWh: peak.usageKWh,
    lowestHour: lowest.hour,
    lowestUsageKWh: lowest.usageKWh,
    rowCount: rows.length,
    regionLabel: regions.length > 0 ? regions.join(', ') : '지역 정보 없음',
    byHour
  };
}

export function calculateDiversityScore(scenario: EnergyScenario): number {
  const activeParts = [
    scenario.solarLevel > 0,
    scenario.essLevel > 0,
    scenario.hydrogenLevel > 0,
    scenario.nuclearLevel > 0,
    scenario.savingRate > 0
  ].filter(Boolean).length;

  const balanceBonus =
    100 -
    Math.max(
      scenario.solarLevel,
      scenario.essLevel,
      scenario.hydrogenLevel,
      scenario.nuclearLevel,
      scenario.savingRate * 2
    ) *
      0.25;

  return round1(clamp(activeParts * 16 + balanceBonus * 0.2, 0, 100));
}

export function calculateStabilityScore(scenario: EnergyScenario): number {
  const essContribution = scenario.essLevel * 0.45;
  const savingContribution = scenario.savingRate * 0.4;
  const dispatchableContribution = scenario.hydrogenLevel * 0.12 + scenario.nuclearLevel * 0.08;
  const diversityContribution = calculateDiversityScore(scenario) * 0.2;

  return round1(clamp(20 + essContribution + savingContribution + dispatchableContribution + diversityContribution, 0, 100));
}

function calculateEnvironmentalScore(scenario: EnergyScenario): number {
  const renewableAndSaving = scenario.solarLevel * 0.38 + scenario.savingRate * 0.75 + scenario.essLevel * 0.12;
  const hydrogenDiscussion = scenario.hydrogenLevel * 0.08;
  const nuclearDiscussion = scenario.nuclearLevel * 0.04;

  return round1(clamp(25 + renewableAndSaving + hydrogenDiscussion + nuclearDiscussion, 0, 100));
}

function calculateRealismScore(scenario: EnergyScenario): number {
  const practicalParts = scenario.solarLevel * 0.2 + scenario.essLevel * 0.18 + scenario.savingRate * 0.75;
  const futureTechPenalty = scenario.hydrogenLevel * 0.08 + scenario.nuclearLevel * 0.15;

  return round1(clamp(55 + practicalParts - futureTechPenalty, 0, 100));
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

  const maxSavingRate = clamp(assumptions.savingMaxRate, 0, 100);
  const savingRate = clamp(scenario.savingRate, 0, maxSavingRate) / 100;
  const reducedUsageKWh = round1(summary.totalUsageKWh * (1 - savingRate));
  const solarKWh = round1((clamp(scenario.solarLevel, 0, 100) / 100) * assumptions.solarMaxKWh);
  const hydrogenKWh = round1((clamp(scenario.hydrogenLevel, 0, 100) / 100) * assumptions.hydrogenMaxKWh);
  const nuclearKWh = round1((clamp(scenario.nuclearLevel, 0, 100) / 100) * assumptions.nuclearMaxKWh);
  const supplyKWh = round1(solarKWh + hydrogenKWh + nuclearKWh);
  const selfSufficiencyRate = reducedUsageKWh > 0 ? round1((supplyKWh / reducedUsageKWh) * 100) : 0;
  const avoidedKWh = Math.max(0, summary.totalUsageKWh - Math.max(0, reducedUsageKWh - supplyKWh));

  return {
    summary,
    reducedUsageKWh,
    supplyKWh,
    sourceBreakdown: {
      solarKWh,
      hydrogenKWh,
      nuclearKWh,
      essKWh: 0
    },
    selfSufficiencyRate,
    stabilityScore: calculateStabilityScore(scenario),
    diversityScore: calculateDiversityScore(scenario),
    environmentalScore: calculateEnvironmentalScore(scenario),
    realismScore: calculateRealismScore(scenario),
    estimatedAvoidedEmissionKg: round1(avoidedKWh * assumptions.gridEmissionFactor),
    studentWarnings: warnings
  };
}

export function buildStudentExplanation(result: ScenarioResult): string {
  if (result.summary.peakHour === null) {
    return '전력 사용 데이터를 불러오면 우리 도시의 피크 시간과 에너지 전략 설명이 만들어집니다.';
  }

  return [
    `이 데이터에서 전력 사용량이 가장 높은 시간은 ${result.summary.peakHour}시입니다.`,
    `태양광은 낮 시간 전력 공급에 도움을 주고, ESS는 발전량이 아니라 피크 시간 대응과 안정성에 도움을 줍니다.`,
    `현재 설계의 에너지 자립률은 약 ${result.selfSufficiencyRate}%이며, 이 값은 실제 공학값이 아니라 수업용 비교 지표입니다.`
  ].join(' ');
}
