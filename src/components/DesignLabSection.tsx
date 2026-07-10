import type { CSSProperties } from 'react';
import type { EnergyScenario, ScenarioResult, TeacherAssumptions } from '../types';
import { FutureSchoolSystemSection } from './FutureSchoolSystemSection';
import { ScenarioResultPanel } from './ScenarioResultPanel';

export type ScenarioSlotId = 'A' | 'B';
export type SavedScenarios = Partial<Record<ScenarioSlotId, EnergyScenario>>;

export type DesignLabSectionProps = {
  scenario: EnergyScenario;
  assumptions: TeacherAssumptions;
  result: ScenarioResult;
  savedScenarios?: SavedScenarios;
  selectedScenarioId?: ScenarioSlotId;
  locked?: boolean;
  onScenarioChange: (scenario: EnergyScenario) => void;
  onSaveScenario?: (id: ScenarioSlotId, scenario: EnergyScenario) => void;
  onLoadScenario?: (id: ScenarioSlotId) => void;
  onSelectScenario?: (id: ScenarioSlotId) => void;
};

const scenarioSlotIds: ScenarioSlotId[] = ['A', 'B'];

export function DesignLabSection({
  scenario,
  assumptions,
  result,
  savedScenarios = {},
  selectedScenarioId,
  locked = false,
  onScenarioChange,
  onSaveScenario,
  onLoadScenario,
  onSelectScenario
}: DesignLabSectionProps) {
  const setScenarioValue = (key: keyof EnergyScenario, value: number) => {
    onScenarioChange({ ...scenario, [key]: value });
  };

  const loadScenario = (id: ScenarioSlotId) => {
    const savedScenario = savedScenarios[id];
    if (!savedScenario) {
      return;
    }

    onScenarioChange(savedScenario);
    onLoadScenario?.(id);
  };

  return (
    <section className="design-section" id="design-lab">
      <div className="section-heading">
        <p className="eyebrow">미션 4</p>
        <h2>4 도시 설계 랩</h2>
        <p>발전·저장·절감·관리와 외부 전력망을 연결해 2050 미래학교 에너지 시스템을 설계합니다.</p>
      </div>
      {locked && <p className="message warning" role="status">미션 3에서 데이터와 피크 원인을 먼저 확인하세요.</p>}

      {!locked && <div className="design-grid">
        <div className="control-panel">
          <h3>설계 조절 패널</h3>
          <Slider
            color="solar"
            label="학교 지붕·주차장 태양광"
            value={scenario.solarLevel}
            onChange={(value) => setScenarioValue('solarLevel', value)}
            hint="설정된 낮 시간에만 전기를 생산"
            disabled={locked}
          />
          <Slider
            color="ess"
            label="ESS (전기 저장소) 용량"
            value={scenario.essLevel}
            onChange={(value) => setScenarioValue('essLevel', value)}
            hint="낮에 남는 전기를 저장해 필요한 시간에 사용"
            badge="발전 아님 · 저장 담당"
            disabled={locked}
          />
          <Slider
            color="hydrogen"
            label="조건부 수소 연료전지"
            value={scenario.hydrogenFuelCellLevel}
            onChange={(value) => setScenarioValue('hydrogenFuelCellLevel', value)}
            hint="생산 방식과 입지 조건을 확인한 뒤 구역 가장자리에서 활용"
            disabled={locked}
          />
          <Slider
            color="saving"
            label="에너지 절감"
            value={scenario.savingRate}
            max={assumptions.savingMaxRate}
            onChange={(value) => setScenarioValue('savingRate', value)}
            hint="LED, 단열, 냉난방 효율, 대기전력 줄이기"
            disabled={locked}
          />
          <Slider
            color="smart"
            label="스마트 에너지 관리"
            value={scenario.smartControlLevel}
            onChange={(value) => setScenarioValue('smartControlLevel', value)}
            hint="발전량을 만들지 않고 피크 시간 사용과 ESS 운전을 조정"
            badge="관리 담당"
            disabled={locked}
          />

          <div className="mission-action-panel" aria-label="설계안 A/B 저장과 최종 선택">
            <strong>설계안 A/B</strong>
            {scenarioSlotIds.map((id) => {
              const savedScenario = savedScenarios[id];
              const isSelected = selectedScenarioId === id;

              return (
                <div key={id}>
                  <p>
                    <strong>설계안 {id}</strong> · {savedScenario ? summarizeScenario(savedScenario) : '비어 있음'}
                  </p>
                  <div className="toolbar">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => onSaveScenario?.(id, scenario)}
                      disabled={locked || !onSaveScenario}
                      aria-label={`현재 설정을 설계안 ${id}에 저장`}
                    >
                      {id}에 저장
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => loadScenario(id)}
                      disabled={locked || !savedScenario}
                      aria-label={`저장된 설계안 ${id} 불러오기`}
                    >
                      {id} 불러오기
                    </button>
                    <button
                      className={isSelected ? 'primary-button' : 'secondary-button'}
                      type="button"
                      onClick={() => onSelectScenario?.(id)}
                      disabled={locked || !savedScenario || !onSelectScenario}
                      aria-pressed={isSelected}
                      aria-label={`설계안 ${id}를 최종 설계로 선택`}
                    >
                      {isSelected ? `${id} 최종 선택됨` : `${id} 최종 선택`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <FutureSchoolSystemSection scenario={scenario} assumptions={assumptions} result={result} />

        <ScenarioResultPanel scenario={scenario} result={result} />
      </div>}
    </section>
  );
}

function summarizeScenario(scenario: EnergyScenario): string {
  return [
    `태양광 ${scenario.solarLevel}%`,
    `ESS ${scenario.essLevel}%`,
    `수소 ${scenario.hydrogenFuelCellLevel}%`,
    `절감 ${scenario.savingRate}%`,
    `관리 ${scenario.smartControlLevel}%`
  ].join(' · ');
}

function Slider({
  color,
  label,
  value,
  max = 100,
  hint,
  badge,
  disabled = false,
  onChange
}: {
  color: 'solar' | 'ess' | 'hydrogen' | 'saving' | 'smart';
  label: string;
  value: number;
  max?: number;
  hint: string;
  badge?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const energyColor = color === 'smart' ? ({ '--energy-color': '#2563eb' } as CSSProperties) : undefined;

  return (
    <label className={`slider-row slider-${color}`} style={energyColor}>
      <span>
        <strong>
          <span className="energy-dot" aria-hidden="true" />
          {label}
          {badge && <em>{badge}</em>}
        </strong>
        <small>{hint}</small>
      </span>
      <output>{value}%</output>
      <input
        type="range"
        min="0"
        max={max}
        step="5"
        value={value}
        aria-label={`${label} 비율`}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
