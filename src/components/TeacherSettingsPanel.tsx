import type { TeacherAssumptions } from '../types';

export type TeacherSettingsPanelProps = {
  assumptions: TeacherAssumptions;
  onAssumptionsChange: (assumptions: TeacherAssumptions) => void;
};

export function TeacherSettingsPanel({ assumptions, onAssumptionsChange }: TeacherSettingsPanelProps) {
  const setValue = (key: keyof TeacherAssumptions, value: number) => {
    const safeValue =
      key === 'essRoundTripEfficiency'
        ? Math.min(1, Math.max(0, value))
        : key === 'smartControlMaxPeakSavingRate' || key === 'savingMaxRate'
          ? Math.min(100, Math.max(0, value))
          : key === 'solarActiveStartHour' || key === 'solarActiveEndHour'
            ? Math.min(23, Math.max(0, Math.round(value)))
            : Math.max(0, value);
    onAssumptionsChange({ ...assumptions, [key]: safeValue });
  };

  const setHydrogenSource = (hydrogenSource: TeacherAssumptions['hydrogenSource']) => {
    onAssumptionsChange({ ...assumptions, hydrogenSource });
  };

  return (
    <section className="teacher-section" id="teacher-settings">
      <details>
        <summary>교사용 설정 패널 열기</summary>
        <div className="teacher-grid">
          <NumberInput
            label="태양광 활동 시간 100% 설치 시 공급량 (수업용 가정값, kWh/시간)"
            value={assumptions.solarMaxKWhPerActiveHour}
            onChange={(value) => setValue('solarMaxKWhPerActiveHour', value)}
          />
          <NumberInput
            label="조건부 수소 연료전지 100% 공급량 (수업용 가정값, kWh/시간)"
            value={assumptions.hydrogenMaxKWhPerHour}
            onChange={(value) => setValue('hydrogenMaxKWhPerHour', value)}
          />
          <NumberInput
            label="ESS 최대 저장 용량 (수업용 가정값, kWh)"
            value={assumptions.essMaxCapacityKWh}
            onChange={(value) => setValue('essMaxCapacityKWh', value)}
          />
          <NumberInput
            label="ESS 시간당 최대 충전량 (수업용 가정값, kWh)"
            value={assumptions.essMaxChargeKWhPerHour}
            onChange={(value) => setValue('essMaxChargeKWhPerHour', value)}
          />
          <NumberInput
            label="ESS 시간당 최대 방전량 (수업용 가정값, kWh)"
            value={assumptions.essMaxDischargeKWhPerHour}
            onChange={(value) => setValue('essMaxDischargeKWhPerHour', value)}
          />
          <NumberInput
            label="ESS 왕복 효율 (수업용 가정값, 0~1)"
            value={assumptions.essRoundTripEfficiency}
            step={0.01}
            max={1}
            onChange={(value) => setValue('essRoundTripEfficiency', value)}
          />
          <NumberInput
            label="스마트 관리 최대 피크 추가 절감률 (수업용 가정값, %)"
            value={assumptions.smartControlMaxPeakSavingRate}
            step={1}
            max={100}
            onChange={(value) => setValue('smartControlMaxPeakSavingRate', value)}
          />
          <NumberInput
            label="에너지 절감 최대 비율 (수업용 가정값, %)"
            value={assumptions.savingMaxRate}
            step={1}
            max={100}
            onChange={(value) => setValue('savingMaxRate', value)}
          />
          <NumberInput
            label="전력망 배출계수 (수업용 가정값, kgCO2/kWh)"
            value={assumptions.gridEmissionFactor}
            step={0.01}
            onChange={(value) => setValue('gridEmissionFactor', value)}
          />
          <NumberInput
            label="태양광 발전 시작 시간 (수업용 가정값, 0~23시)"
            value={assumptions.solarActiveStartHour}
            step={1}
            max={23}
            onChange={(value) => setValue('solarActiveStartHour', value)}
          />
          <NumberInput
            label="태양광 발전 끝 시간 (수업용 가정값, 0~23시)"
            value={assumptions.solarActiveEndHour}
            step={1}
            max={23}
            onChange={(value) => setValue('solarActiveEndHour', value)}
          />
          <label className="number-input">
            <span>수소 생산 방식 (수업용 가정값)</span>
            <select
              value={assumptions.hydrogenSource}
              aria-label="수소 생산 방식 (수업용 가정값)"
              onChange={(event) => setHydrogenSource(event.target.value as TeacherAssumptions['hydrogenSource'])}
            >
              <option value="unspecified">미확인 · 환경성 가산 없음</option>
              <option value="mixed">혼합 방식 · 환경성 중립</option>
              <option value="green">재생전력 기반 생산 가정</option>
            </select>
          </label>
        </div>
        <p className="model-note">
          모든 값은 수업용 비교 모델의 가정값입니다. 실제 적용에는 일사량, 설치 면적, 설비 효율, 배터리 운전 조건, 수소 생산 방식, 법·안전 기준과 비용 조사가 추가로 필요합니다.
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
      <input
        type="number"
        min="0"
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
