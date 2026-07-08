import { readFileSync } from 'node:fs';
import { createElement, createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DataUploadSection } from '../src/components/DataUploadSection';
import { gaewonPowerUsageSource, gaewonSchoolContext, gaewonTemplatePath } from '../src/data/gaewonSchoolContext';
import type { UsageSummary } from '../src/types';
import { parseEnergyCsv } from '../src/utils/csvParser';

describe('gaewon data pack integration', () => {
  const emptySummary: UsageSummary = {
    totalUsageKWh: 0,
    averageUsageKWh: 0,
    peakHour: null,
    peakUsageKWh: 0,
    lowestHour: null,
    lowestUsageKWh: 0,
    rowCount: 0,
    regionLabel: '데이터 없음',
    byHour: []
  };

  it('keeps Gaewon school context separate from actual power usage data', () => {
    expect(gaewonSchoolContext.schoolName).toBe('개원중학교');
    expect(gaewonSchoolContext.localPowerRegion).toBe('개포동');
    expect(gaewonSchoolContext.proxyUsageMethod).toContain('대체 지표');
    expect(gaewonSchoolContext.limitNotice).toContain('학교 자체 전력량이 아닙니다');
  });

  it('records the exact public source and filter from the Gaewon data pack', () => {
    expect(gaewonPowerUsageSource.datasetName).toBe('서울특별시 법정동별시간별전력사용량');
    expect(gaewonPowerUsageSource.filterField).toBe('법정동/동명');
    expect(gaewonPowerUsageSource.filterValue).toBe('개포동');
    expect(gaewonPowerUsageSource.standardColumns).toEqual(['date', 'hour', 'region', 'usage_kWh']);
    expect(gaewonPowerUsageSource.actualValuesIncludedInPack).toBe(false);
    expect(gaewonPowerUsageSource.caution).toContain('학교 자체 전력량이 아닙니다');
    expect(gaewonPowerUsageSource.sourceUrl).toBe(gaewonSchoolContext.sourceUrls.seoulPowerUsage);
  });

  it('provides a teacher upload template but does not treat blank usage rows as valid chart data', () => {
    const template = readFileSync('public/sample-data/gaewon_energy_usage_upload_template.csv', 'utf8');
    const result = parseEnergyCsv(template);

    expect(gaewonTemplatePath).toBe('/sample-data/gaewon_energy_usage_upload_template.csv');
    expect(result.mapping).toMatchObject({ hour: 'hour', usageKWh: 'usage_kWh' });
    expect(result.rows).toHaveLength(0);
    expect(result.skippedRowCount).toBe(24);
    expect(result.warnings[0].message).toContain('24개');
  });

  it('shows the Gaewon power source URL and blank-template caveat in the upload screen', () => {
    const html = renderToStaticMarkup(
      createElement(DataUploadSection, {
        rows: [],
        summary: emptySummary,
        dataSource: '데이터 없음',
        uploadInputRef: createRef<HTMLInputElement>(),
        onRowsParsed: () => undefined,
        onLoadPractice: () => undefined
      })
    );

    expect(html).toContain(gaewonPowerUsageSource.datasetName);
    expect(html).toContain(gaewonPowerUsageSource.filterValue);
    expect(html).toContain(gaewonPowerUsageSource.sourceUrl);
    expect(html).toContain(gaewonPowerUsageSource.standardColumns.join(', '));
    expect(html).toContain('팩에는 빈 업로드 템플릿만 있고 실제 학교 전력값은 포함되어 있지 않습니다');
  });
});
