import type { EnergyUsageRow } from '../types';

export const practiceDataNotice =
  '수업용 가정 데이터를 불러왔어요. 실제 학교 전력량이 아니에요.';

const classroomAssumptionUsage = [16, 14, 14, 14, 14, 16, 25, 36, 47, 54, 56, 58, 61, 65, 67, 64, 59, 50, 41, 34, 29, 25, 22, 19];

export const sampleEnergyUsageRows: EnergyUsageRow[] = classroomAssumptionUsage.map((usageKWh, hour) => ({
  date: '수업용가정',
  hour,
  region: '일반 중학교(수업용 가정)',
  usageKWh
}));

export const sampleEnergyUsageCsv = [
  'date,hour,region,usage_kWh',
  ...sampleEnergyUsageRows.map((row) => `${row.date},${row.hour},${row.region},${row.usageKWh}`)
].join('\n');
