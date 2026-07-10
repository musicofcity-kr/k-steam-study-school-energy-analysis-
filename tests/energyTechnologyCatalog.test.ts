import { describe, expect, it } from 'vitest';
import { energyTechnologyCatalog } from '../src/data/energyTechnologyCatalog';

const requiredIds = [
  'coal-or-gas',
  'nuclear',
  'hydro',
  'wind',
  'solar',
  'hydrogen-fuel-cell',
  'ess',
  'saving',
  'energy-management',
  'external-grid'
];

function technology(id: string) {
  const found = energyTechnologyCatalog.find((item) => item.id === id);
  if (!found) throw new Error(`기술 카탈로그에서 ${id}를 찾지 못했습니다.`);
  return found;
}

describe('energyTechnologyCatalog', () => {
  it('contains exactly the ten required technologies without duplicate ids', () => {
    const ids = energyTechnologyCatalog.map((item) => item.id);

    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    expect(ids).toEqual(requiredIds);
  });

  it('keeps the required role and placement contracts', () => {
    expect(technology('nuclear').placement).toBe('external-grid');
    expect(technology('solar').placement).toBe('onsite');
    expect(technology('hydrogen-fuel-cell').placement).toBe('district-conditional');
    expect(technology('ess').role).toBe('storage');
    expect(technology('saving').role).toBe('saving');
    expect(technology('external-grid').role).toBe('external-supply');
  });

  it('provides complete student-facing explanations for every technology', () => {
    for (const item of energyTechnologyCatalog) {
      expect(item.name.trim()).not.toBe('');
      expect(item.simplePrinciple).toMatch(/[.!?다요]$/);
      expect(item.processSteps.length).toBeGreaterThanOrEqual(3);
      expect(item.requiredConditions.length).toBeGreaterThanOrEqual(2);
      expect(item.difficultNearSchoolReasons.length).toBeGreaterThanOrEqual(2);
      expect(item.futureSchoolRole.trim()).not.toBe('');
      expect(item.strengths.length).toBeGreaterThanOrEqual(2);
      expect(item.limits.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('states the three high-risk misconception warnings directly', () => {
    expect(technology('nuclear').misconceptionWarning).toContain('학교 안에 놓는 시설이 아닙니다');
    expect(technology('hydrogen-fuel-cell').misconceptionWarning).toContain('언제나 친환경인 것은 아닙니다');
    expect(technology('ess').misconceptionWarning).toContain('발전원이 아니라');
  });
});
