import { describe, expect, it } from 'vitest';
import { sampleEnergyUsageCsv, sampleEnergyUsageRows } from '../src/data/sampleEnergyUsage';

describe('sample energy usage labels', () => {
  it('uses Korean practice labels instead of raw placeholder tokens in visible sample data', () => {
    expect(sampleEnergyUsageRows.every((row) => row.date === '수업연습용')).toBe(true);
    expect(sampleEnergyUsageRows.every((row) => row.region === '가상 학교구역')).toBe(true);
    expect(sampleEnergyUsageCsv).not.toContain('practice_area');
  });
});
