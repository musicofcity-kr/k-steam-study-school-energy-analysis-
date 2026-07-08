type HeaderProps = {
  rowCount: number;
  selfSufficiencyRate: number;
  dataSource: string;
};

export function Header({ rowCount, selfSufficiencyRate, dataSource }: HeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="#start">
        <span className="brand-mark" aria-hidden="true">
          EC
        </span>
        <span>
          <strong>E-CITY 2050</strong>
          <small>에너지 자립 미래도시 설계실</small>
        </span>
      </a>
      <div className="status-pills" aria-label="현재 활동 상태">
        <span>{rowCount > 0 ? `데이터 ${rowCount}행` : '데이터 대기'}</span>
        <span>자립률 {selfSufficiencyRate}%</span>
        <span>{dataSource}</span>
      </div>
    </header>
  );
}
