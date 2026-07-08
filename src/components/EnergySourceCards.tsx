import type { EnergySourceCard } from '../types';

type EnergySourceCardsProps = {
  cards: EnergySourceCard[];
};

export function EnergySourceCards({ cards }: EnergySourceCardsProps) {
  return (
    <section className="source-section" id="energy-sources">
      <div className="section-heading">
        <p className="eyebrow">화면 3</p>
        <h2>에너지원 비교 카드</h2>
        <p>각 선택지는 정답이 아니라 역할, 장점, 한계를 비교하기 위한 토론 자료입니다.</p>
      </div>
      <div className="source-card-grid">
        {cards.map((card) => (
          <article className="source-card" key={card.id}>
            <div>
              <h3>{card.name}</h3>
              <p>{card.shortDescription}</p>
            </div>
            <dl>
              <dt>역할</dt>
              <dd>{card.role}</dd>
              <dt>장점</dt>
              <dd>{card.strengths.join(' ')}</dd>
              <dt>한계</dt>
              <dd>{card.limits.join(' ')}</dd>
              <dt>중1 용어</dt>
              <dd>{card.studentTerm}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
