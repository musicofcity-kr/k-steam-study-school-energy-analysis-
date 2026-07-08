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
    nuclear: 0.08,
    diversity: 0.2
  },
  environmental: {
    // 태양광과 절감은 중1 수업에서 직접 떠올리기 쉬운 저탄소 전략으로 크게 반영한다.
    base: 25,
    solar: 0.38,
    saving: 0.75,
    ess: 0.12,
    // 수소와 차세대 원자력은 토론용 선택지이므로 작은 가산만 둔다.
    hydrogen: 0.08,
    nuclear: 0.04
  },
  realism: {
    // 학교 공간에서 상상하기 쉬운 태양광, ESS, 절감은 현실성에 가산한다.
    base: 55,
    solar: 0.2,
    ess: 0.18,
    saving: 0.75,
    // 미래 인프라 논의가 필요한 기술은 설치 난이도 토론을 위해 감산한다.
    hydrogenPenalty: 0.08,
    nuclearPenalty: 0.15
  }
} as const;
