import type { ReportInput, ReportJson } from '../types';
import { buildStudentExplanation } from './energyModel';

const formatStrategies = (strategies: string[]) =>
  strategies
    .filter(Boolean)
    .slice(0, 3)
    .map((strategy, index) => `${index + 1}. ${strategy}`)
    .join('\n');

export function buildReportDraft(input: ReportInput): string {
  const peakHour = input.result.summary.peakHour === null ? '데이터 확인 후 입력' : `${input.result.summary.peakHour}시`;
  const strategies = formatStrategies(input.keyStrategies);
  const selfSufficiencyLine = input.result.isSurplus
    ? `에너지 자립률: 100% 달성, 잉여 전력 ${input.result.surplusKWh} kWh`
    : `에너지 자립률: 약 ${input.result.selfSufficiencyRate}%`;
  const surplusDiscussion = input.result.isSurplus
    ? `- 잉여 전력은 저장하거나 이웃 지역과 나누는 방법을 토론해야 합니다.`
    : '- 부족한 전력은 외부 전력망과 추가 절감 전략을 함께 검토해야 합니다.';

  return [
    `우리 팀 이름: ${input.teamName || '팀 이름을 입력하세요'}`,
    `설계한 도시 이름: ${input.cityName || '도시 이름을 입력하세요'}`,
    `사용한 데이터 출처: ${input.dataSource || '데이터 출처를 입력하세요'}`,
    '',
    `전력 사용 패턴 요약: 가장 전기를 많이 쓰는 시간대는 ${peakHour}였습니다.`,
    `에너지 조합: 태양광 ${input.scenario.solarLevel}%, ESS ${input.scenario.essLevel}%, 수소 ${input.scenario.hydrogenLevel}%, 차세대 원자력 ${input.scenario.nuclearLevel}%, 절감률 ${input.scenario.savingRate}%입니다.`,
    selfSufficiencyLine,
    '',
    '우리가 선택한 핵심 전략 3가지',
    strategies || '1. 데이터에서 찾은 피크 시간을 줄이는 전략을 적어 보세요.',
    '',
    '이 설계의 장점',
    '- 전력 사용량이 높은 시간대를 근거로 에너지 조합을 정했습니다.',
    '- ESS는 발전원이 아니라 전기를 저장해 피크 시간에 대응하는 장치로 보았습니다.',
    '',
    '이 설계의 한계',
    '- 이 결과는 수업용 비교 모델이며 실제 도시 설계에는 더 많은 자료가 필요합니다.',
    '- 지역 일사량, 설치 면적, 비용, 안전 기준은 더 조사해야 합니다.',
    surplusDiscussion,
    '',
    '더 조사해야 할 점',
    '- 실제 공공데이터와 학교 주변 조건을 더 확인해야 합니다.',
    '',
    '1분 발표문 초안',
    `우리 팀은 전력 사용량이 가장 높은 시간대를 줄이는 것을 핵심 문제로 보았습니다. ${buildStudentExplanation(
      input.result
    )} 그래서 우리는 위의 세 가지 전략을 중심으로 2050년 탄소중립 미래 학교구역을 설계했습니다.`
  ].join('\n');
}

export function buildReportJson(input: ReportInput): ReportJson {
  return {
    ...input,
    createdAt: new Date().toISOString()
  };
}
