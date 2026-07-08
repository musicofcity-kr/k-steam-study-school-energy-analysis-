import { describe, expect, it } from 'vitest';
import { detectColumnMapping, parseEnergyCsv } from '../src/utils/csvParser';

describe('detectColumnMapping', () => {
  it('detects Korean and English energy CSV columns', () => {
    expect(detectColumnMapping(['날짜', '시간', '지역', '전력사용량_kWh'])).toMatchObject({
      date: '날짜',
      hour: '시간',
      region: '지역',
      usageKWh: '전력사용량_kWh'
    });

    expect(detectColumnMapping(['date', 'hour', 'region', 'usage_kWh'])).toMatchObject({
      date: 'date',
      hour: 'hour',
      region: 'region',
      usageKWh: 'usage_kWh'
    });
  });
});

describe('parseEnergyCsv', () => {
  it('parses valid rows with auto-detected columns', () => {
    const csv = 'date,hour,region,usage_kWh\npractice,14,practice_area,230\npractice,15,practice_area,210';
    const result = parseEnergyCsv(csv);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ hour: 14, usageKWh: 230 });
    expect(result.errors).toHaveLength(0);
  });

  it('uses manual column mapping when headers are unfamiliar', () => {
    const csv = 'day,time,place,power\npractice,8,practice_area,120';
    const result = parseEnergyCsv(csv, {
      date: 'day',
      hour: 'time',
      region: 'place',
      usageKWh: 'power'
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].hour).toBe(8);
  });

  it('reports empty CSV and missing usage columns with student-friendly errors', () => {
    expect(parseEnergyCsv('').errors[0].code).toBe('EMPTY_CSV');

    const result = parseEnergyCsv('date,hour,region\npractice,9,practice_area');
    expect(result.errors.map((error) => error.code)).toContain('MISSING_USAGE_COLUMN');
    expect(result.errors[0].message).toContain('전력사용량');
  });

  it('excludes invalid rows and reports how many rows were skipped', () => {
    const csv = 'date,hour,region,usage_kWh\npractice,not-hour,A,100\npractice,10,A,-5\npractice,11,A,150';
    const result = parseEnergyCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].hour).toBe(11);
    expect(result.warnings[0].message).toContain('2개');
  });

  it('treats blank usage values as invalid rows instead of zero kWh', () => {
    const csv = 'date,hour,region,usage_kWh\npractice,9,A,\npractice,10,A,120';
    const result = parseEnergyCsv(csv);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ hour: 10, usageKWh: 120 });
    expect(result.skippedRowCount).toBe(1);
  });

  it('does not silently truncate public-data CSV files over 5000 rows', () => {
    const body = Array.from({ length: 5100 }, (_, index) => `practice,${index % 24},practice_area,10`).join('\n');
    const result = parseEnergyCsv(`date,hour,region,usage_kWh\n${body}`);

    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(5100);
  });

  it('reports malformed CSV parser errors even when headers are present', () => {
    const result = parseEnergyCsv('date,hour,region,usage_kWh\n"practice,9,practice_area,120');

    expect(result.rows).toHaveLength(0);
    expect(result.errors.map((error) => error.code)).toContain('PARSER_ERROR');
  });

  it('accepts common Korean hour labels before numeric validation', () => {
    const csv = 'date,hour,region,usage_kWh\npractice,14시,A,100\npractice,15:00,A,120';
    const result = parseEnergyCsv(csv);

    expect(result.errors).toHaveLength(0);
    expect(result.rows.map((row) => row.hour)).toEqual([14, 15]);
  });
});
