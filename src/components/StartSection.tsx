import { gaewonSchoolContext } from '../data/gaewonSchoolContext';

type StartSectionProps = {
  onStart: () => void;
  onLoadPractice: () => void;
  onUploadClick: () => void;
};

export function StartSection({ onStart, onLoadPractice, onUploadClick }: StartSectionProps) {
  return (
    <section className="start-section" id="start">
      <div className="start-copy">
        <p className="eyebrow">미래도시 설계 관제탑</p>
        <h1>E-CITY 2050 미션 관제탑</h1>
        <p className="lead">
          데이터로 전기 사용 피크를 찾아내고, 2050년 우리 학교구역의 에너지 조합을 완성하세요.
        </p>
        <div className="mission-choice-grid">
          <button className="mission-choice recommended" type="button" onClick={onLoadPractice}>
            <span>추천 · 바로 시작</span>
            <strong>연습용 데이터로 출발하기</strong>
            <small>가상 학교구역의 24시간 전력 데이터로 미션을 연습합니다.</small>
          </button>
          <button className="mission-choice" type="button" onClick={onUploadClick}>
            <span>선생님 준비 자료</span>
            <strong>진짜 데이터 업로드하기</strong>
            <small>공공데이터에서 내려받은 CSV를 올립니다. 열 이름이 달라도 앱이 찾아줍니다.</small>
          </button>
        </div>
        <button className="secondary-button compact-button" type="button" onClick={onStart}>
          미션 1로 이동
        </button>
      </div>
      <div className="mission-panel" aria-label="오늘의 미션">
        <h2>관제탑 브리핑</h2>
        <p>데이터에서 전력 사용 피크를 찾고, 그 문제를 줄이는 미래 학교구역 설계안을 만듭니다.</p>
        <div className="school-context">
          <strong>{gaewonSchoolContext.schoolName} 기준 수업</strong>
          <span>
            {gaewonSchoolContext.district} {gaewonSchoolContext.localPowerRegion} 필터를 사용합니다.
          </span>
          <small>{gaewonSchoolContext.limitNotice}</small>
        </div>
        <p className="model-note">지금 보이는 데이터와 기본값은 연습용입니다. 진짜 데이터는 선생님이 준비하고, 보고서에는 데이터 출처를 꼭 적습니다.</p>
      </div>
    </section>
  );
}
