import type { EnergyScenario, ScenarioResult } from '../types';

export type WorksheetValueRow = [label: string, value: string];

export function buildWorksheetValueRows(scenario: EnergyScenario, result: ScenarioResult): WorksheetValueRow[] {
  return [
    ['태양광 %', `${scenario.solarLevel}%`],
    ['ESS (전기 저장소) %', `${scenario.essLevel}%`],
    ['조건부 수소 연료전지 %', `${scenario.hydrogenFuelCellLevel}%`],
    ['에너지 절감 %', `${scenario.savingRate}%`],
    ['스마트 에너지 관리 %', `${scenario.smartControlLevel}%`],
    ['지역 에너지 충당률 %', `${result.localSupplyRate}%`],
    ['외부 전력망 사용량', `${result.gridImportKWh} kWh`],
    ['피크 대응 점수', `${result.stabilityScore}점`],
    ['현실성 점수', `${result.realismScore}점`],
    ['잉여 전력', result.surplusKWh > 0 ? `있음 ${result.surplusKWh} kWh` : '없음'],
    ['밤 시간 외부 전력 의존', result.nightGridDependent ? '있음' : '없음']
  ];
}

export function buildWorksheetCopyText(scenario: EnergyScenario, result: ScenarioResult): string {
  return buildWorksheetValueRows(scenario, result)
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}
