import type { EnergyScenario, ScenarioResult, TeacherAssumptions } from '../types';
import { ScenarioResultPanel } from './ScenarioResultPanel';

type DesignLabSectionProps = {
  scenario: EnergyScenario;
  assumptions: TeacherAssumptions;
  result: ScenarioResult;
  onScenarioChange: (scenario: EnergyScenario) => void;
};

export function DesignLabSection({ scenario, assumptions, result, onScenarioChange }: DesignLabSectionProps) {
  const setScenarioValue = (key: keyof EnergyScenario, value: number) => {
    onScenarioChange({ ...scenario, [key]: value });
  };

  return (
    <section className="design-section" id="design-lab">
      <div className="section-heading">
        <p className="eyebrow">미션 4</p>
        <h2>4 도시 설계 랩</h2>
        <p>슬라이더를 움직이며 에너지 조합이 자립률과 점수에 어떤 영향을 주는지 비교합니다.</p>
      </div>

      <div className="design-grid">
        <div className="control-panel">
          <h3>설계 조절 패널</h3>
          <Slider color="solar" label="태양광 설치 규모" value={scenario.solarLevel} max={100} onChange={(value) => setScenarioValue('solarLevel', value)} hint="학교 옥상, 체육관, 주차장 지붕 등에 설치" />
          <Slider color="ess" label="ESS (전기 저장소)" value={scenario.essLevel} max={100} onChange={(value) => setScenarioValue('essLevel', value)} hint="남는 전기를 저장해 피크 시간에 대응" badge="발전 아님 · 저장 담당" />
          <Slider color="hydrogen" label="수소 에너지 활용" value={scenario.hydrogenLevel} max={100} onChange={(value) => setScenarioValue('hydrogenLevel', value)} hint="장시간 안정적 전력 공급 보조" />
          <Slider color="nuclear" label="차세대 원자력 활용" value={scenario.nuclearLevel} max={100} onChange={(value) => setScenarioValue('nuclearLevel', value)} hint="미래 기술 검토용 가상 선택지" />
          <Slider color="saving" label="에너지 절감률" value={scenario.savingRate} max={assumptions.savingMaxRate} onChange={(value) => setScenarioValue('savingRate', value)} hint="LED, 단열, 냉난방 효율, 대기전력 줄이기" />
        </div>

        <div className="city-panel">
          <h3>미래 학교구역 시각화</h3>
          <SchoolZoneVisual scenario={scenario} />
          <p>
            외부 전력망은 부족분을 토론하기 위한 보조 개념이며, 에너지 자립률 계산에는 포함하지 않습니다.
          </p>
        </div>

        <ScenarioResultPanel scenario={scenario} result={result} />
      </div>
    </section>
  );
}

function Slider({
  color,
  label,
  value,
  max,
  hint,
  badge,
  onChange
}: {
  color: 'solar' | 'ess' | 'hydrogen' | 'nuclear' | 'saving';
  label: string;
  value: number;
  max: number;
  hint: string;
  badge?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className={`slider-row slider-${color}`}>
      <span>
        <strong>
          <span className="energy-dot" aria-hidden="true" />
          {label}
          {badge && <em>{badge}</em>}
        </strong>
        <small>{hint}</small>
      </span>
      <output>{value}%</output>
      <input type="range" min="0" max={max} step="5" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SchoolZoneVisual({ scenario }: { scenario: EnergyScenario }) {
  const solarWidth = 30 + scenario.solarLevel * 0.4;
  const essHeight = 20 + scenario.essLevel * 0.45;
  const treeCount = Math.max(2, Math.round(scenario.savingRate / 10) + 2);

  return (
    <svg className="school-visual" viewBox="0 0 520 260" role="img" aria-label="미래 학교구역 에너지 설계 시각화">
      <rect x="0" y="0" width="520" height="260" rx="8" fill="#e0f2fe" />
      <rect x="40" y="168" width="440" height="52" fill="#86efac" />
      <rect x="90" y="86" width="190" height="92" rx="6" fill="#f8fafc" stroke="#334155" strokeWidth="3" />
      <rect x="116" y="112" width="34" height="28" fill="#bfdbfe" />
      <rect x="164" y="112" width="34" height="28" fill="#bfdbfe" />
      <rect x="212" y="112" width="34" height="28" fill="#bfdbfe" />
      <polygon points="78,86 292,86 258,52 112,52" fill="#475569" />
      <rect x="118" y="58" width={solarWidth} height="18" rx="3" fill="#facc15" />
      <rect x="314" y={170 - essHeight} width="70" height={essHeight} rx="6" fill="#22c55e" stroke="#166534" strokeWidth="3" />
      <text x="321" y="188" fill="#052e16" fontSize="18" fontWeight="700">
        ESS
      </text>
      <circle cx="420" cy="82" r={18 + scenario.hydrogenLevel * 0.08} fill="#67e8f9" stroke="#0e7490" strokeWidth="3" />
      <text x="394" y="126" fill="#155e75" fontSize="16" fontWeight="700">
        수소
      </text>
      {scenario.nuclearLevel > 0 && (
        <g>
          <rect x="382" y="145" width="58" height="34" rx="5" fill="#c4b5fd" stroke="#6d28d9" strokeWidth="3" />
          <text x="390" y="166" fill="#4c1d95" fontSize="13" fontWeight="700">
            검토
          </text>
        </g>
      )}
      {Array.from({ length: treeCount }).map((_, index) => (
        <g key={index} transform={`translate(${62 + index * 36} 168)`}>
          <rect x="10" y="16" width="8" height="22" fill="#854d0e" />
          <circle cx="14" cy="12" r="15" fill="#16a34a" />
        </g>
      ))}
      <text x="42" y="240" fill="#0f172a" fontSize="16" fontWeight="700">
        태양광 {scenario.solarLevel}% · ESS (전기 저장소) {scenario.essLevel}% · 절감 {scenario.savingRate}%
      </text>
    </svg>
  );
}
