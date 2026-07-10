import { describe, expect, it } from 'vitest';
import { buildWorksheetCopyText, buildWorksheetValueRows } from '../src/utils/worksheetSummary';
import type { EnergyScenario, ScenarioResult } from '../src/types';

const scenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenFuelCellLevel: 20,
  savingRate: 15,
  smartControlLevel: 35
} as EnergyScenario;

const result = {
  localSupplyRate: 92.4,
  stabilityScore: 71,
  realismScore: 63,
  surplusKWh: 0,
  gridImportKWh: 48,
  nightGridDependent: true
} as ScenarioResult;

describe('worksheet summary formatting', () => {
  it('builds the new mission 4 worksheet rows in the required order', () => {
    expect(buildWorksheetValueRows(scenario, result)).toEqual([
      ['태양광 %', '45%'],
      ['ESS (전기 저장소) %', '40%'],
      ['조건부 수소 연료전지 %', '20%'],
      ['에너지 절감 %', '15%'],
      ['스마트 에너지 관리 %', '35%'],
      ['지역 에너지 충당률 %', '92.4%'],
      ['외부 전력망 사용량', '48 kWh'],
      ['피크 대응 점수', '71점'],
      ['현실성 점수', '63점'],
      ['잉여 전력', '없음'],
      ['밤 시간 외부 전력 의존', '있음']
    ]);
  });

  it('builds newline copy text without the removed nuclear setting', () => {
    const copyText = buildWorksheetCopyText(scenario, {
      ...result,
      surplusKWh: 22,
      gridImportKWh: 0,
      nightGridDependent: false
    });

    expect(copyText).toBe(
      [
        '태양광 %: 45%',
        'ESS (전기 저장소) %: 40%',
        '조건부 수소 연료전지 %: 20%',
        '에너지 절감 %: 15%',
        '스마트 에너지 관리 %: 35%',
        '지역 에너지 충당률 %: 92.4%',
        '외부 전력망 사용량: 0 kWh',
        '피크 대응 점수: 71점',
        '현실성 점수: 63점',
        '잉여 전력: 있음 22 kWh',
        '밤 시간 외부 전력 의존: 없음'
      ].join('\n')
    );
    expect(copyText).not.toContain('원자력');
  });
});
