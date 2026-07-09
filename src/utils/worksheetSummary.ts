import type { EnergyScenario, ScenarioResult } from '../types';

export type WorksheetValueRow = [label: string, value: string];

export function buildWorksheetValueRows(scenario: EnergyScenario, result: ScenarioResult): WorksheetValueRow[] {
  return [
    ['태양광 %', `${scenario.solarLevel}%`],
    ['ESS %', `${scenario.essLevel}%`],
    ['수소 %', `${scenario.hydrogenLevel}%`],
    ['차세대 원자력 %', `${scenario.nuclearLevel}%`],
    ['에너지 절감 %', `${scenario.savingRate}%`],
    ['에너지 자립률 %', `${result.isSurplus ? 100 : result.selfSufficiencyRate}%`],
    ['피크 대응 점수', `${result.stabilityScore}점`],
    ['현실성 점수', `${result.realismScore}점`],
    ['잉여 전력', result.isSurplus ? `있음 ${result.surplusKWh} kWh` : '없음']
  ];
}

export function buildWorksheetCopyText(scenario: EnergyScenario, result: ScenarioResult): string {
  return buildWorksheetValueRows(scenario, result)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}
