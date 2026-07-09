import { describe, expect, it } from 'vitest';
import { practiceDataNotice, sampleEnergyUsageCsv, sampleEnergyUsageRows } from '../src/data/sampleEnergyUsage';
import { calculateUsageSummary } from '../src/utils/energyModel';

describe('sample energy usage labels', () => {
  it('uses the classroom assumption labels instead of raw placeholder tokens', () => {
    expect(sampleEnergyUsageRows.every((row) => row.date === '수업용가정')).toBe(true);
    expect(sampleEnergyUsageRows.every((row) => row.region === '일반 중학교(수업용 가정)')).toBe(true);
    expect(sampleEnergyUsageCsv).not.toContain('practice_area');
  });

  it('matches the lesson worksheet practice pattern: total 900 kWh and peak 14시', () => {
    const summary = calculateUsageSummary(sampleEnergyUsageRows);

    expect(sampleEnergyUsageRows).toHaveLength(24);
    expect(summary.totalUsageKWh).toBe(900);
    expect(summary.peakHour).toBe(14);
    expect(summary.peakUsageKWh).toBe(67);
    expect(summary.lowestUsageKWh).toBe(14);
    expect(sampleEnergyUsageCsv).toContain('수업용가정,14,일반 중학교(수업용 가정),67');
  });

  it('uses the exact practice data notice from the lesson material', () => {
    expect(practiceDataNotice).toBe('수업용 가정 데이터를 불러왔어요. 실제 학교 전력량이 아니에요.');
  });
});
