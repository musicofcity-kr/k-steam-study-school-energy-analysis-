import type { EnergyScenario, ScenarioResult, TeacherAssumptions } from '../types';

export type FutureSchoolSystemSectionProps = {
  scenario: EnergyScenario;
  assumptions: TeacherAssumptions;
  result: ScenarioResult;
};

export function FutureSchoolSystemSection({ scenario, assumptions, result }: FutureSchoolSystemSectionProps) {
  const effectiveEssCapacity = assumptions.essMaxCapacityKWh * (scenario.essLevel / 100);
  const stateOfChargeKWh = result.sourceBreakdown.essEndStateOfChargeKWh;
  const stateOfChargeRate = effectiveEssCapacity > 0 ? Math.min(1, stateOfChargeKWh / effectiveEssCapacity) : 0;
  const batteryFillWidth = 74 * stateOfChargeRate;

  return (
    <div className="city-panel">
      <h3>미래학교 에너지 시스템</h3>
      <svg
        className="school-visual"
        viewBox="0 0 640 300"
        role="img"
        aria-label="태양광에서 스마트 관리와 ESS를 거쳐 학교에 전기를 공급하고 외부 전력망과 조건부 수소를 연결한 미래학교 시스템"
      >
        <defs>
          <marker id="ecity-flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2a48" />
          </marker>
          <marker id="ecity-grid-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        <rect x="0" y="0" width="640" height="300" rx="8" fill="#f8fafc" />
        <rect x="14" y="36" width="116" height="72" rx="6" fill="#fff7d7" stroke="#d97706" strokeWidth="2" />
        <text x="72" y="62" textAnchor="middle" fill="#92400e" fontSize="15" fontWeight="700">태양광</text>
        <text x="72" y="84" textAnchor="middle" fill="#92400e" fontSize="13">{scenario.solarLevel}%</text>
        <text x="72" y="101" textAnchor="middle" fill="#92400e" fontSize="11">{result.sourceBreakdown.solarGeneratedKWh} kWh 생산</text>

        <rect x="164" y="36" width="126" height="72" rx="6" fill="#eaf4ff" stroke="#2563eb" strokeWidth="2" />
        <text x="227" y="62" textAnchor="middle" fill="#1e3a8a" fontSize="15" fontWeight="700">스마트 관리</text>
        <text x="227" y="86" textAnchor="middle" fill="#1e3a8a" fontSize="13">{scenario.smartControlLevel}%</text>

        <rect x="324" y="36" width="126" height="72" rx="6" fill="#efeefd" stroke="#6d5ce7" strokeWidth="2" />
        <text x="387" y="59" textAnchor="middle" fill="#4c3fc7" fontSize="15" fontWeight="700">ESS</text>
        <rect x="345" y="72" width="78" height="16" rx="3" fill="#ffffff" stroke="#4c3fc7" />
        <rect x="347" y="74" width={batteryFillWidth} height="12" rx="2" fill="#7b6cf6" />
        <rect x="423" y="76" width="5" height="8" rx="1" fill="#4c3fc7" />
        <text x="387" y="101" textAnchor="middle" fill="#4c3fc7" fontSize="11">잔량 {stateOfChargeKWh} kWh</text>

        <rect x="484" y="36" width="140" height="72" rx="6" fill="#ecfdf5" stroke="#15803d" strokeWidth="2" />
        <text x="554" y="62" textAnchor="middle" fill="#166534" fontSize="15" fontWeight="700">학교</text>
        <text x="554" y="84" textAnchor="middle" fill="#166534" fontSize="11">지역 직접 사용</text>
        <text x="554" y="101" textAnchor="middle" fill="#166534" fontSize="11">{result.sourceBreakdown.directLocalUseKWh} kWh</text>

        <line x1="130" y1="72" x2="164" y2="72" stroke="#1f2a48" strokeWidth="3" markerEnd="url(#ecity-flow-arrow)" />
        <line x1="290" y1="62" x2="324" y2="62" stroke="#1f2a48" strokeWidth="3" markerEnd="url(#ecity-flow-arrow)" />
        <line x1="324" y1="88" x2="290" y2="88" stroke="#1f2a48" strokeWidth="3" markerEnd="url(#ecity-flow-arrow)" />
        <line x1="450" y1="72" x2="484" y2="72" stroke="#1f2a48" strokeWidth="3" markerEnd="url(#ecity-flow-arrow)" />
        <text x="307" y="48" textAnchor="middle" fill="#475569" fontSize="10">낮 충전</text>
        <text x="307" y="105" textAnchor="middle" fill="#475569" fontSize="10">필요할 때 방전</text>

        <rect x="18" y="178" width="160" height="78" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
        <text x="98" y="202" textAnchor="middle" fill="#1e3a8a" fontSize="15" fontWeight="700">외부 전력망 연결</text>
        <text x="98" y="225" textAnchor="middle" fill="#1e3a8a" fontSize="12">자동 보충 {result.gridImportKWh} kWh</text>
        <text x="98" y="245" textAnchor="middle" fill="#1e3a8a" fontSize="11">지역 충당률에 포함 안 함</text>
        <path d="M 178 217 L 470 217 L 520 108" fill="none" stroke="#2563eb" strokeWidth="3" markerEnd="url(#ecity-grid-arrow)" />

        <rect x="456" y="178" width="168" height="78" rx="6" fill="#ecfeff" stroke="#0e7490" strokeWidth="2" strokeDasharray="7 5" />
        <text x="540" y="201" textAnchor="middle" fill="#155e75" fontSize="14" fontWeight="700">구역 가장자리</text>
        <text x="540" y="221" textAnchor="middle" fill="#155e75" fontSize="12">조건부 수소 연료전지</text>
        <text x="540" y="242" textAnchor="middle" fill="#155e75" fontSize="11">설계 {scenario.hydrogenFuelCellLevel}% · 생산·입지 확인</text>
        <path d="M 456 196 L 410 140 L 484 94" fill="none" stroke="#0e7490" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#ecity-flow-arrow)" />

        <text x="320" y="278" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="700">
          ESS 충전 {result.sourceBreakdown.essChargeKWh} kWh · 방전 {result.sourceBreakdown.essDischargeKWh} kWh
        </text>
        <text x="320" y="294" textAnchor="middle" fill="#334155" fontSize="11">
          마지막 저장 {stateOfChargeKWh} kWh · 밤 외부망 의존 {result.nightGridDependent ? '있음' : '없음'}
        </text>
      </svg>
      <p>외부 전력망은 실패가 아니라 부족한 전기를 보충하는 연결입니다. 수소는 어떻게 만들었는지도 확인해야 합니다.</p>
    </div>
  );
}
