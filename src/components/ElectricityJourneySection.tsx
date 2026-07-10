export type ElectricityJourneyAnswers = Record<string, string>;

export type ElectricityJourneySectionProps = {
  answers: ElectricityJourneyAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
};

export function isElectricityJourneyComplete(answers: ElectricityJourneyAnswers) {
  return (
    ['solar', 'wind', 'thermal'].includes(answers.directConversion) &&
    ['steam-turbine-generator', 'sunlight-battery', 'water-dam'].includes(answers.sharedPrinciple)
  );
}

export function ElectricityJourneySection({
  answers,
  onAnswerChange
}: ElectricityJourneySectionProps) {
  return (
    <section className="source-section" id="electricity-journey">
      <div className="section-heading">
        <p className="eyebrow">미션 1</p>
        <h2>1 전기는 어디서?</h2>
        <p>학교에서 쓰는 전기는 여러 발전소에서 만들어진 뒤 전력망을 따라 학교까지 옵니다.</p>
      </div>

      <div className="mission-panel">
        <h3>발전소에서 학교까지</h3>
        <ol className="step-list">
          <li><strong>발전소:</strong> 열, 물, 바람의 힘을 얻거나 태양전지에 햇빛을 받습니다.</li>
          <li><strong>전기로 변환:</strong> 터빈과 발전기가 전기를 만들고, 태양전지는 햇빛을 전기로 직접 바꿉니다.</li>
          <li><strong>전력망:</strong> 송전선이 전기를 보내고 변전소가 전압을 알맞게 바꿉니다.</li>
          <li><strong>학교:</strong> 지역 배전선을 지난 전기가 교실과 학교 시설에 도착합니다.</li>
        </ol>
      </div>

      <div className="mission-panel" aria-label="전기 생산 원리 개념 확인">
        <h3>개념 확인 2문항</h3>
        <label>
          <span>1. 터빈을 돌리지 않고 빛을 직접 전기로 바꾸는 방식은?</span>
          <select
            value={answers.directConversion ?? ''}
            onChange={(event) => onAnswerChange('directConversion', event.target.value)}
          >
            <option value="" disabled>
              답을 선택하세요
            </option>
            <option value="solar">태양광 발전</option>
            <option value="wind">풍력 발전</option>
            <option value="thermal">화력 발전</option>
          </select>
        </label>
        {answers.directConversion && (
          <p className={answers.directConversion === 'solar' ? 'message success' : 'message warning'} role="status">
            {answers.directConversion === 'solar'
              ? '정답입니다. 태양전지는 햇빛 에너지를 전기로 직접 바꿉니다.'
              : '다시 생각해 보세요. 풍력과 화력은 터빈과 발전기를 사용합니다.'}
          </p>
        )}

        <label>
          <span>2. 원자력 발전과 화력 발전의 공통점은?</span>
          <select
            value={answers.sharedPrinciple ?? ''}
            onChange={(event) => onAnswerChange('sharedPrinciple', event.target.value)}
          >
            <option value="" disabled>
              답을 선택하세요
            </option>
            <option value="steam-turbine-generator">열로 증기를 만들고 터빈과 발전기를 돌립니다.</option>
            <option value="sunlight-battery">햇빛을 배터리에 바로 저장합니다.</option>
            <option value="water-dam">댐에 저장한 물로 발전합니다.</option>
          </select>
        </label>
        {answers.sharedPrinciple && (
          <p className={answers.sharedPrinciple === 'steam-turbine-generator' ? 'message success' : 'message warning'} role="status">
            {answers.sharedPrinciple === 'steam-turbine-generator'
              ? '정답입니다. 열을 얻는 방법은 다르지만 두 방식 모두 증기로 터빈과 발전기를 돌립니다.'
              : '다시 생각해 보세요. 두 방식은 서로 다른 열원으로 물을 끓여 증기를 만듭니다.'}
          </p>
        )}
      </div>

      <div className="section-heading compact">
        <h3>발전 원리 한눈에 보기</h3>
      </div>
      <div className="source-card-grid" aria-label="발전방식별 전기 생산 원리">
        <JourneyCard title="화력" description="연료를 태운 열 → 물을 끓여 만든 증기 → 터빈 → 발전기" />
        <JourneyCard title="원자력" description="핵분열에서 나온 열 → 물을 끓여 만든 증기 → 터빈 → 발전기" />
        <JourneyCard title="수력" description="흐르는 물 → 터빈 → 발전기" />
        <JourneyCard title="풍력" description="바람 → 날개와 터빈 → 발전기" />
        <JourneyCard title="태양광" description="햇빛 → 태양전지 → 전기" />
      </div>
    </section>
  );
}

function JourneyCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="mission-panel">
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}
