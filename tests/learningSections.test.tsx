import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ElectricityJourneySection,
  isElectricityJourneyComplete
} from '../src/components/ElectricityJourneySection';
import {
  ConceptCheckSection,
  isConceptCheckComplete,
  type ConceptCheckAnswers
} from '../src/components/ConceptCheckSection';
import {
  getCompletedSitingTechnologyIds,
  SitingSuitabilitySection
} from '../src/components/SitingSuitabilitySection';
import { EnergySourceCards } from '../src/components/EnergySourceCards';
import { energyTechnologyCatalog } from '../src/data/energyTechnologyCatalog';
import { MissionMap } from '../src/components/MissionMap';

const noop = () => undefined;

describe('MissionMap', () => {
  it('disables later missions until the previous mission is complete', () => {
    const html = renderToStaticMarkup(
      createElement(MissionMap, {
        steps: [
          { id: 'one', title: '1 시작', status: '개념 확인', done: false },
          { id: 'two', title: '2 다음', status: '이전 미션 먼저', done: false, locked: true }
        ],
        activeIndex: 0,
        onSelect: noop
      })
    );

    expect(html).toContain('<li class="locked"><button type="button" disabled=""');
    expect(html).toContain('이전 미션 먼저');
  });
});

describe('ElectricityJourneySection', () => {
  it('renders the school electricity journey and both controlled answers', () => {
    const answers = {
      directConversion: 'solar' as const,
      sharedPrinciple: 'steam-turbine-generator' as const
    };
    const html = renderToStaticMarkup(
      createElement(ElectricityJourneySection, {
        answers,
        onAnswerChange: noop
      })
    );

    expect(html).toContain('발전소에서 학교까지');
    expect(html).toContain('송전선');
    expect(html).toContain('변전소');
    expect(html).toContain('개념 확인 2문항');
    expect(html.match(/<li>/g)).toHaveLength(4);
    expect(html.match(/<article/g)).toHaveLength(5);
    expect(html).not.toContain('<details');
    expect(html.match(/정답입니다/g)).toHaveLength(2);
    expect(isElectricityJourneyComplete(answers)).toBe(true);
    expect(isElectricityJourneyComplete({ directConversion: 'solar' })).toBe(false);
  });
});

describe('ConceptCheckSection', () => {
  it('renders four questions and immediate explanations for controlled answers', () => {
    const answers: ConceptCheckAnswers = {
      'ess-generation': 'x',
      'nuclear-onsite': 'x',
      'solar-at-night': 'x',
      'grid-failure': 'x'
    };
    const html = renderToStaticMarkup(
      createElement(ConceptCheckSection, {
        answers,
        onAnswerChange: noop
      })
    );

    expect(html.match(/<fieldset/g)).toHaveLength(4);
    expect(html.match(/정답입니다/g)).toHaveLength(4);
    expect(html).toContain('ESS는 남는 전기를 저장했다가');
    expect(html).toContain('외부 전력망은 학교 안에서 부족한 전기를 안정적으로 보충합니다');
    expect(isConceptCheckComplete(answers)).toBe(true);
    expect(isConceptCheckComplete({ 'ess-generation': 'x' })).toBe(false);
  });

  it('disables every answer button and explains the prerequisite when locked', () => {
    const html = renderToStaticMarkup(
      createElement(ConceptCheckSection, {
        answers: {},
        onAnswerChange: noop,
        locked: true
      })
    );

    expect(html).toContain('<strong>잠김</strong>');
    expect(html).toContain('먼저 미션 1의 개념 확인 2문항을 완료하세요.');
    expect(html).not.toContain('<fieldset');
    expect(html).not.toContain('1. ESS는 전기를 새로 만드는 발전 기술이다.');
  });
});

describe('SitingSuitabilitySection', () => {
  const generationTechnologies = energyTechnologyCatalog.filter((item) => item.role === 'generation');
  const viewedTechnologyIds = ['solar', 'wind', 'hydrogen-fuel-cell', 'nuclear'];
  const decisions = [
    { technologyId: 'solar', placement: 'onsite' as const, reason: '학교 지붕의 햇빛 드는 공간을 활용할 수 있습니다.' },
    { technologyId: 'wind', placement: 'district-conditional' as const, reason: '바람과 안전거리 조건을 먼저 확인해야 합니다.' },
    { technologyId: 'hydrogen-fuel-cell', placement: 'district-conditional' as const, reason: '수소 공급과 전문 관리 조건이 필요합니다.' },
    { technologyId: 'nuclear', placement: 'external-grid' as const, reason: '안전 시설과 넓은 보호 구역이 필요합니다.' }
  ];

  it('counts only viewed technologies that have a placement decision and a reason', () => {
    expect(getCompletedSitingTechnologyIds(viewedTechnologyIds, decisions)).toHaveLength(4);
    expect(
      getCompletedSitingTechnologyIds(viewedTechnologyIds, [
        ...decisions.slice(0, 3),
        { ...decisions[3], reason: '   ' }
      ])
    ).toHaveLength(3);
    expect(
      getCompletedSitingTechnologyIds(
        [...viewedTechnologyIds, 'unknown'],
        [...decisions, { technologyId: 'unknown', placement: 'onsite', reason: '잘못 들어온 값' }],
        generationTechnologies.map((item) => item.id)
      )
    ).toHaveLength(4);
  });

  it('renders controlled card, decision, reason, and four-card completion state', () => {
    const html = renderToStaticMarkup(
      createElement(SitingSuitabilitySection, {
        viewedTechnologyIds,
        decisions,
        onViewed: noop,
        onDecisionChange: noop,
        conceptDone: true
      })
    );

    expect(html).toContain('학교 주변 적합성');
    expect(html).toContain('필수 기술 카드 4 / 4개 · O/X 4문항 완료');
    expect(html).toContain('>미션 2 완료<');
    expect(html.match(/<details/g)).toHaveLength(4);
    expect(html).toContain('태양광 발전');
    expect(html).toContain('풍력 발전');
    expect(html).toContain('수소 연료전지');
    expect(html).toContain('원자력 발전');
    expect(html).not.toContain('화력 발전');
    expect(html).not.toContain('수력 발전');
    expect(html).toContain('조건부 지역');
    expect(html).toContain('실패한 설계가 아닙니다.');
    expect(html).toContain('이 기술에 알맞은 위치');
    expect(html).toContain('학교 지붕의 햇빛 드는 공간을 활용할 수 있습니다.');
    expect(html).toContain('수업 카탈로그의 기본 분류도 ‘학교 안’입니다.');
  });

  it('shows all six generation cards only in teacher mode', () => {
    const html = renderToStaticMarkup(
      createElement(SitingSuitabilitySection, {
        viewedTechnologyIds: [],
        decisions: [],
        onViewed: noop,
        onDecisionChange: noop,
        isTeacherMode: true
      })
    );

    expect(html.match(/<details/g)).toHaveLength(6);
    expect(html).toContain('화력 발전');
    expect(html).toContain('수력 발전');
  });

  it('blocks card completion and all inputs when locked', () => {
    const html = renderToStaticMarkup(
      createElement(SitingSuitabilitySection, {
        viewedTechnologyIds: [],
        decisions: [],
        onViewed: noop,
        onDecisionChange: noop,
        locked: true
      })
    );

    expect(html).toContain('<strong>잠김</strong>');
    expect(html).not.toContain('<details');
    expect(html).not.toContain('위치 선택 기준');
  });
});

describe('EnergySourceCards', () => {
  it('separates generation, storage, saving, management, and external supply', () => {
    const html = renderToStaticMarkup(
      createElement(EnergySourceCards, {
        technologies: energyTechnologyCatalog
      })
    );

    expect(html).toContain('전기를 만드는 기술');
    expect(html).toContain('전기를 저장하는 기술');
    expect(html).toContain('전기를 덜 쓰게 하는 전략');
    expect(html).toContain('전기의 흐름을 관리하는 시스템');
    expect(html).toContain('학교 밖 전기를 연결하는 시스템');
    expect(html).toContain('ESS는 전기를 새로 만드는 발전원이 아니라');
  });
});
