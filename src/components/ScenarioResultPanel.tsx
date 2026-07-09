import { useState } from 'react';
import type { EnergyScenario, ScenarioResult } from '../types';
import { buildStudentExplanation } from '../utils/energyModel';
import { buildWorksheetCopyText, buildWorksheetValueRows } from '../utils/worksheetSummary';

type ScenarioResultPanelProps = {
  result: ScenarioResult;
  scenario: EnergyScenario;
};

export function ScenarioResultPanel({ result, scenario }: ScenarioResultPanelProps) {
  const [copyMessage, setCopyMessage] = useState('');
  const worksheetRows = buildWorksheetValueRows(scenario, result);

  const copyWorksheetValues = async () => {
    try {
      await navigator.clipboard.writeText(buildWorksheetCopyText(scenario, result));
      setCopyMessage('활동지에 적을 값을 복사했어요.');
    } catch {
      setCopyMessage('복사하지 못했어요. 값을 직접 보고 적어 주세요.');
    }
  };

  return (
    <div className="result-panel">
      <h3>에너지 자립률</h3>
      <div className="result-hero">
        <SelfSufficiencyGauge result={result} />
        <CityLights rate={Math.min(100, result.selfSufficiencyRate)} />
      </div>
      <div className="score-grid">
        <Score
          label="에너지 자립률"
          value={result.isSurplus ? 100 : result.selfSufficiencyRate}
          displayValue={result.isSurplus ? '100% 달성' : `${result.selfSufficiencyRate}%`}
        />
        <Score label="피크 대응 점수" value={result.stabilityScore} suffix="점" />
        <Score label="다양성 점수" value={result.diversityScore} suffix="점" />
        <Score label="환경성 점수" value={result.environmentalScore} suffix="점" />
        <Score label="현실성 점수" value={result.realismScore} suffix="점" />
      </div>
      <div className="breakdown">
        <p>
          절감 후 소비량 <strong>{result.reducedUsageKWh} kWh</strong>
        </p>
        <p>
          공급 가능 전력 <strong>{result.supplyKWh} kWh</strong>
        </p>
        <p>
          ESS 공급량 합산 안 함 <strong>{result.sourceBreakdown.essKWh} kWh</strong>
        </p>
      </div>
      {result.isSurplus && (
        <p className="surplus-note">
          잉여 전력 {result.surplusKWh} kWh — 이 전기를 저장하거나 이웃 지역과 나누는 방법을 토론해 보세요.
        </p>
      )}
      {!result.isSurplus && result.gridImportKWh > 0 && (
        <p className="grid-import-note">외부 전력망에서 가져오는 전기: {result.gridImportKWh} kWh</p>
      )}
      <details className="worksheet-card">
        <summary>활동지에 적을 값</summary>
        <dl>
          {worksheetRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <button className="secondary-button" type="button" onClick={copyWorksheetValues}>
          복사
        </button>
        {copyMessage && <p className="copy-message">{copyMessage}</p>}
      </details>
      <p className="student-explanation">{buildStudentExplanation(result)}</p>
      <p className="model-note">점수는 실제 도시 설계값이 아니라 수업용 비교 지표입니다.</p>
    </div>
  );
}

function SelfSufficiencyGauge({ result }: { result: ScenarioResult }) {
  const displayRate = Math.min(100, result.selfSufficiencyRate);
  const circumference = 2 * Math.PI * 58;
  const dash = (displayRate / 100) * circumference;
  const displayText = result.isSurplus ? '100% 달성' : `${result.selfSufficiencyRate}%`;

  return (
    <div className="self-gauge" aria-label={`에너지 자립률 ${displayText}`}>
      <svg viewBox="0 0 160 160" role="img" aria-hidden="true">
        <circle cx="80" cy="80" r="58" />
        <circle cx="80" cy="80" r="58" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <strong>{displayText}</strong>
      <span>수업용 비교 지표</span>
    </div>
  );
}

function CityLights({ rate }: { rate: number }) {
  const activeGroups = Math.ceil(rate / 20);

  return (
    <svg className="city-lights" viewBox="0 0 220 150" role="img" aria-label="자립률이 오를수록 밝아지는 미래 도시">
      <rect x="22" y="66" width="28" height="58" rx="4" />
      <rect x="62" y="42" width="32" height="82" rx="4" />
      <rect x="106" y="74" width="26" height="50" rx="4" />
      <rect x="146" y="34" width="34" height="90" rx="4" />
      {[0, 1, 2, 3, 4].map((group) => (
        <g className={group < activeGroups ? 'lit' : ''} key={group}>
          {Array.from({ length: 4 }).map((_, index) => (
            <rect x={30 + group * 34} y={58 + index * 16} width="6" height="8" rx="1" key={index} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function Score({ label, value, suffix = '', displayValue }: { label: string; value: number; suffix?: string; displayValue?: string }) {
  const labelValue = displayValue ?? `${value}${suffix}`;

  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{labelValue}</strong>
      <meter min="0" max="100" value={Math.min(100, value)} aria-label={`${label} ${labelValue}`} />
    </div>
  );
}
