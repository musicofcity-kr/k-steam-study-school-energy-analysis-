# E-CITY 2050 Energy Design Lab TDD

## 기술 구조

- Framework: React + Vite + TypeScript
- Chart: Recharts
- CSV parsing: PapaParse
- Test: Vitest
- Deploy target: Vercel static frontend

## 파일 책임

- `src/types.ts`: 공유 타입
- `src/data/sampleEnergyUsage.ts`: 수업 연습용 예시 데이터
- `src/data/energySourceCards.ts`: 에너지원 카드 콘텐츠
- `src/data/gaewonSchoolContext.ts`: 개원중학교 학교 맥락, 전력 원천자료명, 개포동 필터, 표준 CSV 컬럼, 데이터팩 한계 문구
- `src/data/scoreWeights.ts`: 수업용 점수 계수와 설계 의도
- `src/utils/decodeCsvFile.ts`: UTF-8, UTF-8 BOM, EUC-KR/CP949 CSV 디코딩
- `src/utils/csvParser.ts`: CSV 파싱, 컬럼 감지, 행 검증
- `src/utils/energyModel.ts`: 사용량 요약, 시나리오 계산, 점수와 설명 생성
- `src/utils/reportBuilder.ts`: 학생 보고서 초안과 JSON 저장 데이터 구성
- `src/App.tsx`: 화면 상태와 섹션 조합
- `src/components/*`: 각 화면 섹션
- `src/styles.css`: 반응형 UI 스타일

## 모델 가정

- 하루 총 전력소비량은 업로드된 유효 행의 전력사용량 합계다.
- 절감 후 소비량은 `총 소비량 * (1 - 절감률)`이다.
- 태양광, 수소, 차세대 원자력은 교사용 시간당 평균 공급 가정값, 슬라이더 비율, 유효 데이터 행 수를 곱해 공급 가능 전력으로 계산한다.
- ESS는 발전량에 합산하지 않고 안정성/피크 대응 점수에만 반영한다.
- 여러 날짜가 있는 CSV는 시간대별 그래프를 합산이 아니라 시간대별 평균으로 표시한다.
- 자립률 계산값은 100%를 넘을 수 있지만 학생 화면에는 100% 달성과 잉여 전력 토론 문구로 표시한다.
- 모든 점수는 교육용 비교 지표이며 실제 공학값이 아니다.

## 테스트 전략

- 순수 함수는 Vitest 단위 테스트를 먼저 작성한다.
- 핵심 검증 대상은 CSV 디코딩, CSV 파싱, 계산 모델, 보고서 생성, 개원중학교 데이터팩 메타데이터다.
- UI는 TypeScript 빌드와 브라우저 스모크 체크로 검증한다.
- 입력 오류, 빈 데이터, 잘못된 CSV, 음수 사용량은 테스트에 포함한다.

## 접근성 및 UX 기준

- 첫 화면에 즉시 보이는 시작 버튼을 둔다.
- 버튼과 슬라이더 라벨은 학생 행동 중심 문장으로 쓴다.
- 그래프는 색만으로 의미를 구분하지 않고 피크 시간 텍스트를 함께 제공한다.
- 모바일에서는 섹션이 한 열로 흐르고 터치 대상은 충분히 크게 둔다.

## 저장 방식

- 보고서 초안과 설계 상태는 localStorage에 저장한다.
- JSON 다운로드는 브라우저에서 Blob으로 생성한다.
- 서버 저장이나 학생 개인정보 수집은 MVP 범위에 포함하지 않는다.

## 한계 표시

앱과 문서에는 다음 의미의 안내를 유지한다.

> 이 도구는 중학교 수업용 비교 모델입니다. 실제 도시 설계에는 지역 일사량, 설치 면적, 설비 효율, 법·안전 기준, 비용 분석 등이 필요합니다.
