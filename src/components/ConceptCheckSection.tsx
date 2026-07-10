export type ConceptCheckQuestionId = 'ess-generation' | 'nuclear-onsite' | 'solar-at-night' | 'grid-failure';
export type ConceptCheckAnswers = Record<string, string>;

export type ConceptCheckSectionProps = {
  answers: ConceptCheckAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
  locked?: boolean;
};

type ConceptQuestion = {
  id: ConceptCheckQuestionId;
  statement: string;
  answer: 'o' | 'x';
  explanation: string;
};

export const conceptCheckQuestions: ConceptQuestion[] = [
  {
    id: 'ess-generation',
    statement: 'ESS는 전기를 새로 만드는 발전 기술이다.',
    answer: 'x',
    explanation: 'ESS는 남는 전기를 저장했다가 필요할 때 내보내는 장치입니다. 전기를 새로 만들지는 않습니다.'
  },
  {
    id: 'nuclear-onsite',
    statement: '원자력발전소는 학교 옥상에 설치할 수 있다.',
    answer: 'x',
    explanation: '원자력발전소는 큰 부지, 안전 시설, 냉각 시설이 필요한 학교 밖 발전 시설입니다.'
  },
  {
    id: 'solar-at-night',
    statement: '태양광은 밤에도 낮과 같은 양의 전기를 만든다.',
    answer: 'x',
    explanation: '태양광은 햇빛이 있어야 전기를 만듭니다. 밤에는 ESS나 외부 전력망 같은 다른 공급 방법이 필요합니다.'
  },
  {
    id: 'grid-failure',
    statement: '외부 전력망을 사용하는 학교구역은 실패한 설계이다.',
    answer: 'x',
    explanation: '외부 전력망은 학교 안에서 부족한 전기를 안정적으로 보충합니다. 실제 학교에도 필요한 연결 시스템입니다.'
  }
];

export function isConceptCheckComplete(answers: ConceptCheckAnswers) {
  return conceptCheckQuestions.every((question) => answers[question.id] === 'o' || answers[question.id] === 'x');
}

export function ConceptCheckSection({ answers, onAnswerChange, locked = false }: ConceptCheckSectionProps) {
  return (
    <section className="source-section" id="concept-check">
      <div className="section-heading">
        <p className="eyebrow">개념 확인</p>
        <h2>발전·저장·전력망 구분하기</h2>
        <p>각 문장을 읽고 O 또는 X를 선택하면 바로 설명을 확인할 수 있습니다.</p>
      </div>

      {locked && (
        <div className="notice-band" role="status">
          <strong>잠김</strong>
          <span>먼저 미션 1의 개념 확인 2문항을 완료하세요.</span>
        </div>
      )}

      {!locked && <div className="source-card-grid">
        {conceptCheckQuestions.map((question, index) => {
          const hasAnswer = answers[question.id] === 'o' || answers[question.id] === 'x';
          const selectedAnswer = answers[question.id];
          const isCorrect = hasAnswer && selectedAnswer === question.answer;

          return (
            <fieldset className="mission-panel" disabled={locked} key={question.id}>
              <legend>
                {index + 1}. {question.statement}
              </legend>
              <div className="toolbar" role="group" aria-label={`${index + 1}번 문항 답 선택`}>
                <button
                  className={selectedAnswer === 'o' ? 'primary-button' : 'secondary-button'}
                  type="button"
                  disabled={locked}
                  aria-pressed={selectedAnswer === 'o'}
                  onClick={() => !locked && onAnswerChange(question.id, 'o')}
                >
                  O
                </button>
                <button
                  className={selectedAnswer === 'x' ? 'primary-button' : 'secondary-button'}
                  type="button"
                  disabled={locked}
                  aria-pressed={selectedAnswer === 'x'}
                  onClick={() => !locked && onAnswerChange(question.id, 'x')}
                >
                  X
                </button>
              </div>
              {hasAnswer && (
                <p className={isCorrect ? 'message success' : 'message warning'} role="status">
                  <strong>{isCorrect ? '정답입니다.' : '다시 생각해 보세요.'}</strong> {question.explanation}
                </p>
              )}
            </fieldset>
          );
        })}
      </div>}
    </section>
  );
}
