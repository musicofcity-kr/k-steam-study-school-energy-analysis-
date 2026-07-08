import type { EnergyUsageRow } from '../types';

export const practiceDataNotice =
  '수업 연습용 예시 데이터입니다. 실제 공공데이터가 아니며 교사가 준비한 CSV로 교체할 수 있습니다.';

export const sampleEnergyUsageRows: EnergyUsageRow[] = [
  { date: '수업연습용', hour: 0, region: '가상 학교구역', usageKWh: 120 },
  { date: '수업연습용', hour: 1, region: '가상 학교구역', usageKWh: 98 },
  { date: '수업연습용', hour: 2, region: '가상 학교구역', usageKWh: 88 },
  { date: '수업연습용', hour: 3, region: '가상 학교구역', usageKWh: 82 },
  { date: '수업연습용', hour: 4, region: '가상 학교구역', usageKWh: 84 },
  { date: '수업연습용', hour: 5, region: '가상 학교구역', usageKWh: 96 },
  { date: '수업연습용', hour: 6, region: '가상 학교구역', usageKWh: 130 },
  { date: '수업연습용', hour: 7, region: '가상 학교구역', usageKWh: 168 },
  { date: '수업연습용', hour: 8, region: '가상 학교구역', usageKWh: 196 },
  { date: '수업연습용', hour: 9, region: '가상 학교구역', usageKWh: 210 },
  { date: '수업연습용', hour: 10, region: '가상 학교구역', usageKWh: 225 },
  { date: '수업연습용', hour: 11, region: '가상 학교구역', usageKWh: 238 },
  { date: '수업연습용', hour: 12, region: '가상 학교구역', usageKWh: 255 },
  { date: '수업연습용', hour: 13, region: '가상 학교구역', usageKWh: 280 },
  { date: '수업연습용', hour: 14, region: '가상 학교구역', usageKWh: 305 },
  { date: '수업연습용', hour: 15, region: '가상 학교구역', usageKWh: 292 },
  { date: '수업연습용', hour: 16, region: '가상 학교구역', usageKWh: 270 },
  { date: '수업연습용', hour: 17, region: '가상 학교구역', usageKWh: 248 },
  { date: '수업연습용', hour: 18, region: '가상 학교구역', usageKWh: 230 },
  { date: '수업연습용', hour: 19, region: '가상 학교구역', usageKWh: 215 },
  { date: '수업연습용', hour: 20, region: '가상 학교구역', usageKWh: 190 },
  { date: '수업연습용', hour: 21, region: '가상 학교구역', usageKWh: 165 },
  { date: '수업연습용', hour: 22, region: '가상 학교구역', usageKWh: 145 },
  { date: '수업연습용', hour: 23, region: '가상 학교구역', usageKWh: 132 }
];

export const sampleEnergyUsageCsv = [
  'date,hour,region,usage_kWh',
  ...sampleEnergyUsageRows.map((row) => `${row.date},${row.hour},${row.region},${row.usageKWh}`)
].join('\n');
