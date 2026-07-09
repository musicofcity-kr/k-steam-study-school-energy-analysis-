import type { UsageSummary } from '../types';

export function formatHourRanges(hours: number[]): string {
  const sortedHours = [...new Set(hours)].sort((a, b) => a - b);
  const ranges: string[] = [];

  for (let index = 0; index < sortedHours.length; index += 1) {
    const start = sortedHours[index];
    let end = start;

    while (index + 1 < sortedHours.length && sortedHours[index + 1] === end + 1) {
      index += 1;
      end = sortedHours[index];
    }

    ranges.push(start === end ? `${start}시` : `${start}~${end}시`);
  }

  return ranges.join(', ');
}

export function formatLowestHourLabel(summary: UsageSummary): string {
  if (summary.lowestHour === null) {
    return '데이터 없음';
  }

  const lowestHours = summary.byHour
    .filter((item) => item.usageKWh === summary.lowestUsageKWh)
    .map((item) => item.hour);

  return formatHourRanges(lowestHours.length > 0 ? lowestHours : [summary.lowestHour]);
}
