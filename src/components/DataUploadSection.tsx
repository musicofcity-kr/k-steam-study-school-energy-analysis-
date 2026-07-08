import { useState, type ChangeEvent, type RefObject } from 'react';
import { gaewonPowerUsageSource, gaewonSchoolContext, gaewonTemplatePath } from '../data/gaewonSchoolContext';
import type { ColumnMapping, CsvParseResult, EnergyUsageRow, UsageSummary } from '../types';
import { parseEnergyCsv } from '../utils/csvParser';

type DataUploadSectionProps = {
  rows: EnergyUsageRow[];
  summary: UsageSummary;
  dataSource: string;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  onRowsParsed: (rows: EnergyUsageRow[], sourceLabel: string) => void;
  onLoadPractice: () => void;
};

const emptyResult: CsvParseResult = {
  rows: [],
  columns: [],
  mapping: {},
  errors: [],
  warnings: [],
  skippedRowCount: 0
};

export function DataUploadSection({
  rows,
  summary,
  dataSource,
  uploadInputRef,
  onRowsParsed,
  onLoadPractice
}: DataUploadSectionProps) {
  const [csvText, setCsvText] = useState('');
  const [currentSourceLabel, setCurrentSourceLabel] = useState('');
  const [parseResult, setParseResult] = useState<CsvParseResult>(emptyResult);
  const [mapping, setMapping] = useState<ColumnMapping>({});

  const applyResult = (result: CsvParseResult, sourceLabel: string) => {
    setParseResult(result);
    setMapping(result.mapping);
    onRowsParsed(result.errors.length === 0 ? result.rows : [], sourceLabel);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') || file.type === 'text/plain';
    if (!isCsv) {
      setParseResult({
        ...emptyResult,
        errors: [
          {
            code: 'PARSER_ERROR',
            message: 'CSV 파일만 업로드할 수 있어요. 쉼표로 구분된 .csv 파일을 선택해 주세요.'
          }
        ]
      });
      onRowsParsed([], file.name);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setCsvText(text);
      setCurrentSourceLabel(file.name);
      applyResult(parseEnergyCsv(text), file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const applyManualMapping = () => {
    if (!csvText) {
      return;
    }
    applyResult(parseEnergyCsv(csvText, mapping), currentSourceLabel || '업로드 CSV 데이터');
  };

  const updateMapping = (key: keyof ColumnMapping, value: string) => {
    setMapping((current) => ({ ...current, [key]: value || undefined }));
  };

  return (
    <section className="section-grid" id="data-lab">
      <div className="section-heading">
        <p className="eyebrow">화면 2</p>
        <h2>공공데이터 탐색실</h2>
        <p>CSV를 불러와 언제 전기를 많이 쓰는지 찾습니다. 예시 데이터는 실제 공공데이터가 아닙니다.</p>
      </div>

      <div className="data-panel">
        <div className="toolbar">
          <button className="primary-button" type="button" onClick={onLoadPractice}>
            예시 데이터 불러오기
          </button>
          <label className="file-button" htmlFor="csv-upload">
            CSV 파일 선택
          </label>
          <a className="secondary-link" href={gaewonTemplatePath} download>
            개원중 업로드 템플릿
          </a>
          <input id="csv-upload" ref={uploadInputRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleFile} />
        </div>

        <div className="source-note">
          <strong>현재 데이터:</strong> {dataSource}
        </div>
        <div className="source-note">
          <strong>{gaewonSchoolContext.schoolName} 데이터 팩:</strong> 전력 템플릿은 {gaewonSchoolContext.localPowerRegion} 24시간 입력 틀입니다.
          `usage_kWh` 값을 교사가 실제 자료로 채운 뒤 업로드하세요.
        </div>
        <div className="source-note">
          <strong>팩에서 찾은 전력 원천:</strong> {gaewonPowerUsageSource.datasetName}에서 {gaewonPowerUsageSource.filterField}=
          {gaewonPowerUsageSource.filterValue} 행만 추출합니다. 표준 컬럼은 {gaewonPowerUsageSource.standardColumns.join(', ')}입니다.
          {' '}
          <a href={gaewonPowerUsageSource.sourceUrl} target="_blank" rel="noreferrer">
            {gaewonPowerUsageSource.sourceUrl}
          </a>
          {' '}
          {gaewonPowerUsageSource.actualValuesIncludedInPack ? '' : gaewonPowerUsageSource.caution}
        </div>

        {parseResult.errors.length > 0 && (
          <div className="message error" role="alert">
            {parseResult.errors.map((error) => (
              <p key={error.code}>{error.message}</p>
            ))}
          </div>
        )}

        {parseResult.warnings.length > 0 && (
          <div className="message warning">
            {parseResult.warnings.map((warning) => (
              <p key={warning.code}>{warning.message}</p>
            ))}
          </div>
        )}

        {parseResult.columns.length > 0 && (
          <div className="mapping-panel">
            <h3>컬럼 매핑</h3>
            <p>앱이 열 이름을 잘 못 찾았다면 어떤 열이 시간과 전력사용량인지 직접 선택하세요.</p>
            <div className="mapping-grid">
              <ColumnSelect label="날짜 열" value={mapping.date} columns={parseResult.columns} onChange={(value) => updateMapping('date', value)} />
              <ColumnSelect label="시간 열" value={mapping.hour} columns={parseResult.columns} onChange={(value) => updateMapping('hour', value)} />
              <ColumnSelect label="지역 열" value={mapping.region} columns={parseResult.columns} onChange={(value) => updateMapping('region', value)} />
              <ColumnSelect
                label="전력사용량 열"
                value={mapping.usageKWh}
                columns={parseResult.columns}
                onChange={(value) => updateMapping('usageKWh', value)}
              />
            </div>
            <button className="secondary-button" type="button" onClick={applyManualMapping}>
              선택한 열로 다시 읽기
            </button>
          </div>
        )}
      </div>

      <div className="summary-grid" aria-label="전력 사용 요약">
        <Metric label="총 사용량" value={`${summary.totalUsageKWh} kWh`} />
        <Metric label="평균 사용량" value={`${summary.averageUsageKWh} kWh`} />
        <Metric label="가장 많이 쓴 시간" value={summary.peakHour === null ? '데이터 없음' : `${summary.peakHour}시`} />
        <Metric label="가장 적게 쓴 시간" value={summary.lowestHour === null ? '데이터 없음' : `${summary.lowestHour}시`} />
      </div>

      <div className="table-wrap">
        <h3>데이터 미리보기</h3>
        {rows.length === 0 ? (
          <p className="empty-state">CSV를 업로드하거나 예시 데이터를 불러오면 표가 나타납니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>시간</th>
                <th>지역</th>
                <th>전력사용량 kWh</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row, index) => (
                <tr key={`${row.hour}-${index}`}>
                  <td>{row.date || '-'}</td>
                  <td>{row.hour}시</td>
                  <td>{row.region || '-'}</td>
                  <td>{row.usageKWh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

type ColumnSelectProps = {
  label: string;
  value?: string;
  columns: string[];
  onChange: (value: string) => void;
};

function ColumnSelect({ label, value, columns, onChange }: ColumnSelectProps) {
  return (
    <label>
      <span>{label}</span>
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">선택 안 함</option>
        {columns.map((column) => (
          <option value={column} key={column}>
            {column}
          </option>
        ))}
      </select>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
