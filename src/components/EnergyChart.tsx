import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UsageSummary } from '../types';

type EnergyChartProps = {
  summary: UsageSummary;
};

export function EnergyChart({ summary }: EnergyChartProps) {
  const peakHour = summary.peakHour;

  return (
    <section className="chart-section" aria-label="시간대별 전력 사용량 그래프">
      <div className="section-heading compact">
        <p className="eyebrow">그래프</p>
        <h2>시간대별 전력 사용량</h2>
        <p>
          {peakHour === null
            ? '데이터를 불러오면 시간대별 막대그래프가 표시됩니다.'
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
              <YAxis label={{ value: '전력사용량 kWh', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value} kWh`, '전력사용량']} labelFormatter={(label) => `${label}시`} />
              <Bar dataKey="usageKWh" radius={[6, 6, 0, 0]}>
                {summary.byHour.map((entry) => (
                  <Cell key={entry.hour} fill={entry.hour === peakHour ? '#f97316' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
