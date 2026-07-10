import { gaewonSchoolContext } from '../data/gaewonSchoolContext';

type StartSectionProps = {
  onStart: () => void;
  hasSavedProgress?: boolean;
  isTeacherMode?: boolean;
};

export function StartSection({ onStart, hasSavedProgress = false, isTeacherMode = false }: StartSectionProps) {
  return (
    <section className="start-section" id="start">
      <div className="start-copy">
        <p className="eyebrow">미래도시 설계 관제탑</p>
        <h1>E-CITY 2050 미래학교 에너지 설계</h1>
        <p className="lead">
          지금 학교의 전기가 오는 길부터 살펴보고, 2050년 미래학교에 맞는 에너지 시스템을 설계하세요.
        </p>
        <div className="opening-questions" aria-label="수업 핵심 질문">
          <strong>오늘의 핵심 질문</strong>
          <ul>
            <li>지금 학교의 전기는 어디에서 올까?</li>
            <li>왜 발전소는 학교 옆에 없을까?</li>
            <li>2050 미래학교는 어떤 기술을 직접 사용할 수 있을까?</li>
          </ul>
        </div>
        <button className="primary-button start-lesson-button" type="button" onClick={onStart}>
          {hasSavedProgress ? '저장한 미션 이어하기' : '발전 원리부터 시작하기'}
        </button>
        {hasSavedProgress && (
          <p className="message info" role="status">
            이 탭에 저장된 활동이 있습니다. 내 모둠 활동이 아니면 위의 ‘처음부터’를 누르세요.
          </p>
        )}
      </div>
      <div className="mission-panel" aria-label="오늘의 미션">
        <h2>관제탑 브리핑</h2>
        <p>발전소에서 학교까지 오는 전기의 길을 이해하고, 학교 안 기술과 외부 공급 기술을 구분합니다.</p>
        <div className="school-context">
          <strong>{gaewonSchoolContext.schoolName} 기준 수업</strong>
          {isTeacherMode ? (
            <>
              <span>
                {gaewonSchoolContext.district} {gaewonSchoolContext.localPowerRegion} 필터를 사용합니다.
              </span>
              <small>{gaewonSchoolContext.limitNotice}</small>
            </>
          ) : (
            <span>실제 학교 전력량이 아닌 수업용 비교 데이터입니다.</span>
          )}
        </div>
        <p className="model-note">
          {isTeacherMode
            ? '전력 데이터는 미션 3에서 불러옵니다. 수업용 가정 데이터와 교사가 준비한 공공데이터를 반드시 구분합니다.'
            : '전력 데이터는 미션 3에서 불러옵니다.'}
        </p>
      </div>
    </section>
  );
}
