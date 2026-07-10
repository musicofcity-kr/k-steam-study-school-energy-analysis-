import type { ReportInput, ReportJson } from '../types';

export const PRACTICE_DATA_REPORT_WARNING =
  '※ 이 보고서는 실제 학교 전력량이 아닌 수업용 가정 데이터로 작성되었습니다.';

const provenanceLabels: Record<ReportInput['dataProvenance'], string> = {
  'practice-assumption': '수업용 가정 데이터',
  'teacher-prepared-public-data': '교사가 준비한 공공데이터',
  'unknown-upload': '출처 확인 필요'
};

const scopeLabels: Record<ReportInput['provenanceDetails']['scope'], string> = {
  school: '학교 자체 데이터',
  'regional-proxy': '지역 대체 데이터',
  unknown: '확인 필요'
};

const placementLabels: Record<ReportInput['placementDecisions'][number]['placement'], string> = {
  onsite: '학교 안에 배치한 기술',
  'district-conditional': '조건부로 활용한 기술',
  'external-grid': '학교 밖 전력망을 통해 이용한 기술'
};

const technologyLabels: Record<string, string> = {
  'coal-or-gas': '화력 발전',
  thermal: '화력 발전',
  nuclear: '원자력 발전',
  hydro: '수력 발전',
  wind: '풍력 발전',
  solar: '태양광',
  'hydrogen-fuel-cell': '수소 연료전지',
  ess: 'ESS (전기 저장소)',
  saving: '에너지 절감',
  'energy-management': '스마트 에너지 관리',
  'external-grid': '외부 전력망'
};

const formatStrategies = (strategies: string[]) =>
  strategies
    .filter((strategy) => strategy.trim())
    .slice(0, 3)
    .map((strategy, index) => `${index + 1}. ${strategy.trim()}`)
    .join('\n');

const displayValue = (value: string | undefined, fallback = '기록 없음') => value?.trim() || fallback;

export const getDataProvenanceLabel = (provenance: ReportInput['dataProvenance']) => provenanceLabels[provenance];

export const getDataScopeLabel = (scope: ReportInput['provenanceDetails']['scope']) => scopeLabels[scope];

export const getPlacementLabel = (placement: ReportInput['placementDecisions'][number]['placement']) =>
  placementLabels[placement];

export const getTechnologyLabel = (technologyId: string) => technologyLabels[technologyId] ?? technologyId;

export function getReportPlacementDecisions(input: ReportInput): ReportInput['placementDecisions'] {
  const automatic: ReportInput['placementDecisions'] = [
    ...(input.scenario.solarLevel > 0
      ? [{ technologyId: 'solar', placement: 'onsite' as const, reason: '학교 지붕과 주차장 지붕에서 낮 시간 전기를 만들기 위해 선택했습니다.' }]
      : []),
    ...(input.scenario.essLevel > 0
      ? [{ technologyId: 'ess', placement: 'onsite' as const, reason: '낮에 남는 태양광을 저장해 이후 부족한 시간에 사용하기 위해 선택했습니다.' }]
      : []),
    ...(input.scenario.savingRate > 0
      ? [{ technologyId: 'saving', placement: 'onsite' as const, reason: 'LED, 단열과 효율 개선으로 학교가 쓰는 전력 자체를 줄이기 위해 선택했습니다.' }]
      : []),
    ...(input.scenario.smartControlLevel > 0
      ? [{ technologyId: 'energy-management', placement: 'onsite' as const, reason: '발전량을 늘리지 않고 피크 사용과 ESS 흐름을 조절하기 위해 선택했습니다.' }]
      : []),
    ...(input.scenario.hydrogenFuelCellLevel > 0
      ? [{ technologyId: 'hydrogen-fuel-cell', placement: 'district-conditional' as const, reason: '수소 공급·저장 안전·공간·비용 조건을 확인한 지역 보조 시설로 제한했습니다.' }]
      : []),
    { technologyId: 'external-grid', placement: 'external-grid', reason: '지역 설비와 ESS로 충당하지 못한 전기를 학교 밖에서 공급받기 위해 연결합니다.' }
  ];
  const merged = [...input.placementDecisions];

  for (const decision of automatic) {
    if (!merged.some((item) => item.technologyId === decision.technologyId)) merged.push(decision);
  }

  return merged;
}

const placementLines = (
  input: ReportInput,
  placement: ReportInput['placementDecisions'][number]['placement']
) => {
  const decisions = getReportPlacementDecisions(input).filter((decision) => decision.placement === placement);

  if (decisions.length === 0) {
    return ['- 배치 결정이 아직 기록되지 않았습니다.'];
  }

  return decisions.map((decision) => {
    const reason = displayValue(decision.reason, '배치 이유가 아직 기록되지 않았습니다.');
    return `- ${getTechnologyLabel(decision.technologyId)}: ${reason}`;
  });
};

const sourceLines = (input: ReportInput) => {
  const details = input.provenanceDetails;
  const lines = [
    `- 출처 상태: ${getDataProvenanceLabel(input.dataProvenance)}`,
    `- 데이터 표시 이름: ${displayValue(input.dataSource, '데이터 없음')}`
  ];

  if (input.dataProvenance === 'teacher-prepared-public-data') {
    lines.push(
      `- 제공기관: ${displayValue(details.provider)}`,
      `- 자료명: ${displayValue(details.datasetName)}`,
      `- 기준일: ${displayValue(details.referenceDate)}`,
      `- 지역 단위: ${displayValue(details.regionUnit)}`,
      `- 자료 범위: ${getDataScopeLabel(details.scope)}`
    );
  } else if (input.dataProvenance === 'unknown-upload') {
    lines.push('- 출처 상세: 제공기관, 자료명, 기준일, 지역 단위와 자료 범위를 확인해야 합니다.');
  }

  return lines;
};

const hasUsageData = (input: ReportInput) => input.result.summary.rowCount > 0;

const peakLine = (input: ReportInput) => {
  if (!hasUsageData(input) || input.result.summary.peakHour === null) {
    return '피크 시간: 분석할 전력 사용 데이터가 없어 확인할 수 없습니다.';
  }

  return [
    `피크 시간: ${input.result.summary.peakHour}시 (${input.result.summary.peakUsageKWh} kWh)`,
    `피크 원인 추론: ${displayValue(input.peakReason, '아직 기록되지 않았습니다.')}`
  ].join('\n');
};

const balanceLines = (input: ReportInput) => {
  if (!hasUsageData(input)) {
    return [
      '- 지역 에너지 충당률: 전력 사용 데이터가 없어 계산하지 않았습니다.',
      '- 외부 전력망 사용량: 전력 사용 데이터가 없어 계산하지 않았습니다.'
    ];
  }

  const breakdown = input.result.sourceBreakdown;
  return [
    `- 지역 에너지 충당률: ${input.result.localSupplyRate}%`,
    `- 외부 전력망 사용량: ${input.result.gridImportKWh} kWh`,
    `- 태양광 발전량: ${breakdown.solarGeneratedKWh} kWh`,
    `- 수소 연료전지 발전량: ${breakdown.hydrogenGeneratedKWh} kWh`,
    `- 지역에서 직접 사용한 전력: ${breakdown.directLocalUseKWh} kWh`,
    `- ESS 충전량: ${breakdown.essChargeKWh} kWh`,
    `- ESS 방전량: ${breakdown.essDischargeKWh} kWh`,
    `- ESS 최종 저장량: ${breakdown.essEndStateOfChargeKWh} kWh`,
    `- 최대 시간당 외부 전력망 사용량: ${input.result.peakGridImportKWh} kWh`,
    `- 잉여 전력: ${input.result.surplusKWh} kWh`,
    `- 밤 시간 외부 전력망 의존: ${input.result.nightGridDependent ? '있음' : '없음'}`
  ];
};

const selectedTechnologyNames = (
  input: ReportInput,
  placement: ReportInput['placementDecisions'][number]['placement']
) =>
  getReportPlacementDecisions(input)
    .filter((decision) => decision.placement === placement)
    .map((decision) => getTechnologyLabel(decision.technologyId));

const advantageLines = (input: ReportInput) => {
  const onsite = selectedTechnologyNames(input, 'onsite');
  const conditional = selectedTechnologyNames(input, 'district-conditional');
  const external = selectedTechnologyNames(input, 'external-grid');
  const lines: string[] = [];

  if (hasUsageData(input)) {
    lines.push('- 피크 시간과 지역 에너지 충당률을 함께 확인하여 설계 근거로 사용했습니다.');
  }
  if (onsite.length > 0) {
    lines.push(`- 학교 안에서 활용할 기술: ${onsite.join(', ')}`);
  }
  if (conditional.length > 0) {
    lines.push(`- 지역 조건을 확인한 뒤 활용할 기술: ${conditional.join(', ')}`);
  }
  if (external.length > 0) {
    lines.push(`- 학교 내부 시설이 아닌 외부 공급: ${external.join(', ')}`);
  }
  if (hasUsageData(input) && input.result.sourceBreakdown.essDischargeKWh > 0) {
    lines.push('- ESS (전기 저장소)에 충전한 전기를 부족한 시간에 다시 사용했습니다.');
  }

  return lines.length > 0 ? lines : ['- 데이터와 기술 배치가 아직 없어 설계의 장점을 판단할 수 없습니다.'];
};

const limitationLines = (input: ReportInput) => {
  const selectedIds = new Set(getReportPlacementDecisions(input).map((decision) => decision.technologyId));
  const lines = ['- 이 결과는 수업용 비교 모델이며 실제 학교 에너지 설계값이 아닙니다.'];

  if (input.dataProvenance === 'practice-assumption') {
    lines.push('- 수업용 가정 데이터는 실제 학교의 전력 사용 특성을 나타내지 않습니다.');
  } else if (input.provenanceDetails.scope === 'regional-proxy') {
    lines.push('- 지역 대체 데이터는 학교 자체 전력 사용량과 다를 수 있습니다.');
  } else if (input.dataProvenance === 'unknown-upload') {
    lines.push('- 데이터 출처가 확인되지 않아 결과의 범위와 신뢰도를 판단하기 어렵습니다.');
  }

  if (selectedIds.has('solar')) {
    lines.push('- 태양광 발전량은 일사량, 날씨, 계절, 설치 면적에 따라 달라집니다.');
  }
  if (selectedIds.has('ess')) {
    lines.push('- ESS (전기 저장소)는 발전원이 아니며 용량, 효율, 안전 조건을 별도로 검토해야 합니다.');
  }
  if (selectedIds.has('hydrogen-fuel-cell')) {
    lines.push('- 수소 연료전지는 수소 생산 방식, 운송·저장과 안전 조건에 따라 환경성과 적용 가능성이 달라집니다.');
  }

  return lines;
};

const researchLines = (input: ReportInput) => {
  const selectedIds = new Set(getReportPlacementDecisions(input).map((decision) => decision.technologyId));
  const lines = [
    '- 실제 학교 전력 사용량과 피크 원인',
    '- 설치 공간, 설비 효율, 비용, 법·안전 기준',
    '- 외부 전력망의 공급원 구성과 정전 대응 조건'
  ];

  if (selectedIds.has('solar')) {
    lines.push('- 학교 옥상과 주차장의 실제 일사량, 면적, 음영 조건');
  }
  if (selectedIds.has('hydrogen-fuel-cell')) {
    lines.push('- 지역의 수소 공급 방식, 저장 거리, 안전 기준과 생산 방식');
  }

  return lines;
};

const presentationDraft = (input: ReportInput) => {
  const onsite = selectedTechnologyNames(input, 'onsite');
  const conditional = selectedTechnologyNames(input, 'district-conditional');
  const external = selectedTechnologyNames(input, 'external-grid');
  const team = displayValue(input.teamName, '우리 팀');
  const city = displayValue(input.cityName, '우리 학교구역');
  const sourceSentence =
    input.dataProvenance === 'practice-assumption'
      ? '수업용 가정 데이터를 사용했으며 실제 학교 전력량은 아닙니다.'
      : input.dataProvenance === 'teacher-prepared-public-data'
        ? `${displayValue(input.provenanceDetails.provider, '제공기관 확인이 필요한 곳')}의 ${displayValue(
            input.provenanceDetails.datasetName,
            '자료명 확인이 필요한 데이터'
          )}를 사용했습니다.`
        : '현재 데이터 출처가 확인되지 않아 제공기관과 자료명을 더 확인해야 합니다.';
  const peakSentence = hasUsageData(input)
    ? `피크 시간은 ${input.result.summary.peakHour}시, ${input.result.summary.peakUsageKWh} kWh였습니다. 피크 원인 추론: ${displayValue(
        input.peakReason,
        '추가 조사가 필요합니다.'
      )}`
    : '전력 사용 데이터가 없어 피크 시간과 전력 수지는 아직 판단할 수 없습니다.';
  const placementSentence =
    getReportPlacementDecisions(input).length > 0
      ? `학교 안 기술은 ${onsite.join(', ') || '기록 없음'}, 조건부 지역 기술은 ${
          conditional.join(', ') || '기록 없음'
        }, 외부 공급 기술은 ${external.join(', ') || '기록 없음'}으로 구분했습니다.`
      : '기술 배치와 그 이유는 아직 기록되지 않았습니다.';
  const balanceSentence = hasUsageData(input)
    ? `지역 에너지 충당률은 ${input.result.localSupplyRate}%이고 외부 전력망 사용량은 ${input.result.gridImportKWh} kWh입니다.`
    : '따라서 지역 에너지 충당률과 외부 전력망 사용량도 아직 계산하지 않았습니다.';
  const nightDependencySentence =
    hasUsageData(input) && input.result.nightGridDependent
      ? '밤 시간에는 외부 전력망 공급이 필요했습니다.'
      : '';

  return `${team}은 ${city} 설계안을 제안합니다. ${sourceSentence} ${peakSentence} ${placementSentence} ${balanceSentence} ${nightDependencySentence} 이 설계는 장소에 맞는 기술과 외부 공급을 구분한 점이 장점이지만, 실제 적용 전에는 전력 사용량, 설치 공간, 비용과 안전 기준을 추가로 조사해야 합니다.`
    .replace(/\s+/g, ' ')
    .trim();
};

export function buildReportDraft(input: ReportInput): string {
  const strategies = formatStrategies(input.keyStrategies);
  const reportLines = [
    `우리 팀 이름: ${displayValue(input.teamName, '팀 이름을 정하지 않았습니다.')}`,
    `설계한 도시 이름: ${displayValue(input.cityName, '도시 이름을 정하지 않았습니다.')}`,
    '',
    '1. 사용한 데이터와 출처',
    ...sourceLines(input),
    '',
    '2. 피크 시간',
    peakLine(input),
    '',
    '3. 학교 안에 배치한 기술과 이유',
    ...placementLines(input, 'onsite'),
    '',
    '4. 조건부로 활용한 기술과 이유',
    ...placementLines(input, 'district-conditional'),
    '',
    '5. 학교 밖 전력망을 통해 이용한 기술과 전력 수지',
    ...placementLines(input, 'external-grid'),
    ...balanceLines(input),
    '',
    '설계 수준',
    `- 태양광 ${input.scenario.solarLevel}%, ESS (전기 저장소) ${input.scenario.essLevel}%, 수소 연료전지 ${input.scenario.hydrogenFuelCellLevel}%, 에너지 절감 ${input.scenario.savingRate}%, 스마트 에너지 관리 ${input.scenario.smartControlLevel}%`,
    '',
    '핵심 전략 3가지',
    strategies || '1. 핵심 전략이 아직 기록되지 않았습니다.',
    '',
    '6. 설계의 장점',
    ...advantageLines(input),
    '',
    '7. 설계의 한계',
    ...limitationLines(input),
    '',
    '8. 실제 적용 전에 필요한 추가 조사',
    ...researchLines(input),
    '',
    '9. 1분 발표문',
    presentationDraft(input)
  ];

  if (input.dataProvenance === 'practice-assumption') {
    reportLines.unshift(PRACTICE_DATA_REPORT_WARNING, '');
  }

  return reportLines.join('\n');
}

export function buildReportJson(input: ReportInput): ReportJson {
  return {
    ...input,
    createdAt: new Date().toISOString()
  };
}
