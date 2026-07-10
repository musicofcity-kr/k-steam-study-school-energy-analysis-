import { useState, type ChangeEvent, type RefObject } from 'react';
import { gaewonPowerUsageSource, gaewonSchoolContext, gaewonTemplatePath } from '../data/gaewonSchoolContext';
import type {
  ColumnMapping,
  CsvParseResult,
  DataProvenance,
  DataProvenanceDetails,
  EnergyUsageRow,
  UsageSummary
} from '../types';
import { parseEnergyCsv } from '../utils/csvParser';
import { decodeCsvBytes } from '../utils/decodeCsvFile';
import { formatLowestHourLabel } from '../utils/hourLabels';

type DataUploadSectionProps = {
  rows: EnergyUsageRow[];
  summary: UsageSummary;
  dataSource: string;
  dataProvenance: DataProvenance;
  provenanceDetails: DataProvenanceDetails;
  dataMessage: string;
  dataMessageTone: 'success' | 'error';
  isTeacherMode?: boolean;
  locked?: boolean;
  provenanceLocked?: boolean;
  uploadInputRef: RefObject<HTMLInputElement | null>;
  onRowsParsed: (rows: EnergyUsageRow[], sourceLabel: string, provenance: DataProvenance) => void;
  onProvenanceChange: (provenance: DataProvenance, details: DataProvenanceDetails) => void;
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

export const MAX_CSV_FILE_SIZE_BYTES = 1_000_000;

export function DataUploadSection({
  rows,
  summary,
  dataSource,
  dataProvenance,
  provenanceDetails,
  dataMessage,
  dataMessageTone,
  isTeacherMode = false,
  locked = false,
  provenanceLocked = false,
  uploadInputRef,
  onRowsParsed,
  onProvenanceChange,
  onLoadPractice
}: DataUploadSectionProps) {
  const [csvText, setCsvText] = useState('');
  const [currentSourceLabel, setCurrentSourceLabel] = useState('');
  const [parseResult, setParseResult] = useState<CsvParseResult>(emptyResult);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [decodeMessage, setDecodeMessage] = useState('');

  if (locked) {
    return (
      <section className="section-grid" id="data-lab">
        <div className="section-heading">
          <p className="eyebrow">미션 3</p>
          <h2>3 전력 패턴 탐정</h2>
          <p>CSV를 불러와 언제 전기를 많이 쓰는지 찾고, 태양광 활동 시간과 비교합니다.</p>
        </div>
        <p className="message warning" role="status">미션 1과 2를 먼저 완료하세요.</p>
      </section>
    );
  }

  const applyResult = (result: CsvParseResult, sourceLabel: string) => {
    setParseResult(result);
    setMapping(result.mapping);
    if (result.errors.length === 0 && result.rows.length > 0) {
      onRowsParsed(result.rows, sourceLabel, 'unknown-upload');
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const input = event.currentTarget;
    if (!file) {
      return;
    }

    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      setParseResult({
        ...emptyResult,
        errors: [{ code: 'PARSER_ERROR', message: '파일이 너무 커서 열 수 없어요. 1MB 이하의 수업용 CSV를 선택해 주세요.' }]
      });
      setDecodeMessage('');
      input.value = '';
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
      setDecodeMessage('');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const decoded = decodeCsvBytes(reader.result as ArrayBuffer);
      const text = decoded.text;
      setCsvText(text);
      setCurrentSourceLabel(file.name);
      setDecodeMessage(`이 파일은 ${decoded.encoding.toUpperCase()} 인코딩으로 읽었어요.`);
      applyResult(parseEnergyCsv(text), file.name);
      input.value = '';
    };
    reader.onerror = () => {
      setParseResult({
        ...emptyResult,
        errors: [{ code: 'PARSER_ERROR', message: '파일을 읽지 못했어요. 파일을 다시 확인하거나 선생님께 알려 주세요.' }]
      });
      setDecodeMessage('');
      input.value = '';
    };
    reader.readAsArrayBuffer(file);
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
        <p className="eyebrow">미션 3</p>
        <h2>3 전력 패턴 탐정</h2>
        <p>CSV를 불러와 언제 전기를 많이 쓰는지 찾고, 태양광 활동 시간과 비교합니다.</p>
      </div>

      <div className="data-panel">
        <div className="toolbar">
          <button className="primary-button" type="button" disabled={locked} onClick={onLoadPractice}>
            {isTeacherMode ? '연습 데이터 불러오기' : '수업 데이터로 시작하기'}
          </button>
          <button className="file-button" type="button" disabled={locked} onClick={() => uploadInputRef.current?.click()}>
            {isTeacherMode ? 'CSV 파일 선택' : '선생님이 준 CSV 열기'}
          </button>
          {isTeacherMode && (
            <a className="secondary-link" href={gaewonTemplatePath} download>
              개원중 업로드 템플릿
            </a>
          )}
          <input id="csv-upload" ref={uploadInputRef} className="visually-hidden" tabIndex={-1} type="file" accept=".csv,text/csv" disabled={locked} onChange={handleFile} />
        </div>

        <div className="source-note">
          <strong>현재 데이터:</strong> {dataSource}
        </div>
        {dataMessage && <div className={`message ${dataMessageTone}`} role={dataMessageTone === 'error' ? 'alert' : 'status'}>{dataMessage}</div>}
        {decodeMessage && <div className="message info" role="status">{decodeMessage}</div>}
        {isTeacherMode ? (
          <>
            <div className="provenance-panel">
              <label>
                <span>이 데이터의 출처 상태</span>
                <select
                  value={dataProvenance}
                  disabled={locked || provenanceLocked}
                  onChange={(event) => onProvenanceChange(event.target.value as DataProvenance, provenanceDetails)}
                >
                  <option value="practice-assumption">수업용 가정 데이터</option>
                  <option value="teacher-prepared-public-data">교사가 준비한 공공데이터</option>
                  <option value="unknown-upload">출처 확인 필요</option>
                </select>
              </label>
              {provenanceLocked && <p className="message info">연습 데이터의 출처 표시는 수업용 가정 데이터로 고정됩니다.</p>}
              {dataProvenance === 'teacher-prepared-public-data' && (
                <div className="provenance-fields">
                  <ProvenanceInput label="제공기관" value={provenanceDetails.provider} disabled={locked} onChange={(value) => onProvenanceChange(dataProvenance, { ...provenanceDetails, provider: value })} />
                  <ProvenanceInput label="자료명" value={provenanceDetails.datasetName} disabled={locked} onChange={(value) => onProvenanceChange(dataProvenance, { ...provenanceDetails, datasetName: value })} />
                  <ProvenanceInput label="기준일" value={provenanceDetails.referenceDate} disabled={locked} onChange={(value) => onProvenanceChange(dataProvenance, { ...provenanceDetails, referenceDate: value })} />
                  <ProvenanceInput label="지역 단위" value={provenanceDetails.regionUnit} disabled={locked} onChange={(value) => onProvenanceChange(dataProvenance, { ...provenanceDetails, regionUnit: value })} />
                  <label>
                    <span>학교 자료 여부</span>
                    <select value={provenanceDetails.scope ?? 'unknown'} disabled={locked} onChange={(event) => onProvenanceChange(dataProvenance, { ...provenanceDetails, scope: event.target.value as DataProvenanceDetails['scope'] })}>
                      <option value="unknown">확인 필요</option>
                      <option value="school">학교 자체 데이터</option>
                      <option value="regional-proxy">지역 대체 데이터</option>
                    </select>
                  </label>
                </div>
              )}
              {dataProvenance === 'unknown-upload' && <p className="message warning">파일명만으로 공공데이터인지 판단하지 않습니다. 제공기관과 자료명을 확인해 주세요.</p>}
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
          </>
        ) : (
          <p className="source-note" role="status">
            <strong>데이터 출처:</strong> {formatProvenanceLabel(dataProvenance)}
          </p>
        )}

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

        {isTeacherMode && parseResult.columns.length > 0 && (
          <div className="mapping-panel">
            <h3>컬럼 매핑</h3>
            <p>앱이 열 이름을 잘 못 찾았다면 어떤 열이 시간과 전력사용량인지 직접 선택하세요.</p>
            <div className="mapping-grid">
              <ColumnSelect label="날짜 열" value={mapping.date} columns={parseResult.columns} disabled={locked} onChange={(value) => updateMapping('date', value)} />
              <ColumnSelect label="시간 열" value={mapping.hour} columns={parseResult.columns} disabled={locked} onChange={(value) => updateMapping('hour', value)} />
              <ColumnSelect label="지역 열" value={mapping.region} columns={parseResult.columns} disabled={locked} onChange={(value) => updateMapping('region', value)} />
              <ColumnSelect
                label="전력사용량 열"
                value={mapping.usageKWh}
                columns={parseResult.columns}
                disabled={locked}
                onChange={(value) => updateMapping('usageKWh', value)}
              />
            </div>
            <button className="secondary-button" type="button" disabled={locked} onClick={applyManualMapping}>
              선택한 열로 다시 읽기
            </button>
          </div>
        )}
      </div>

      <div className="summary-grid" aria-label="전력 사용 요약">
        <Metric label="총 사용량" value={`${summary.totalUsageKWh} kWh`} />
        <Metric label="평균 사용량" value={`${summary.averageUsageKWh} kWh`} />
        <Metric label="가장 많이 쓴 시간" value={summary.peakHour === null ? '데이터 없음' : `${summary.peakHour}시`} />
        <Metric label="가장 적게 쓴 시간" value={formatLowestHourLabel(summary)} />
      </div>

      <div className="table-wrap">
        <h3>데이터 미리보기</h3>
        {rows.length === 0 ? (
          <p className="empty-state">CSV를 업로드하거나 연습 데이터를 불러오면 표가 나타납니다.</p>
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
                  <td data-label="날짜">{row.date || '-'}</td>
                  <td data-label="시간">{row.hour}시</td>
                  <td data-label="지역">{row.region || '-'}</td>
                  <td data-label="전력사용량 kWh">{row.usageKWh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function formatProvenanceLabel(provenance: DataProvenance) {
  if (provenance === 'practice-assumption') {
    return '수업용 가정 데이터';
  }

  if (provenance === 'teacher-prepared-public-data') {
    return '교사가 준비한 공공데이터';
  }

  return '출처 확인 필요';
}

function ProvenanceInput({ label, value = '', disabled = false, onChange }: { label: string; value?: string; disabled?: boolean; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

type ColumnSelectProps = {
  label: string;
  value?: string;
  columns: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

function ColumnSelect({ label, value, columns, disabled = false, onChange }: ColumnSelectProps) {
  return (
    <label>
      <span>{label}</span>
      <select value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
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
