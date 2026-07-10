import { energyTechnologyCatalog } from './energyTechnologyCatalog';
import type { EnergySourceCard } from '../types';

const roleLabels = {
  generation: '전기를 만드는 기술',
  storage: '발전 아님 · 저장',
  saving: '발전 아님 · 수요 줄이기',
  management: '발전 아님 · 흐름 관리',
  'external-supply': '발전 아님 · 부족분 공급'
} as const;

// 구형 import를 사용하는 코드가 있어 카탈로그를 같은 모양으로 제공하는 호환 레이어입니다.
export const energySourceCards: EnergySourceCard[] = energyTechnologyCatalog.map((technology) => ({
  id: technology.id,
  name: technology.name,
  shortDescription: technology.simplePrinciple,
  strengths: technology.strengths,
  limits: technology.limits,
  role: roleLabels[technology.role],
  studentTerm: technology.futureSchoolRole
}));
