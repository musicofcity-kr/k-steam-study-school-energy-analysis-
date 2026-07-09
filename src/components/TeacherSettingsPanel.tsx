import type { TeacherAssumptions } from '../types';

type TeacherSettingsPanelProps = {
  assumptions: TeacherAssumptions;
  onAssumptionsChange: (assumptions: TeacherAssumptions) => void;
};

export function TeacherSettingsPanel({ assumptions, onAssumptionsChange }: TeacherSettingsPanelProps) {
  const setValue = (key: keyof TeacherAssumptions, value: number) => {
    const safeValue =
      key === 'savingMaxRate'
        ? Math.min(100, Math.max(0, value))
        : key === 'solarActiveStartHour' || key === 'solarActiveEndHour'
          ? Math.min(23, Math.max(0, Math.round(value)))
          : Math.max(0, value);
    onAssumptionsChange({ ...assumptions, [key]: safeValue });
  };

  return (
    <section className="teacher-section" id="teacher-settings">
      <details>
        <summary>교사용 설정 패널 열기</summary>
        <div className="teacher-grid">
          <NumberInput
            label="태양광 100% 설치 시 시간당 평균 공급 kWh"
            value={assumptions.solarMaxKWhPerHour}
            onChange={(value) => setValue('solarMaxKWhPerHour', value)}
          />
          <NumberInput
            label="수소 100% 활용 시 시간당 평균 공급 kWh"
            value={assumptions.hydrogenMaxKWhPerHour}
            onChange={(value) => setValue('hydrogenMaxKWhPerHour', value)}
          />
          <NumberInput
            label="차세대 원자력 100% 활용 시 시간당 평균 공급 kWh"
            value={assumptions.nuclearMaxKWhPerHour}
            onChange={(value) => setValue('nuclearMaxKWhPerHour', value)}
          />
          <NumberInput label="에너지 절감 최대 비율 %" value={assumptions.savingMaxRate} max={100} onChange={(value) => setValue('savingMaxRate', value)} />
          <NumberInput label="탄소배출계수 입력값 kgCO2/kWh" value={assumptions.gridEmissionFactor} step={0.01} onChange={(value) => setValue('gridEmissionFactor', value)} />
          <NumberInput label="태양광 발전 가능 시작 시간" value={assumptions.solarActiveStartHour} step={1} max={23} onChange={(value) => setValue('solarActiveStartHour', value)} />
          <NumberInput label="태양광 발전 가능 끝 시간" value={assumptions.solarActiveEndHour} step={1} max={23} onChange={(value) => setValue('solarActiveEndHour', value)} />
        </div>
        <p className="model-note">
          이 값은 수업용 비교를 위한 가정값입니다. 실제 도시 설계에는 지역 일사량, 설치 면적, 설비 효율, 법·안전 기준, 비용 분석 등이 추가로 필요합니다.
          수업용 단순화로 시간당 평균 공급량을 전체 데이터 시간 수에 곱해 비교합니다. 태양광 시간대 음영은 오개념 방지용 시각 보조이며 공급량 계산은 바꾸지 않습니다.
        </p>
      </details>
    </section>
  );
}

function NumberInput({
  label,
  value,
  step = 10,
  max,
  onChange
}: {
  label: string;
  value: number;
  step?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="number-input">
      <span>{label}</span>
      <input type="number" min="0" max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
