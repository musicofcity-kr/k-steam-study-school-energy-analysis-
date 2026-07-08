import { gaewonSchoolContext } from '../data/gaewonSchoolContext';

type StartSectionProps = {
  onStart: () => void;
  onLoadPractice: () => void;
  onUploadClick: () => void;
};

const steps = ['공공데이터 불러오기', '전력 사용 패턴 찾기', '에너지원 비교하기', '미래 학교구역 설계하기', '근거 발표하기'];

export function StartSection({ onStart, onLoadPractice, onUploadClick }: StartSectionProps) {
  return (
    <section className="start-section" id="start">
      <div className="start-copy">
        <p className="eyebrow">중1 STEAM 데이터 탐험</p>
        <h1>E-CITY 2050 에너지 자립 미래도시 설계실</h1>
        <p className="lead">
          우리 지역의 전기 사용 데이터를 분석하고, 2050년 탄소중립 미래도시의 에너지 조합을 설계해 봅시다.
        </p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={onStart}>
            수업 시작하기
          </button>
          <button className="secondary-button" type="button" onClick={onLoadPractice}>
            예시 데이터로 체험하기
          </button>
          <button className="secondary-button" type="button" onClick={onUploadClick}>
            CSV 데이터 업로드하기
          </button>
        </div>
      </div>
      <div className="mission-panel" aria-label="오늘의 미션">
        <h2>오늘의 미션</h2>
        <p>데이터에서 전력 사용 피크를 찾고, 그 문제를 줄이는 미래 학교구역 설계안을 만듭니다.</p>
        <div className="school-context">
          <strong>{gaewonSchoolContext.schoolName} 기준 수업</strong>
          <span>
            {gaewonSchoolContext.district} {gaewonSchoolContext.localPowerRegion} 필터를 사용합니다.
          </span>
          <small>{gaewonSchoolContext.limitNotice}</small>
        </div>
        <ol className="step-list">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
