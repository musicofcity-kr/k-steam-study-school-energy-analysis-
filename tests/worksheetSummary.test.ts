import { describe, expect, it } from 'vitest';
import { buildWorksheetValueRows, buildWorksheetCopyText } from '../src/utils/worksheetSummary';
import type { EnergyScenario, ScenarioResult } from '../src/types';

const scenario: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenLevel: 20,
  nuclearLevel: 5,
  savingRate: 15
};

const result = {
  selfSufficiencyRate: 92.4,
  stabilityScore: 71,
  realismScore: 63,
  surplusKWh: 0,
  gridImportKWh: 48,
  isSurplus: false
} as ScenarioResult;

describe('worksheet summary formatting', () => {
  it('builds mission 4 worksheet rows in the required order', () => {
    expect(buildWorksheetValueRows(scenario, result)).toEqual([
      ['태양광 %', '45%'],
      ['ESS %', '40%'],
      ['수소 %', '20%'],
      ['차세대 원자력 %', '5%'],
      ['에너지 절감 %', '15%'],
      ['에너지 자립률 %', '92.4%'],
      ['피크 대응 점수', '71점'],
      ['현실성 점수', '63점'],
      ['잉여 전력', '없음']
    ]);
  });

  it('builds newline copy text for the worksheet card', () => {
    expect(buildWorksheetCopyText(scenario, { ...result, isSurplus: true, surplusKWh: 22 })).toBe(
      [
        '태양광 %: 45%',
        'ESS %: 40%',
        '수소 %: 20%',
        '차세대 원자력 %: 5%',
        '에너지 절감 %: 15%',
        '에너지 자립률 %: 100%',
        '피크 대응 점수: 71점',
        '현실성 점수: 63점',
        '잉여 전력: 있음 22 kWh'
      ].join('\n')
    );
  });
});
