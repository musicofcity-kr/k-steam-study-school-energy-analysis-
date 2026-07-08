import type { EnergySourceCard } from '../types';

type EnergySourceCardsProps = {
  cards: EnergySourceCard[];
  onCardCompared: () => void;
};

export function EnergySourceCards({ cards, onCardCompared }: EnergySourceCardsProps) {
  return (
    <section className="source-section" id="energy-sources">
      <div className="section-heading">
        <p className="eyebrow">화면 3</p>
        <h2>미션 3: 에너지 카드 비교</h2>
        <p>카드를 펼쳐 각 에너지의 장점과 한계를 비교하세요. 색만 보지 말고 이름과 역할을 함께 확인합니다.</p>
      </div>
      <div className="source-card-grid">
        {cards.map((card) => (
          <details className={`source-card energy-${card.id}`} key={card.id} onToggle={(event) => event.currentTarget.open && onCardCompared()}>
            <summary>
              <span className="energy-icon" aria-hidden="true" />
              <span>
                <strong>{card.name}</strong>
                <small>{card.shortDescription}</small>
              </span>
            </summary>
            <dl className="source-card-detail">
              <dt>역할</dt>
              <dd>{card.role}</dd>
              <dt>장점</dt>
              <dd>{card.strengths.join(' ')}</dd>
              <dt>한계</dt>
              <dd>{card.limits.join(' ')}</dd>
              <dt>중1 용어</dt>
              <dd>{card.studentTerm}</dd>
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
