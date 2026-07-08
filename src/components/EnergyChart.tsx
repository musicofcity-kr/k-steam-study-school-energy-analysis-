import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UsageSummary } from '../types';

type EnergyChartProps = {
  summary: UsageSummary;
  peakConfirmed: boolean;
  onPeakConfirmed: () => void;
};

export function EnergyChart({ summary, peakConfirmed, onPeakConfirmed }: EnergyChartProps) {
  const peakHour = summary.peakHour;
  const yAxisLabel =
    summary.byHourMode === 'average'
      ? `시간대별 평균 전력사용량 kWh (${summary.dayCount}일 데이터)`
      : '전력사용량 kWh';

  return (
    <section className="chart-section" aria-label="시간대별 전력 사용량 그래프">
      <div className="section-heading compact">
        <p className="eyebrow">그래프</p>
        <h2>미션 2: 패턴 탐정</h2>
        <p>
          {peakHour === null
            ? '데이터를 불러오면 시간대별 막대그래프가 표시됩니다.'
            : summary.byHourMode === 'average'
              ? `이 ${summary.dayCount}일 데이터에서는 ${peakHour}시 평균 전력 사용량이 가장 높습니다.`
              : `이 데이터에서는 ${peakHour}시에 전력 사용량이 가장 높습니다. 색과 함께 텍스트로 피크를 표시합니다.`}
        </p>
      </div>
      <div className="chart-frame">
        {summary.byHour.length === 0 ? (
          <p className="empty-state">그래프를 만들 데이터가 아직 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={summary.byHour} margin={{ top: 24, right: 20, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}시`} label={{ value: '시간', position: 'insideBottom', offset: -12 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value} kWh`, '전력사용량']} labelFormatter={(label) => `${label}시`} />
              <Bar dataKey="usageKWh" radius={[6, 6, 0, 0]}>
                {summary.byHour.map((entry) => (
                  <Cell key={entry.hour} fill={entry.hour === peakHour ? '#f97316' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {summary.peakHour !== null && (
          <div className="mission-action-panel">
            <strong>탐정 수첩</strong>
            <span>
              발견 1 — 가장 많이 쓰는 시간: {summary.peakHour}시 ({summary.peakUsageKWh} kWh)
            </span>
            <span>
              발견 2 — 가장 적게 쓰는 시간: {summary.lowestHour}시 ({summary.lowestUsageKWh} kWh)
            </span>
            <button className="secondary-button dark" type="button" onClick={onPeakConfirmed}>
              {peakConfirmed ? '피크 확인 완료' : '피크 확인하기'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
