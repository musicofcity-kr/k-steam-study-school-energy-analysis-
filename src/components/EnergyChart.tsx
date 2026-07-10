import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { UsageSummary } from '../types';
import { formatLowestHourLabel } from '../utils/hourLabels';

type EnergyChartProps = {
  summary: UsageSummary;
  peakConfirmed: boolean;
  solarLevel: number;
  solarActiveStartHour: number;
  solarActiveEndHour: number;
  peakReason: string;
  locked?: boolean;
  onPeakReasonChange: (reason: string) => void;
  onPeakConfirmed: () => void;
};

export function EnergyChart({
  summary,
  peakConfirmed,
  solarLevel,
  solarActiveStartHour,
  solarActiveEndHour,
  peakReason,
  locked = false,
  onPeakReasonChange,
  onPeakConfirmed
}: EnergyChartProps) {
  const peakHour = summary.peakHour;
  const showSolarActiveHours = solarLevel > 0 && summary.byHour.length > 0;
  const activeStartHour = Math.min(solarActiveStartHour, solarActiveEndHour);
  const activeEndHour = Math.max(solarActiveStartHour, solarActiveEndHour);
  const yAxisLabel =
    summary.byHourMode === 'average'
      ? `시간대별 평균 전력사용량 kWh (${summary.dayCount}일 데이터)`
      : '전력사용량 kWh';

  if (locked) {
    return (
      <section className="chart-section" aria-label="시간대별 전력 사용량 그래프">
        <div className="section-heading compact">
          <p className="eyebrow">그래프</p>
          <h2>3 전력 패턴 탐정</h2>
        </div>
        <p className="message warning" role="status">미션 1과 2를 완료하면 그래프 활동이 열립니다.</p>
      </section>
    );
  }

  return (
    <section className="chart-section" aria-label="시간대별 전력 사용량 그래프">
      <div className="section-heading compact">
        <p className="eyebrow">그래프</p>
        <h2>3 전력 패턴 탐정</h2>
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
          <>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={summary.byHour} margin={{ top: 24, right: 20, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}시`} label={{ value: '시간', position: 'insideBottom', offset: -12 }} />
              <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value} kWh`, '전력사용량']} labelFormatter={(label) => `${label}시`} />
              {showSolarActiveHours && (
                <ReferenceArea
                  x1={activeStartHour}
                  x2={activeEndHour}
                  fill="#facc15"
                  fillOpacity={0.18}
                  stroke="#f59e0b"
                  strokeOpacity={0.4}
                />
              )}
              <Bar dataKey="usageKWh" radius={[6, 6, 0, 0]}>
                {summary.byHour.map((entry) => (
                  <Cell key={entry.hour} fill={entry.hour === peakHour ? '#f97316' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {showSolarActiveHours && (
            <p className="solar-active-caption">
              태양광이 일하는 시간(수업용 단순화) - 이 시간 밖 발전량은 0입니다. 밤에는 ESS와 다른 에너지가 필요해요.
            </p>
          )}
          <details className="chart-data-table">
            <summary>시간별 전력 사용량 표로 보기</summary>
            <table>
              <thead>
                <tr><th>시간</th><th>전력사용량 kWh</th></tr>
              </thead>
              <tbody>
                {summary.byHour.map((entry) => (
                  <tr key={entry.hour}>
                    <td data-label="시간">{entry.hour}시</td>
                    <td data-label="전력사용량 kWh">{entry.usageKWh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          </>
        )}
        {summary.peakHour !== null && (
          <div className="mission-action-panel">
            <strong>탐정 수첩</strong>
            <span>
              발견 1 — 가장 많이 쓰는 시간: {summary.peakHour}시 ({summary.peakUsageKWh} kWh)
            </span>
            <span>
              발견 2 — 가장 적게 쓰는 시간: {formatLowestHourLabel(summary)} ({summary.lowestUsageKWh} kWh)
            </span>
            <label className="peak-reason-field">
              <span>피크가 생긴 까닭을 추론해 보세요.</span>
              <select value={peakReason} onChange={(event) => onPeakReasonChange(event.target.value)}>
                <option value="">이유 선택</option>
                <option value="냉난방과 조명을 함께 많이 사용했을 수 있다.">냉난방·조명 사용</option>
                <option value="급식과 특별실 기기를 함께 사용했을 수 있다.">급식·특별실 기기 사용</option>
                <option value="여러 학급의 활동 시간이 겹쳤을 수 있다.">여러 활동 시간 겹침</option>
                <option value="데이터만으로 원인을 확정할 수 없어 추가 조사가 필요하다.">추가 조사 필요</option>
              </select>
            </label>
            <button className="secondary-button dark" type="button" aria-pressed={peakConfirmed} disabled={!peakReason} onClick={onPeakConfirmed}>
              피크 확인 완료
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
