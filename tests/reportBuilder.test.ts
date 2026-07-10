import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReportSection } from '../src/components/ReportSection';
import {
  buildReportDraft,
  buildReportJson,
  PRACTICE_DATA_REPORT_WARNING
} from '../src/utils/reportBuilder';
import type { ReportInput } from '../src/types';

const baseInput = {
  teamName: '태양팀',
  cityName: '솔라스쿨시티',
  dataSource: '서울특별시 법정동별시간별전력사용량',
  dataProvenance: 'teacher-prepared-public-data',
  peakReason: '여러 학급의 활동 시간이 겹쳤을 수 있다.',
  provenanceDetails: {
    provider: '서울특별시',
    datasetName: '서울특별시 법정동별시간별전력사용량',
    referenceDate: '2026-06-30',
    regionUnit: '개포동',
    scope: 'regional-proxy'
  },
  scenario: {
    solarLevel: 70,
    essLevel: 60,
    hydrogenFuelCellLevel: 30,
    savingRate: 20,
    smartControlLevel: 40
  },
  result: {
    summary: {
      totalUsageKWh: 310,
      averageUsageKWh: 155,
      peakHour: 13,
      peakUsageKWh: 220,
      lowestHour: 8,
      lowestUsageKWh: 90,
      rowCount: 2,
      dayCount: 1,
      byHourMode: 'sum',
      regionLabel: '개포동',
      byHour: [
        { hour: 8, usageKWh: 90 },
        { hour: 13, usageKWh: 220 }
      ]
    },
    reducedUsageKWh: 248,
    hourlyBalance: [
      {
        date: '2026-06-30',
        hour: 8,
        demandKWh: 90,
        reducedDemandKWh: 72,
        solarGeneratedKWh: 60,
        hydrogenGeneratedKWh: 20,
        directLocalUseKWh: 72,
        essChargeKWh: 8,
        essDischargeKWh: 0,
        essStateOfChargeKWh: 8,
        gridImportKWh: 0,
        surplusKWh: 0
      },
      {
        date: '2026-06-30',
        hour: 13,
        demandKWh: 220,
        reducedDemandKWh: 176,
        solarGeneratedKWh: 60,
        hydrogenGeneratedKWh: 20,
        directLocalUseKWh: 80,
        essChargeKWh: 0,
        essDischargeKWh: 7.2,
        essStateOfChargeKWh: 0,
        gridImportKWh: 88.8,
        surplusKWh: 0
      }
    ],
    localSupplyRate: 64.2,
    supplyKWh: 159.2,
    gridImportKWh: 88.8,
    surplusKWh: 0,
    nightGridDependent: false,
    peakGridImportKWh: 88.8,
    sourceBreakdown: {
      solarGeneratedKWh: 120,
      hydrogenGeneratedKWh: 40,
      directLocalUseKWh: 152,
      essChargeKWh: 8,
      essDischargeKWh: 7.2,
      essEndStateOfChargeKWh: 0
    },
    isSurplus: false,
    stabilityScore: 70,
    diversityScore: 75,
    environmentalScore: 65,
    realismScore: 80,
    estimatedAvoidedEmissionKg: 0,
    studentWarnings: []
  },
  keyStrategies: ['낮 시간 태양광 활용', 'ESS로 피크 시간 대응', '에너지 절감 먼저 실천'],
  placementDecisions: [
    { technologyId: 'solar', placement: 'onsite', reason: '옥상과 주차장 지붕을 활용할 수 있기 때문' },
    { technologyId: 'ess', placement: 'onsite', reason: '남는 전기를 저장해 피크 시간에 쓰기 때문' },
    {
      technologyId: 'hydrogen-fuel-cell',
      placement: 'district-conditional',
      reason: '수소 공급과 안전 조건을 확인해야 하기 때문'
    },
    { technologyId: 'nuclear', placement: 'external-grid', reason: '학교 안이 아닌 외부 발전소에서 공급하기 때문' }
  ]
} satisfies ReportInput;

const makeInput = (overrides: Partial<ReportInput> = {}): ReportInput => ({
  ...baseInput,
  ...overrides
});

describe('reportBuilder', () => {
  it('builds all report sections with public-data details and placement reasons', () => {
    const draft = buildReportDraft(makeInput());

    expect(draft).toContain('1. 사용한 데이터와 출처');
    expect(draft).toContain('- 제공기관: 서울특별시');
    expect(draft).toContain('- 자료명: 서울특별시 법정동별시간별전력사용량');
    expect(draft).toContain('- 기준일: 2026-06-30');
    expect(draft).toContain('- 지역 단위: 개포동');
    expect(draft).toContain('- 자료 범위: 지역 대체 데이터');
    expect(draft).toContain('피크 시간: 13시 (220 kWh)');
    expect(draft).toContain('3. 학교 안에 배치한 기술과 이유');
    expect(draft).toContain('태양광: 옥상과 주차장 지붕을 활용할 수 있기 때문');
    expect(draft).toContain('4. 조건부로 활용한 기술과 이유');
    expect(draft).toContain('수소 연료전지: 수소 공급과 안전 조건을 확인해야 하기 때문');
    expect(draft).toContain('원자력 발전: 학교 안이 아닌 외부 발전소에서 공급하기 때문');
    expect(draft).toContain('지역 에너지 충당률: 64.2%');
    expect(draft).toContain('외부 전력망 사용량: 88.8 kWh');
    expect(draft).toContain('태양광 발전량: 120 kWh');
    expect(draft).toContain('ESS 충전량: 8 kWh');
    expect(draft).toContain('ESS 방전량: 7.2 kWh');
    expect(draft).toContain('6. 설계의 장점');
    expect(draft).toContain('7. 설계의 한계');
    expect(draft).toContain('8. 실제 적용 전에 필요한 추가 조사');
    expect(draft).toContain('9. 1분 발표문');
    expect(draft).toContain('피크 원인 추론: 여러 학급의 활동 시간이 겹쳤을 수 있다.');
    expect(draft).not.toContain('우리 팀은 여러 학급의 활동 시간이 겹쳤을 수 있다.');
  });

  it('puts the exact practice-assumption warning at the top', () => {
    const draft = buildReportDraft(
      makeInput({
        dataSource: '수업용 가정 데이터',
        dataProvenance: 'practice-assumption',
        provenanceDetails: {
          provider: '',
          datasetName: '',
          referenceDate: '',
          regionUnit: '',
          scope: 'unknown'
        }
      })
    );

    expect(draft.split('\n')[0]).toBe(PRACTICE_DATA_REPORT_WARNING);
    expect(draft).toContain('수업용 가정 데이터는 실제 학교의 전력 사용 특성을 나타내지 않습니다.');
  });

  it('does not invent peak or balance facts when usage data is absent', () => {
    const draft = buildReportDraft(
      makeInput({
        dataSource: '아직 데이터 없음',
        dataProvenance: 'unknown-upload',
        provenanceDetails: {
          provider: '',
          datasetName: '',
          referenceDate: '',
          regionUnit: '',
          scope: 'unknown'
        },
        result: {
          ...baseInput.result,
          summary: {
            ...baseInput.result.summary,
            totalUsageKWh: 0,
            averageUsageKWh: 0,
            peakHour: null,
            peakUsageKWh: 0,
            lowestHour: null,
            lowestUsageKWh: 0,
            rowCount: 0,
            dayCount: 0,
            regionLabel: '데이터 없음',
            byHour: []
          },
          localSupplyRate: 0,
          gridImportKWh: 0
        }
      })
    );

    expect(draft).toContain('분석할 전력 사용 데이터가 없어 확인할 수 없습니다.');
    expect(draft).toContain('지역 에너지 충당률: 전력 사용 데이터가 없어 계산하지 않았습니다.');
    expect(draft).toContain('외부 전력망 사용량: 전력 사용 데이터가 없어 계산하지 않았습니다.');
    expect(draft).not.toContain('입력였습니다');
    expect(draft).not.toContain('공급 가능 전력과 절감 후 소비량이 같으므로');
    expect(draft).not.toContain('지역 에너지 충당률: 0%');
    expect(draft).not.toContain('외부 전력망 사용량: 0 kWh');
  });

  it('preserves a missing explicit reason while adding scenario-based placement rows', () => {
    const draft = buildReportDraft(
      makeInput({
        placementDecisions: [
          { technologyId: 'solar', placement: 'onsite', reason: '' }
        ]
      })
    );

    expect(draft).toContain('태양광: 배치 이유가 아직 기록되지 않았습니다.');
    expect(draft).toContain('ESS (전기 저장소): 낮에 남는 태양광을 저장해 이후 부족한 시간에 사용하기 위해 선택했습니다.');
    expect(draft).toContain('수소 연료전지: 수소 공급·저장 안전·공간·비용 조건을 확인한 지역 보조 시설로 제한했습니다.');
    expect(draft).toContain('외부 전력망: 지역 설비와 ESS로 충당하지 못한 전기를 학교 밖에서 공급받기 위해 연결합니다.');
    expect(draft).not.toContain('배치 결정이 아직 기록되지 않았습니다.');
  });

  it('keeps provenance, placement, scenario, and result data in serializable JSON', () => {
    const json = buildReportJson(makeInput());

    expect(json.teamName).toBe('태양팀');
    expect(json.dataProvenance).toBe('teacher-prepared-public-data');
    expect(json.provenanceDetails.provider).toBe('서울특별시');
    expect(json.scenario.hydrogenFuelCellLevel).toBe(30);
    expect(json.result.localSupplyRate).toBe(64.2);
    expect(json.result.sourceBreakdown.essDischargeKWh).toBe(7.2);
    expect(json.placementDecisions[2].placement).toBe('district-conditional');
    expect(Number.isNaN(Date.parse(json.createdAt))).toBe(false);
  });

  it('renders provenance, placement, local supply, and an accessible save status', () => {
    const markup = renderToStaticMarkup(
      createElement(ReportSection, {
        teamName: baseInput.teamName,
        cityName: baseInput.cityName,
        dataSource: baseInput.dataSource,
        scenario: baseInput.scenario,
        result: baseInput.result,
        keyStrategies: baseInput.keyStrategies,
        reportDraft: buildReportDraft(baseInput),
        reportInput: baseInput,
        saveMessage: '브라우저에 저장했습니다.',
        isTeacherMode: true,
        onTeamNameChange: () => undefined,
        onCityNameChange: () => undefined,
        onKeyStrategiesChange: () => undefined,
        onReportDraftChange: () => undefined,
        onRegenerateReport: () => undefined,
        onSaveState: () => undefined
      })
    );

    expect(markup).toContain('데이터 출처 상세');
    expect(markup).toContain('배치 구분 요약');
    expect(markup).toContain('지역 에너지 충당률');
    expect(markup).toContain('외부 전력망 88.8 kWh');
    expect(markup).toContain('role="status"');
    expect(markup).toContain('브라우저에 저장했습니다.');
    expect(markup).toContain('자동 초안 다시 만들기');
    expect(markup).toContain('JSON 저장');
    expect(markup).toContain('브라우저 저장');
  });

  it('hides technical exports and warns against personal data in student mode', () => {
    const markup = renderToStaticMarkup(
      createElement(ReportSection, {
        teamName: '',
        cityName: '',
        dataSource: baseInput.dataSource,
        scenario: baseInput.scenario,
        result: baseInput.result,
        keyStrategies: baseInput.keyStrategies,
        reportDraft: buildReportDraft(baseInput),
        reportInput: baseInput,
        saveMessage: '',
        onTeamNameChange: () => undefined,
        onCityNameChange: () => undefined,
        onKeyStrategiesChange: () => undefined,
        onReportDraftChange: () => undefined,
        onRegenerateReport: () => undefined,
        onSaveState: () => undefined
      })
    );

    expect(markup).toContain('실명, 학번, 연락처는 쓰지 말고 모둠 별칭만 사용하세요.');
    expect(markup).toContain('placeholder="예: 태양팀 (실명·학번 금지)"');
    expect(markup).not.toContain('JSON 저장');
    expect(markup).not.toContain('브라우저 저장');
    expect(markup).toContain('<textarea');
  });

  it('renders only the prerequisite message while the report mission is locked', () => {
    const markup = renderToStaticMarkup(
      createElement(ReportSection, {
        teamName: '',
        cityName: '',
        dataSource: baseInput.dataSource,
        scenario: baseInput.scenario,
        result: baseInput.result,
        keyStrategies: baseInput.keyStrategies,
        reportDraft: buildReportDraft(baseInput),
        reportInput: baseInput,
        saveMessage: '',
        locked: true,
        onTeamNameChange: () => undefined,
        onCityNameChange: () => undefined,
        onKeyStrategiesChange: () => undefined,
        onReportDraftChange: () => undefined,
        onRegenerateReport: () => undefined,
        onSaveState: () => undefined
      })
    );

    expect(markup).toContain('미션 4에서 설계안 A와 B를 비교하고 최종 설계를 먼저 선택하세요.');
    expect(markup).not.toContain('<textarea');
    expect(markup).not.toContain('실명, 학번, 연락처');
  });
});
