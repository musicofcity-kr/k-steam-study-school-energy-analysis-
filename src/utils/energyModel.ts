import type { EnergyScenario, EnergyUsageRow, ScenarioResult, TeacherAssumptions, UsageSummary } from '../types';
import { scoreWeights } from '../data/scoreWeights';

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
      dayCount: 0,
      byHourMode: 'sum',
      regionLabel: '데이터 없음',
      byHour: []
    };
  }

  const dates = [...new Set(rows.map((row) => row.date).filter((date): date is string => Boolean(date)))];
  const dayCount = dates.length > 0 ? dates.length : 1;
  const byHourMode: UsageSummary['byHourMode'] = dayCount >= 2 ? 'average' : 'sum';
  const byHourMap = new Map<number, { total: number; count: number }>();
  for (const row of rows) {
    const current = byHourMap.get(row.hour) ?? { total: 0, count: 0 };
    byHourMap.set(row.hour, { total: current.total + row.usageKWh, count: current.count + 1 });
  }

  const byHour = [...byHourMap.entries()]
    .map(([hour, value]) => ({
      hour,
      usageKWh: round1(byHourMode === 'average' ? value.total / value.count : value.total)
    }))
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
    dayCount,
    byHourMode,
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

  if (activeParts === 0) {
    return 0;
  }

  const balanceBonus =
    100 -
    Math.max(
      scenario.solarLevel,
      scenario.essLevel,
      scenario.hydrogenLevel,
      scenario.nuclearLevel,
      scenario.savingRate * 2
    ) *
      scoreWeights.diversity.dominancePenalty;

  return round1(clamp(activeParts * scoreWeights.diversity.activePartScore + balanceBonus * scoreWeights.diversity.balanceScale, 0, 100));
}

export function calculateStabilityScore(scenario: EnergyScenario): number {
  const essContribution = scenario.essLevel * scoreWeights.stability.ess;
  const savingContribution = scenario.savingRate * scoreWeights.stability.saving;
  const dispatchableContribution = scenario.hydrogenLevel * scoreWeights.stability.hydrogen + scenario.nuclearLevel * scoreWeights.stability.nuclear;
  const diversityContribution = calculateDiversityScore(scenario) * scoreWeights.stability.diversity;

  return round1(clamp(scoreWeights.stability.base + essContribution + savingContribution + dispatchableContribution + diversityContribution, 0, 100));
}

function calculateEnvironmentalScore(scenario: EnergyScenario): number {
  const renewableAndSaving =
    scenario.solarLevel * scoreWeights.environmental.solar +
    scenario.savingRate * scoreWeights.environmental.saving +
    scenario.essLevel * scoreWeights.environmental.ess;
  const hydrogenDiscussion = scenario.hydrogenLevel * scoreWeights.environmental.hydrogen;
  const nuclearDiscussion = scenario.nuclearLevel * scoreWeights.environmental.nuclear;

  return round1(clamp(scoreWeights.environmental.base + renewableAndSaving + hydrogenDiscussion + nuclearDiscussion, 0, 100));
}

function calculateRealismScore(scenario: EnergyScenario): number {
  const practicalParts =
    scenario.solarLevel * scoreWeights.realism.solar +
    scenario.essLevel * scoreWeights.realism.ess +
    scenario.savingRate * scoreWeights.realism.saving;
  const futureTechPenalty =
    scenario.hydrogenLevel * scoreWeights.realism.hydrogenPenalty + scenario.nuclearLevel * scoreWeights.realism.nuclearPenalty;

  return round1(clamp(scoreWeights.realism.base + practicalParts - futureTechPenalty, 0, 100));
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
  const hourCount = rows.length;
  const solarKWh = round1((clamp(scenario.solarLevel, 0, 100) / 100) * assumptions.solarMaxKWhPerHour * hourCount);
  const hydrogenKWh = round1((clamp(scenario.hydrogenLevel, 0, 100) / 100) * assumptions.hydrogenMaxKWhPerHour * hourCount);
  const nuclearKWh = round1((clamp(scenario.nuclearLevel, 0, 100) / 100) * assumptions.nuclearMaxKWhPerHour * hourCount);
  const supplyKWh = round1(solarKWh + hydrogenKWh + nuclearKWh);
  const selfSufficiencyRate = reducedUsageKWh > 0 ? round1((supplyKWh / reducedUsageKWh) * 100) : 0;
  const surplusKWh = round1(Math.max(0, supplyKWh - reducedUsageKWh));
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
    surplusKWh,
    isSurplus: surplusKWh > 0,
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

  const selfSufficiencySentence = result.isSurplus
    ? `현재 설계는 에너지 자립률 100%를 달성했고, 잉여 전력 ${result.surplusKWh} kWh가 생깁니다. 이 전기를 저장하거나 이웃 지역과 나누는 방법을 토론해 보세요.`
    : `현재 설계의 에너지 자립률은 약 ${result.selfSufficiencyRate}%이며, 이 값은 실제 공학값이 아니라 수업용 비교 지표입니다.`;

  return [
    `이 데이터에서 전력 사용량이 가장 높은 시간은 ${result.summary.peakHour}시입니다.`,
    `태양광은 낮 시간 전력 공급에 도움을 주고, ESS는 발전량이 아니라 피크 시간 대응과 안정성에 도움을 줍니다.`,
    selfSufficiencySentence
  ].join(' ');
}
