import Papa from 'papaparse';
import type { ColumnMapping, CsvParseIssue, CsvParseResult, EnergyUsageRow } from '../types';

type RawRow = Record<string, string | number | null | undefined>;

const normalizeHeader = (value: string) => value.replace(/\s+/g, '').replace(/_/g, '').toLowerCase();

const candidates: Record<keyof ColumnMapping, string[]> = {
  date: ['date', '날짜', '일자', '기준일'],
  hour: ['hour', 'time', '시간', '시각', '시간대'],
  region: ['region', 'area', 'place', '지역', '자치구', '학교', '장소'],
  usageKWh: ['usagekwh', 'usage', 'power', 'electricity', '전력사용량kwh', '전력사용량', '사용량', '전기사용량']
};

export function detectColumnMapping(columns: string[]): ColumnMapping {
  const normalized = columns.map((column) => ({ original: column, normalized: normalizeHeader(column) }));
  const findCandidate = (key: keyof ColumnMapping) =>
    normalized.find((column) => candidates[key].some((candidate) => column.normalized === normalizeHeader(candidate)))?.original;

  return {
    date: findCandidate('date'),
    hour: findCandidate('hour'),
    region: findCandidate('region'),
    usageKWh: findCandidate('usageKWh')
  };
}

function makeError(code: CsvParseIssue['code'], message: string): CsvParseIssue {
  return { code, message };
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }
  const normalized = String(value ?? '').replace(/,/g, '').trim();
  if (normalized === '') {
    return Number.NaN;
  }

  const koreanHourMatch = normalized.match(/^(\d{1,2})\s*시$/);
  if (koreanHourMatch) {
    return Number(koreanHourMatch[1]);
  }

  const clockHourMatch = normalized.match(/^(\d{1,2}):[0-5]\d(?:\s*:\s*[0-5]\d)?$/);
  if (clockHourMatch) {
    return Number(clockHourMatch[1]);
  }

  return Number(normalized);
}

export function parseEnergyCsv(csvText: string, manualMapping: ColumnMapping = {}): CsvParseResult {
  if (!csvText.trim()) {
    return {
      rows: [],
      columns: [],
      mapping: {},
      errors: [makeError('EMPTY_CSV', 'CSV 내용이 비어 있어요. 전력 사용량 데이터가 들어 있는 파일을 선택해 주세요.')],
      warnings: [],
      skippedRowCount: 0
    };
  }

  const parsed = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });

  const columns = parsed.meta.fields?.filter(Boolean) ?? [];
  const mapping = { ...detectColumnMapping(columns), ...manualMapping };
  const errors: CsvParseIssue[] = [];

  if (parsed.errors.length > 0) {
    errors.push(makeError('PARSER_ERROR', 'CSV를 읽는 중 문제가 생겼어요. 쉼표로 구분된 표인지 확인해 주세요.'));
  }

  if (!mapping.hour) {
    errors.push(makeError('MISSING_HOUR_COLUMN', '시간 열을 찾지 못했어요. 어떤 열이 시간인지 선택해 주세요.'));
  }

  if (!mapping.usageKWh) {
    errors.push(makeError('MISSING_USAGE_COLUMN', '전력사용량 열을 찾지 못했어요. 어떤 열이 전력사용량인지 선택해 주세요.'));
  }

  if (errors.length > 0) {
    return {
      rows: [],
      columns,
      mapping,
      errors,
      warnings: [],
      skippedRowCount: parsed.data.length
    };
  }

  const rows: EnergyUsageRow[] = [];
  let skippedRowCount = 0;

  for (const raw of parsed.data) {
    const hour = toNumber(raw[mapping.hour as string]);
    const usageKWh = toNumber(raw[mapping.usageKWh as string]);
    const hasInvalidHour = !Number.isFinite(hour) || hour < 0 || hour > 23;
    const hasInvalidUsage = !Number.isFinite(usageKWh) || usageKWh < 0;

    if (hasInvalidHour || hasInvalidUsage) {
      skippedRowCount += 1;
      continue;
    }

    rows.push({
      date: mapping.date ? String(raw[mapping.date] ?? '').trim() || undefined : undefined,
      hour,
      region: mapping.region ? String(raw[mapping.region] ?? '').trim() || undefined : undefined,
      usageKWh
    });
  }

  const warnings: CsvParseIssue[] =
    skippedRowCount > 0
      ? [
          makeError(
            'INVALID_ROWS',
            `일부 데이터가 숫자가 아니거나 음수여서 제외했어요. 제외된 행 수: ${skippedRowCount}개`
          )
        ]
      : [];

  return {
    rows,
    columns,
    mapping,
    errors: [],
    warnings,
    skippedRowCount
  };
}
