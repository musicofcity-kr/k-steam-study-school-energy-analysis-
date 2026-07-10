import type { EnergyTechnology, PlacementScope, TechnologyPlacementDecision } from '../types';
import { energyTechnologyCatalog } from '../data/energyTechnologyCatalog';

export type SitingSuitabilitySectionProps = {
  viewedTechnologyIds: string[];
  decisions: TechnologyPlacementDecision[];
  onViewed: (technologyId: string) => void;
  onDecisionChange: (decision: TechnologyPlacementDecision) => void;
  locked?: boolean;
  conceptDone?: boolean;
  isTeacherMode?: boolean;
};

const placementLabels: Record<PlacementScope, string> = {
  onsite: '학교 안',
  'district-conditional': '조건부 지역',
  'external-grid': '외부 전력망'
};

const sitingTechnologies = energyTechnologyCatalog.filter((technology) => technology.role === 'generation');
export const requiredSitingTechnologyIds = ['solar', 'wind', 'hydrogen-fuel-cell', 'nuclear'] as const;
const requiredSitingTechnologies = requiredSitingTechnologyIds
  .map((technologyId) => sitingTechnologies.find((technology) => technology.id === technologyId))
  .filter((technology): technology is EnergyTechnology => technology !== undefined);

export function getCompletedSitingTechnologyIds(
  viewedTechnologyIds: readonly string[],
  decisions: readonly TechnologyPlacementDecision[],
  validTechnologyIds: readonly string[] = requiredSitingTechnologyIds
) {
  const viewedIds = new Set(viewedTechnologyIds);
  const validIds = new Set(validTechnologyIds);
  return Array.from(
    new Set(
      decisions
        .filter(
          (decision) =>
            validIds.has(decision.technologyId) &&
            viewedIds.has(decision.technologyId) &&
            decision.reason.trim().length > 0
        )
        .map((decision) => decision.technologyId)
    )
  );
}

function isPlacementScope(value: string): value is PlacementScope {
  return value === 'onsite' || value === 'district-conditional' || value === 'external-grid';
}

export function SitingSuitabilitySection({
  viewedTechnologyIds,
  decisions,
  onViewed,
  onDecisionChange,
  locked = false,
  conceptDone = false,
  isTeacherMode = false
}: SitingSuitabilitySectionProps) {
  const completedIds = getCompletedSitingTechnologyIds(viewedTechnologyIds, decisions);
  const requiredCardsDone = completedIds.length === requiredSitingTechnologyIds.length;
  const missionDone = requiredCardsDone && conceptDone;
  const visibleTechnologies = isTeacherMode ? sitingTechnologies : requiredSitingTechnologies;

  return (
    <section className="source-section" id="siting-suitability">
      <div className="section-heading">
        <p className="eyebrow">미션 2</p>
        <h2>2 학교 주변 적합성</h2>
        <p>필요한 공간, 자연조건, 안전시설, 운송, 소음, 비용을 함께 살펴 기술의 위치를 판단합니다.</p>
      </div>

      <div className="notice-band" role="status">
        <strong>{locked ? '잠김' : missionDone ? '미션 2 완료' : '진행 중'}</strong>
        <span>
          {locked
            ? '먼저 미션 1의 개념 확인 2문항을 완료하세요.'
            : `필수 기술 카드 ${completedIds.length} / ${requiredSitingTechnologyIds.length}개 · O/X 4문항 ${conceptDone ? '완료' : '미완료'}`}
        </span>
      </div>

      {!locked && (
        <>
          <div className="mission-panel" aria-label="기술 위치 분류 기준">
            <h3>위치 선택 기준</h3>
            <dl className="source-card-detail">
              <dt>학교 안</dt>
              <dd>학교 지붕이나 부지에 설치하고 학교가 직접 관리할 수 있는 기술</dd>
              <dt>조건부 지역</dt>
              <dd>학교 밖에서 자연조건, 안전거리, 전문 관리 조건을 갖춘 경우 검토할 수 있는 기술</dd>
              <dt>외부 전력망</dt>
              <dd>학교 밖 발전소의 전기를 송전선과 배전선으로 공급받는 방식이며, 실패한 설계가 아닙니다.</dd>
            </dl>
          </div>

          <div className="source-card-grid" aria-label="입지 적합성 기술 카드">
            {visibleTechnologies.map((technology) => {
              const isViewed = viewedTechnologyIds.includes(technology.id);
              const decision = decisions.find((item) => item.technologyId === technology.id);

              return (
                <TechnologySitingCard
                  technology={technology}
                  decision={decision}
                  isViewed={isViewed}
                  locked={false}
                  onViewed={onViewed}
                  onDecisionChange={onDecisionChange}
                  key={technology.id}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function TechnologySitingCard({
  technology,
  decision,
  isViewed,
  locked,
  onViewed,
  onDecisionChange
}: {
  technology: EnergyTechnology;
  decision?: TechnologyPlacementDecision;
  isViewed: boolean;
  locked: boolean;
  onViewed: (technologyId: string) => void;
  onDecisionChange: (decision: TechnologyPlacementDecision) => void;
}) {
  return (
    <details
      className={`source-card energy-${technology.id}`}
      aria-disabled={locked || undefined}
      onClick={(event) => {
        if (locked) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onToggle={(event) => !locked && event.currentTarget.open && onViewed(technology.id)}
    >
      <summary>
        <span className="energy-icon" aria-hidden="true" />
        <span>
          <strong>{technology.name}</strong>
          <small>
            {locked
              ? '미션 1을 완료하면 열립니다.'
              : isViewed
                ? '확인함 · 위치와 이유를 작성하세요.'
                : technology.simplePrinciple}
          </small>
        </span>
      </summary>

      <dl className="source-card-detail">
        <dt>전기를 만드는 원리</dt>
        <dd>{technology.simplePrinciple}</dd>
        <dt>필요한 조건</dt>
        <dd>{technology.requiredConditions.join(' ')}</dd>
        <dt>학교 주변에서 살펴볼 점</dt>
        <dd>{technology.difficultNearSchoolReasons.join(' ')}</dd>
        <dt>2050 미래학교에서의 역할</dt>
        <dd>{technology.futureSchoolRole}</dd>
      </dl>

      <label>
        <span>이 기술에 알맞은 위치</span>
        <select
          value={decision?.placement ?? ''}
          disabled={locked}
          onChange={(event) => {
            if (!locked && isPlacementScope(event.target.value)) {
              onDecisionChange({
                technologyId: technology.id,
                placement: event.target.value,
                reason: decision?.reason ?? ''
              });
            }
          }}
        >
          <option value="" disabled>
            위치를 선택하세요
          </option>
          <option value="onsite">학교 안</option>
          <option value="district-conditional">조건부 지역</option>
          <option value="external-grid">외부 전력망</option>
        </select>
      </label>

      <label>
        <span>그 위치를 선택한 이유</span>
        <input
          type="text"
          value={decision?.reason ?? ''}
          disabled={locked || !decision}
          placeholder={decision ? '공간, 자연조건, 안전, 운송, 소음, 비용 중 근거를 적으세요.' : '먼저 위치를 선택하세요.'}
          onChange={(event) =>
            !locked && decision && onDecisionChange({ ...decision, reason: event.target.value })
          }
        />
      </label>

      {decision && (
        <p className={decision.placement === technology.placement ? 'message success' : 'message warning'} role="status">
          {decision.placement === technology.placement
            ? `수업 카탈로그의 기본 분류도 ‘${placementLabels[technology.placement]}’입니다.`
            : `수업 카탈로그에서는 ‘${placementLabels[technology.placement]}’로 분류합니다. 필요한 조건과 학교 주변의 제한을 다시 확인해 보세요.`}
        </p>
      )}
    </details>
  );
}
