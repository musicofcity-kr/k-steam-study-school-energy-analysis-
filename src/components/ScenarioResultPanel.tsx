import { useState } from 'react';
import type { EnergyScenario, ScenarioResult } from '../types';
import { buildWorksheetCopyText, buildWorksheetValueRows } from '../utils/worksheetSummary';

export type ScenarioResultPanelProps = {
  result: ScenarioResult;
  scenario: EnergyScenario;
};

export function ScenarioResultPanel({ result, scenario }: ScenarioResultPanelProps) {
  const [copyMessage, setCopyMessage] = useState('');
  const worksheetRows = buildWorksheetValueRows(scenario, result);
  const hasSurplus = result.surplusKWh > 0;

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
      <h3>설계 결과</h3>
      <div className="result-hero">
        <LocalSupplyGauge rate={result.localSupplyRate} />
        <CityLights rate={result.localSupplyRate} />
      </div>

      <div className="score-grid" aria-label="핵심 설계 결과">
        <PrimaryMetric label="지역 에너지 충당률" value={`${result.localSupplyRate}%`} />
        <PrimaryMetric label="외부 전력망 사용량" value={`${result.gridImportKWh} kWh`} />
        <PrimaryMetric
          label="피크 대응 정도"
          value={`${result.stabilityScore}점`}
          note={`피크 외부망 최대 ${result.peakGridImportKWh} kWh`}
        />
      </div>

      <details className="worksheet-card">
        <summary>상세 비교 보기</summary>
        <div className="score-grid">
          <Score label="다양성 점수" value={result.diversityScore} />
          <Score label="환경성 점수" value={result.environmentalScore} />
          <Score label="현실성 점수" value={result.realismScore} />
        </div>
      </details>

      <details className="worksheet-card">
        <summary>에너지 수지 보기</summary>
        <dl>
          <EnergyBalanceRow label="태양광 생산량" value={`${result.sourceBreakdown.solarGeneratedKWh} kWh`} />
          <EnergyBalanceRow label="조건부 수소 생산량" value={`${result.sourceBreakdown.hydrogenGeneratedKWh} kWh`} />
          <EnergyBalanceRow label="지역 전력 직접 사용량" value={`${result.sourceBreakdown.directLocalUseKWh} kWh`} />
          <EnergyBalanceRow label="ESS 충전량" value={`${result.sourceBreakdown.essChargeKWh} kWh`} />
          <EnergyBalanceRow label="ESS 방전량" value={`${result.sourceBreakdown.essDischargeKWh} kWh`} />
          <EnergyBalanceRow label="ESS 마지막 저장량" value={`${result.sourceBreakdown.essEndStateOfChargeKWh} kWh`} />
          <EnergyBalanceRow label="외부 전력망 사용량" value={`${result.gridImportKWh} kWh`} />
          <EnergyBalanceRow label="잉여 전력" value={`${result.surplusKWh} kWh`} />
          <EnergyBalanceRow label="밤 시간 외부 전력 의존" value={result.nightGridDependent ? '있음' : '없음'} />
        </dl>
      </details>

      {hasSurplus && (
        <p className="surplus-note">
          잉여 전력 {result.surplusKWh} kWh · 저장하지 못한 전력을 이웃 지역과 나누는 방법을 토론해 보세요.
        </p>
      )}
      {result.gridImportKWh > 0 && (
        <p className="grid-import-note">
          외부 전력망 사용량: {result.gridImportKWh} kWh · 전력망 연결은 부족분을 보충하는 정상적인 시스템입니다.
        </p>
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
        {copyMessage && <p className="copy-message" role="status" aria-live="polite">{copyMessage}</p>}
      </details>

      <p className="student-explanation">{buildLocalSupplyExplanation(result)}</p>
      <p className="model-note">지역 에너지 충당률과 점수는 실제 설계값이 아니라 수업용 비교 모델의 결과입니다.</p>
    </div>
  );
}

function LocalSupplyGauge({ rate }: { rate: number }) {
  const displayRate = Math.min(100, Math.max(0, rate));
  const circumference = 2 * Math.PI * 58;
  const dash = (displayRate / 100) * circumference;

  return (
    <div className="self-gauge" aria-label={`지역 에너지 충당률 ${rate}%`}>
      <svg viewBox="0 0 160 160" role="img" aria-hidden="true">
        <circle cx="80" cy="80" r="58" />
        <circle cx="80" cy="80" r="58" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <strong>{rate}%</strong>
      <span>지역 에너지 충당률</span>
    </div>
  );
}

function CityLights({ rate }: { rate: number }) {
  const activeGroups = Math.ceil(Math.min(100, Math.max(0, rate)) / 20);

  return (
    <svg className="city-lights" viewBox="0 0 220 150" role="img" aria-label="지역 에너지 충당률에 따라 밝아지는 미래학교 구역">
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

function PrimaryMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{value}점</strong>
      <meter min="0" max="100" value={Math.min(100, Math.max(0, value))} aria-label={`${label} ${value}점`} />
    </div>
  );
}

function EnergyBalanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function buildLocalSupplyExplanation(result: ScenarioResult): string {
  if (result.summary.rowCount === 0) {
    return '전력 사용 데이터를 불러오면 지역 에너지 충당률, 외부 전력망 사용량과 밤 시간 의존 여부를 계산합니다.';
  }

  const gridSentence =
    result.gridImportKWh > 0
      ? `부족한 ${result.gridImportKWh} kWh는 외부 전력망에서 공급받습니다.`
      : '이 설계에서는 외부 전력망에서 가져온 전기가 없습니다.';
  const nightSentence = result.nightGridDependent
    ? '밤에는 외부 전력망에도 의존하므로 ESS 용량과 절감 전략을 함께 살펴보세요.'
    : '밤에도 외부 전력망에 의존하지 않는 결과가 나왔습니다.';

  return `지역 에너지 충당률은 ${result.localSupplyRate}%입니다. ${gridSentence} ${nightSentence}`;
}
