import { createElement, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataUploadSection } from '../src/components/DataUploadSection';
import { StartSection } from '../src/components/StartSection';
import type { DataProvenance, EnergyUsageRow, UsageSummary } from '../src/types';

const rows: EnergyUsageRow[] = [
  { date: '2026-07-10', hour: 14, region: '수업 지역', usageKWh: 42 }
];

const summary: UsageSummary = {
  totalUsageKWh: 42,
  averageUsageKWh: 42,
  peakHour: 14,
  peakUsageKWh: 42,
  lowestHour: 14,
  lowestUsageKWh: 42,
  rowCount: 1,
  dayCount: 1,
  byHourMode: 'sum',
  regionLabel: '수업 지역',
  byHour: [{ hour: 14, usageKWh: 42 }]
};

function renderDataUpload(isTeacherMode: boolean, dataProvenance: DataProvenance = 'practice-assumption') {
  return renderToStaticMarkup(
    createElement(DataUploadSection, {
      rows,
      summary,
      dataSource: '수업용 비교 데이터',
      dataProvenance,
      provenanceDetails: {
        provider: '서울특별시',
        datasetName: '교사용 자료',
        referenceDate: '2026-07-10',
        regionUnit: '동',
        scope: 'regional-proxy'
      },
      dataMessage: '데이터를 확인해 주세요.',
      dataMessageTone: 'error',
      isTeacherMode,
      uploadInputRef: createRef<HTMLInputElement>(),
      onRowsParsed: () => undefined,
      onProvenanceChange: () => undefined,
      onLoadPractice: () => undefined
    })
  );
}

describe('student mode', () => {
  it('shows simple data actions and a read-only provenance status while preserving results', () => {
    const html = renderDataUpload(false);

    expect(html).toContain('수업 데이터로 시작하기');
    expect(html).toContain('선생님이 준 CSV 열기');
    expect(html).toContain('<strong>데이터 출처:</strong> 수업용 가정 데이터');
    expect(html).toContain('현재 데이터:');
    expect(html).toContain('데이터를 확인해 주세요.');
    expect(html).toContain('총 사용량');
    expect(html).toContain('42 kWh');
    expect(html).toContain('데이터 미리보기');
    expect(html).toContain('수업 지역');
  });

  it('hides teacher-only upload and provenance tools from students', () => {
    const html = renderDataUpload(false, 'teacher-prepared-public-data');

    expect(html).not.toContain('개원중 업로드 템플릿');
    expect(html).not.toContain('이 데이터의 출처 상태');
    expect(html).not.toContain('제공기관');
    expect(html).not.toContain('팩에서 찾은 전력 원천');
    expect(html).not.toContain('서울특별시 법정동별시간별전력사용량');
    expect(html).not.toContain('컬럼 매핑');
    expect(html).toContain('<strong>데이터 출처:</strong> 교사가 준비한 공공데이터');
  });

  it('keeps the full data controls in teacher mode', () => {
    const html = renderDataUpload(true, 'teacher-prepared-public-data');

    expect(html).toContain('연습 데이터 불러오기');
    expect(html).toContain('CSV 파일 선택');
    expect(html).toContain('개원중 업로드 템플릿');
    expect(html).toContain('이 데이터의 출처 상태');
    expect(html).toContain('제공기관');
    expect(html).toContain('팩에서 찾은 전력 원천');
  });

  it('shows a saved-progress CTA and plain student data guidance', () => {
    const html = renderToStaticMarkup(
      createElement(StartSection, {
        onStart: () => undefined,
        hasSavedProgress: true
      })
    );

    expect(html).toContain('저장한 미션 이어하기');
    expect(html).toContain('실제 학교 전력량이 아닌 수업용 비교 데이터입니다.');
    expect(html).not.toContain('개포동 필터');
    expect(html).not.toContain('학교 자체 전력량이 아닙니다');
  });

  it('keeps the original filter and limitation guidance in teacher mode', () => {
    const html = renderToStaticMarkup(
      createElement(StartSection, {
        onStart: () => undefined,
        isTeacherMode: true
      })
    );

    expect(html).toContain('발전 원리부터 시작하기');
    expect(html).toContain('개포동 필터를 사용합니다.');
    expect(html).toContain('학교 자체 전력량이 아닙니다');
  });
});
