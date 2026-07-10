import { useState } from 'react';
import type { EnergyScenario, ReportInput, ScenarioResult } from '../types';
import {
  buildReportJson,
  getDataProvenanceLabel,
  getDataScopeLabel,
  getPlacementLabel,
  getTechnologyLabel,
  getReportPlacementDecisions
} from '../utils/reportBuilder';

const placementOrder: Array<ReportInput['placementDecisions'][number]['placement']> = [
  'onsite',
  'district-conditional',
  'external-grid'
];

type ReportSectionProps = {
  teamName: string;
  cityName: string;
  dataSource: string;
  scenario: EnergyScenario;
  result: ScenarioResult;
  keyStrategies: string[];
  reportDraft: string;
  reportInput: ReportInput;
  saveMessage: string;
  isTeacherMode?: boolean;
  locked?: boolean;
  onTeamNameChange: (value: string) => void;
  onCityNameChange: (value: string) => void;
  onKeyStrategiesChange: (value: string[]) => void;
  onReportDraftChange: (value: string) => void;
  onRegenerateReport?: () => void;
  onSaveState: () => void;
};

export function ReportSection({
  teamName,
  cityName,
  dataSource,
  scenario,
  result,
  keyStrategies,
  reportDraft,
  reportInput,
  saveMessage,
  isTeacherMode = false,
  locked = false,
  onTeamNameChange,
  onCityNameChange,
  onKeyStrategiesChange,
  onReportDraftChange,
  onRegenerateReport,
  onSaveState
}: ReportSectionProps) {
  const [actionMessage, setActionMessage] = useState('');
  const provenanceDetails = reportInput.provenanceDetails;
  const reportPlacementDecisions = getReportPlacementDecisions(reportInput);

  const updateStrategy = (index: number, value: string) => {
    const next = [...keyStrategies];
    next[index] = value;
    onKeyStrategiesChange(next);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportDraft);
      setActionMessage('보고서 초안을 클립보드에 복사했습니다.');
    } catch {
      setActionMessage('브라우저가 자동 복사를 막았어요. 보고서 내용을 선택해서 직접 복사해 주세요.');
    }
  };

  const downloadJson = () => {
    const json = buildReportJson(reportInput);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecity2050-report.json';
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('JSON 파일 저장을 시작했습니다.');
  };

  return (
    <section className="report-section" id="report">
      <div className="section-heading">
        <p className="eyebrow">미션 5</p>
        <h2>5 보고서 & 발표</h2>
        <p>데이터를 근거로 우리 팀의 설계를 설명하는 보고서를 완성하세요.</p>
      </div>
      {locked && <p className="message warning" role="status">미션 4에서 설계안 A와 B를 비교하고 최종 설계를 먼저 선택하세요.</p>}

      {!locked && <div className="report-grid">
        <div className="report-form">
          <p className="message info">실명, 학번, 연락처는 쓰지 말고 모둠 별칭만 사용하세요.</p>
          <div className="report-checklist" aria-label="보고서 완성 체크리스트">
            <ChecklistItem done={Boolean(teamName.trim())} label="모둠 별칭 정하기" />
            <ChecklistItem done={Boolean(cityName.trim())} label="도시 이름 정하기" />
            <ChecklistItem done={result.summary.rowCount > 0 && reportInput.dataProvenance !== 'unknown-upload'} label="데이터 출처 확인하기" />
            <ChecklistItem done={keyStrategies.every((strategy) => strategy.trim())} label="핵심 전략 3가지 적기" />
          </div>
          <label htmlFor="team-name">
            모둠 별칭
            <input id="team-name" value={teamName} disabled={locked} maxLength={30} onChange={(event) => onTeamNameChange(event.target.value)} placeholder="예: 태양팀 (실명·학번 금지)" />
          </label>
          <label htmlFor="city-name">
            설계한 도시 이름
            <input id="city-name" value={cityName} disabled={locked} maxLength={30} onChange={(event) => onCityNameChange(event.target.value)} placeholder="예: 솔라스쿨시티" />
          </label>
          <label htmlFor="data-source">
            사용한 데이터 출처
            <input id="data-source" value={dataSource} readOnly />
          </label>
          <div className="source-note" aria-label="데이터 출처 상세">
            <h3>데이터 출처 상세</h3>
            <dl>
              <div>
                <dt>출처 상태</dt>
                <dd>{getDataProvenanceLabel(reportInput.dataProvenance)}</dd>
              </div>
              <div>
                <dt>제공기관</dt>
                <dd>{provenanceDetails.provider.trim() || '기록 없음'}</dd>
              </div>
              <div>
                <dt>자료명</dt>
                <dd>{provenanceDetails.datasetName.trim() || '기록 없음'}</dd>
              </div>
              <div>
                <dt>기준일</dt>
                <dd>{provenanceDetails.referenceDate.trim() || '기록 없음'}</dd>
              </div>
              <div>
                <dt>지역 단위</dt>
                <dd>{provenanceDetails.regionUnit.trim() || '기록 없음'}</dd>
              </div>
              <div>
                <dt>자료 범위</dt>
                <dd>{getDataScopeLabel(provenanceDetails.scope)}</dd>
              </div>
            </dl>
          </div>
          <div className="source-note" aria-label="배치 구분 요약">
            <h3>배치 구분 요약</h3>
            {placementOrder.map((placement) => {
              const decisions = reportPlacementDecisions.filter((decision) => decision.placement === placement);

              return (
                <div key={placement}>
                  <strong>{getPlacementLabel(placement)}</strong>
                  {decisions.length === 0 ? (
                    <p>기록 없음</p>
                  ) : (
                    <ul>
                      {decisions.map((decision, index) => (
                        <li key={`${placement}-${decision.technologyId}-${index}`}>
                          {getTechnologyLabel(decision.technologyId)}: {decision.reason.trim() || '이유 기록 필요'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
          {keyStrategies.map((strategy, index) => (
            <label htmlFor={`strategy-${index}`} key={index}>
              핵심 전략 {index + 1}
              <input id={`strategy-${index}`} value={strategy} disabled={locked} maxLength={120} onChange={(event) => updateStrategy(index, event.target.value)} />
            </label>
          ))}
        </div>

        <div className="report-preview">
          <div className="report-stats">
            <span>피크 {result.summary.peakHour === null ? '-' : `${result.summary.peakHour}시`}</span>
            <span>지역 에너지 충당률 {result.localSupplyRate}%</span>
            <span>외부 전력망 {result.gridImportKWh} kWh</span>
            <span>태양광 {scenario.solarLevel}%</span>
            <span>ESS (전기 저장소) {scenario.essLevel}%</span>
          </div>
          <label htmlFor="report-draft">보고서 미리보기와 수정</label>
          <textarea id="report-draft" value={reportDraft} disabled={locked} maxLength={12000} onChange={(event) => onReportDraftChange(event.target.value)} rows={18} />
          <div className="toolbar">
            <button className="primary-button" type="button" disabled={locked} onClick={copyReport}>
              복사하기
            </button>
            <button className="secondary-button" type="button" disabled={locked} onClick={() => window.print()}>
              인쇄하기
            </button>
            {isTeacherMode && (
              <button className="secondary-button" type="button" disabled={locked} onClick={downloadJson}>
                JSON 저장
              </button>
            )}
            <button className="secondary-button" type="button" onClick={onRegenerateReport} disabled={locked || !onRegenerateReport}>
              자동 초안 다시 만들기
            </button>
            {isTeacherMode && (
              <button className="secondary-button" type="button" disabled={locked} onClick={onSaveState}>
                브라우저 저장
              </button>
            )}
          </div>
          {saveMessage && (
            <p className="save-message" role="status" aria-live="polite">
              {saveMessage}
            </p>
          )}
          {actionMessage && (
            <p className="save-message" role="status" aria-live="polite">
              {actionMessage}
            </p>
          )}
        </div>
      </div>}
    </section>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={done ? 'done' : ''}>
      <b aria-hidden="true">{done ? '✓' : ''}</b>
      {label}
    </span>
  );
}
