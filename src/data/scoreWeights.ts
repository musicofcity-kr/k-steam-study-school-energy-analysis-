// 모든 계수는 수업용 비교 설정값이며 과학적 공식값이 아닙니다.
// 교사는 수업 목표에 따라 이 계수를 조정할 수 있고, 실제 정책 평가로 사용하면 안 됩니다.
export const scoreWeights = {
  diversity: {
    activePartScore: 16,
    balanceScale: 0.2,
    dominancePenalty: 0.25
  },
  stability: {
    base: 20,
    ess: 0.45,
    saving: 0.4,
    hydrogen: 0.12,
    smartControl: 0.15,
    diversity: 0.2
  },
  environmental: {
    // 태양광과 절감은 중1 수업에서 직접 떠올리기 쉬운 저탄소 전략으로 크게 반영한다.
    base: 25,
    solar: 0.38,
    saving: 0.75,
    ess: 0.12,
    smartControl: 0.15,
    // 수소는 재생전력 기반 생산을 가정한 경우에만 작은 가산을 둔다.
    greenHydrogen: 0.08
  },
  realism: {
    // 학교 공간에서 상상하기 쉬운 태양광, ESS, 절감은 현실성에 가산한다.
    base: 55,
    solar: 0.2,
    ess: 0.18,
    saving: 0.75,
    smartControl: 0.15,
    // 조건부 지역 인프라가 필요한 수소 연료전지는 설치 난이도 토론을 위해 감산한다.
    hydrogenPenalty: 0.08
  }
} as const;
