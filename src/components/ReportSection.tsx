import { useState } from 'react';
import type { EnergyScenario, ReportInput, ScenarioResult } from '../types';
import { buildReportJson } from '../utils/reportBuilder';

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
  onTeamNameChange: (value: string) => void;
  onCityNameChange: (value: string) => void;
  onKeyStrategiesChange: (value: string[]) => void;
  onReportDraftChange: (value: string) => void;
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
  onTeamNameChange,
  onCityNameChange,
  onKeyStrategiesChange,
  onReportDraftChange,
  onSaveState
}: ReportSectionProps) {
  const [actionMessage, setActionMessage] = useState('');

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
        <p className="eyebrow">화면 5</p>
        <h2>설계 결과 보고서</h2>
        <p>자동 초안을 수정해 활동지나 1분 발표문으로 옮길 수 있습니다.</p>
      </div>

      <div className="report-grid">
        <div className="report-form">
          <label htmlFor="team-name">
            우리 팀 이름
            <input id="team-name" value={teamName} onChange={(event) => onTeamNameChange(event.target.value)} placeholder="예: 태양팀" />
          </label>
          <label htmlFor="city-name">
            설계한 도시 이름
            <input id="city-name" value={cityName} onChange={(event) => onCityNameChange(event.target.value)} placeholder="예: 솔라스쿨시티" />
          </label>
          <label htmlFor="data-source">
            사용한 데이터 출처
            <input id="data-source" value={dataSource} readOnly />
          </label>
          {keyStrategies.map((strategy, index) => (
            <label htmlFor={`strategy-${index}`} key={index}>
              핵심 전략 {index + 1}
              <input id={`strategy-${index}`} value={strategy} onChange={(event) => updateStrategy(index, event.target.value)} />
            </label>
          ))}
        </div>

        <div className="report-preview">
          <div className="report-stats">
            <span>피크 {result.summary.peakHour === null ? '-' : `${result.summary.peakHour}시`}</span>
            <span>자립률 {result.selfSufficiencyRate}%</span>
            <span>태양광 {scenario.solarLevel}%</span>
            <span>ESS {scenario.essLevel}%</span>
          </div>
          <label htmlFor="report-draft">보고서 미리보기와 수정</label>
          <textarea id="report-draft" value={reportDraft} onChange={(event) => onReportDraftChange(event.target.value)} rows={18} />
          <div className="toolbar">
            <button className="primary-button" type="button" onClick={copyReport}>
              복사하기
            </button>
            <button className="secondary-button" type="button" onClick={() => window.print()}>
              인쇄하기
            </button>
            <button className="secondary-button" type="button" onClick={downloadJson}>
              JSON 저장
            </button>
            <button className="secondary-button" type="button" onClick={onSaveState}>
              브라우저 저장
            </button>
          </div>
          {saveMessage && <p className="save-message">{saveMessage}</p>}
          {actionMessage && <p className="save-message">{actionMessage}</p>}
        </div>
      </div>
    </section>
  );
}
