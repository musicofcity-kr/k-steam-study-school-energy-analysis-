import type { EnergyRole, EnergyTechnology, PlacementScope } from '../types';
import { energyTechnologyCatalog } from '../data/energyTechnologyCatalog';

type LegacyEnergySourceCard = {
  id: string;
  name: string;
  shortDescription: string;
  strengths: string[];
  limits: string[];
  role: string;
  studentTerm: string;
};

export type EnergySourceCardsProps = {
  technologies?: readonly EnergyTechnology[];
  cards?: readonly (EnergyTechnology | LegacyEnergySourceCard)[];
  onCardViewed?: (technologyId: string) => void;
  onCardCompared?: () => void;
};

const roleLabels: Record<EnergyRole, string> = {
  generation: '전기를 만드는 기술',
  storage: '전기를 저장하는 기술',
  saving: '전기를 덜 쓰게 하는 전략',
  management: '전기의 흐름을 관리하는 시스템',
  'external-supply': '학교 밖 전기를 연결하는 시스템'
};

const placementLabels: Record<PlacementScope, string> = {
  onsite: '학교 안',
  'district-conditional': '조건부 지역',
  'external-grid': '외부 전력망'
};

const roleOrder: EnergyRole[] = ['generation', 'storage', 'saving', 'management', 'external-supply'];

function isEnergyTechnology(card: EnergyTechnology | LegacyEnergySourceCard): card is EnergyTechnology {
  return 'simplePrinciple' in card && 'placement' in card;
}

export function EnergySourceCards({
  technologies,
  cards,
  onCardViewed,
  onCardCompared
}: EnergySourceCardsProps) {
  const catalogCards = technologies ?? (cards?.every(isEnergyTechnology) ? cards : energyTechnologyCatalog);

  const handleCardToggle = (technologyId: string, isOpen: boolean) => {
    if (!isOpen) return;
    onCardViewed?.(technologyId);
    onCardCompared?.();
  };

  return (
    <section className="source-section" id="energy-sources">
      <div className="section-heading">
        <p className="eyebrow">기술 카탈로그</p>
        <h2>발전·저장·절감·관리·외부 공급</h2>
        <p>각 기술이 전기를 만들고, 저장하고, 덜 쓰게 하고, 조절하고, 외부에서 공급하는 역할을 구분합니다.</p>
      </div>

      {roleOrder.map((role) => {
        const cardsForRole = catalogCards.filter((card) => card.role === role);
        if (cardsForRole.length === 0) return null;

        return (
          <div key={role}>
            <h3>{roleLabels[role]}</h3>
            <div className="source-card-grid">
              {cardsForRole.map((card) => (
                <details
                  className={`source-card energy-${card.id}`}
                  key={card.id}
                  onToggle={(event) => handleCardToggle(card.id, event.currentTarget.open)}
                >
                  <summary>
                    <span className="energy-icon" aria-hidden="true" />
                    <span>
                      <strong>{card.name}</strong>
                      <small>{card.simplePrinciple}</small>
                    </span>
                  </summary>
                  <dl className="source-card-detail">
                    <dt>분류</dt>
                    <dd>
                      {roleLabels[card.role]} · {placementLabels[card.placement]}
                    </dd>
                    <dt>전기를 다루는 과정</dt>
                    <dd>{card.processSteps.join(' ')}</dd>
                    <dt>필요한 조건</dt>
                    <dd>{card.requiredConditions.join(' ')}</dd>
                    <dt>학교 주변에서 살펴볼 점</dt>
                    <dd>{card.difficultNearSchoolReasons.join(' ')}</dd>
                    <dt>미래학교에서의 역할</dt>
                    <dd>{card.futureSchoolRole}</dd>
                    <dt>장점</dt>
                    <dd>{card.strengths.join(' ')}</dd>
                    <dt>한계</dt>
                    <dd>{card.limits.join(' ')}</dd>
                    {card.misconceptionWarning && (
                      <>
                        <dt>오개념 주의</dt>
                        <dd>{card.misconceptionWarning}</dd>
                      </>
                    )}
                  </dl>
                </details>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
