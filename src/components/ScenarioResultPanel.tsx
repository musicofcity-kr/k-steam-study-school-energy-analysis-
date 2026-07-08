import type { ScenarioResult } from '../types';
import { buildStudentExplanation } from '../utils/energyModel';

type ScenarioResultPanelProps = {
  result: ScenarioResult;
};

export function ScenarioResultPanel({ result }: ScenarioResultPanelProps) {
  return (
    <div className="result-panel">
      <h3>결과 요약</h3>
      <div className="score-grid">
        <Score label="에너지 자립률" value={result.selfSufficiencyRate} suffix="%" />
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
      <p className="student-explanation">{buildStudentExplanation(result)}</p>
      <p className="model-note">점수는 실제 도시 설계값이 아니라 수업용 비교 지표입니다.</p>
    </div>
  );
}

function Score({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>
        {value}
        {suffix}
      </strong>
      <meter min="0" max="100" value={Math.min(100, value)} aria-label={`${label} ${value}${suffix}`} />
    </div>
  );
}
