import { describe, expect, it } from 'vitest';
import { decodeCsvBytes } from '../src/utils/decodeCsvFile';
import { parseEnergyCsv } from '../src/utils/csvParser';

describe('decodeCsvBytes', () => {
  it('decodes CP949/EUC-KR public-data CSV bytes and preserves Korean headers', () => {
    const bytes = new Uint8Array([
      179, 175, 194, 165, 44, 189, 195, 176, 163, 44, 193, 246, 191, 170, 44, 192, 252, 183, 194, 187,
      231, 191, 235, 183, 174, 95, 107, 87, 104, 10, 50, 48, 50, 54, 45, 48, 55, 45, 48, 56, 44, 49,
      52, 44, 176, 179, 198, 247, 181, 191, 44, 49, 50, 48
    ]);

    const decoded = decodeCsvBytes(bytes.buffer);
    const parsed = parseEnergyCsv(decoded.text);

    expect(decoded.encoding).toBe('euc-kr');
    expect(parsed.mapping).toMatchObject({ date: '날짜', hour: '시간', region: '지역', usageKWh: '전력사용량_kWh' });
    expect(parsed.rows[0]).toMatchObject({ date: '2026-07-08', hour: 14, region: '개포동', usageKWh: 120 });
  });

  it('removes UTF-8 BOM before parsing headers', () => {
    const bytes = new TextEncoder().encode('\uFEFFdate,hour,region,usage_kWh\n2026-07-08,14,A,120');
    const decoded = decodeCsvBytes(bytes.buffer);
    const parsed = parseEnergyCsv(decoded.text);

    expect(decoded.encoding).toBe('utf-8');
    expect(parsed.mapping.date).toBe('date');
    expect(parsed.rows[0].hour).toBe(14);
  });

  it('decodes normal UTF-8 CSV bytes', () => {
    const bytes = new TextEncoder().encode('date,hour,region,usage_kWh\n2026-07-08,9,A,80');
    const decoded = decodeCsvBytes(bytes.buffer);

    expect(decoded.encoding).toBe('utf-8');
    expect(decoded.text).toContain('usage_kWh');
  });
});
