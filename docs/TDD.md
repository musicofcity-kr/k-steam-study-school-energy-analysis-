# E-CITY 2050 수업 적용 TDD v2

## 기술 구조

- React 19 + Vite + TypeScript
- Recharts 시간대별 전력 그래프
- PapaParse CSV 파싱
- Vitest 단위·정적 컴포넌트 테스트
- 정적 프론트엔드 배포

## 공유 모델

`EnergyScenario`는 태양광, ESS, 조건부 수소 연료전지, 절감, 스마트 관리만 포함한다. 원자력은 외부 전력망 공급원 토론 카탈로그에만 존재한다.

`TeacherAssumptions`는 태양광 활동 시간당 공급, 수소 시간당 공급, ESS 용량·시간당 충전·방전 한계·왕복 효율, 절감 상한, 스마트 피크 절감 상한, 태양광 활동 시간, 수소 생산 방식을 가진다. 모든 기본값은 수업용 가정값이다.

`DataProvenance`는 다음 세 상태만 사용한다.

- `practice-assumption`
- `teacher-prepared-public-data`
- `unknown-upload`

## 시간별 에너지 수지

각 CSV 행을 시간 순서대로 다음 순서로 처리한다.

1. 원 수요를 읽는다.
2. 기본 절감률을 적용한다.
3. 피크 시간에는 스마트 관리 수업용 효과를 추가 적용한다.
4. 설정된 활동 시간에만 태양광을 발전시킨다.
5. 조건부 수소 연료전지 공급량을 계산한다.
6. 태양광과 수소를 현재 수요에 직접 사용한다.
7. 남은 태양광을 ESS 충전율·용량·효율 범위에서 저장한다.
8. 부족분을 ESS 방전율·현재 저장량 범위에서 보충한다.
9. 남은 부족분을 외부 전력망 사용량으로 기록한다.
10. 충전하지 못한 지역 발전량을 잉여 전력으로 기록한다.

ESS 저장량은 0에서 시작한다. 충전 입력에 왕복 효율을 적용해 저장량을 늘리는 수업용 단순 모델을 사용하며, ESS 방전량은 발전량으로 기록하지 않는다.

## 결과 지표

```text
지역 에너지 충당률 =
(절감 후 소비량 - 외부 전력망 사용량)
/ 절감 후 소비량 * 100
```

학생 화면의 1차 지표는 지역 충당률, 외부 전력망 사용량, 피크 대응 정도다. 다양성·환경성·현실성은 상세 비교에 둔다.

## 파일 책임

- `src/data/energyTechnologyCatalog.ts`: 기술 10종의 역할·입지·조건·오개념 경고
- `src/components/ElectricityJourneySection.tsx`: 전력 전달과 발전 원리
- `src/components/SitingSuitabilitySection.tsx`: 카드 확인과 장소 분류
- `src/components/ConceptCheckSection.tsx`: 즉시 해설 형성평가
- `src/components/DataUploadSection.tsx`: CSV와 출처 상태 입력
- `src/utils/energyModel.ts`: 시간별 에너지 수지와 결과 지표
- `src/utils/stateRestore.ts`: 범위 검증과 v1→v2 마이그레이션
- `src/components/DesignLabSection.tsx`: 시나리오 조절과 A/B 비교
- `src/components/FutureSchoolSystemSection.tsx`: 학교 안·조건부 지역·외부 공급 시각화
- `src/components/ReportSection.tsx`: 장소 적합성과 한계를 포함한 결과물
- `src/App.tsx`: 미션 상태, 저장 version 2, 모드와 초기화 통합

## 저장과 모드

- localStorage 저장 객체는 `version: 2`를 포함한다.
- v1 `hydrogenLevel`은 `hydrogenFuelCellLevel`로만 이전한다.
- v1 `nuclearLevel`은 어떤 새 슬라이더나 지역 발전량으로도 이전하지 않는다.
- `reportTouched`를 저장해 자동 보고서와 학생 편집 보고서를 구분한다.
- `자동 초안 다시 만들기`는 최신 `ReportInput`으로 초안을 재생성하고 편집 잠금을 해제한다.
- 손상된 출처 상세 필드는 문자열·범위 열거형을 검증한 뒤 기본값으로 복원한다.
- 교사용 설정은 `?mode=teacher`에서만 렌더한다.
- 저장 실패는 학생이 이해할 수 있는 상태 메시지로 표시한다.
- 학생 자동 저장은 sessionStorage, 교사의 명시적 장기 저장은 localStorage로 분리한다.
- 학생 모드에서는 저장된 교사용 가정값을 복원하지 않는다.

## 테스트 전략

- 카탈로그 역할·배치 테스트
- 개념 학습과 미션 순서 정적 렌더 테스트
- 선행 미션 잠금, 연습 데이터 출처 고정, 보고서 재생성 UI 테스트
- 역순 CSV의 날짜·시간 정렬과 ESS 수지 동일성 테스트
- 태양광 활동 시간 경계 테스트
- ESS 충전·방전·용량·효율·발전량 비합산 테스트
- 외부 전력망 부족분과 지역 충당률 테스트
- 피크 계산 시 반올림 전 원값 비교 테스트
- 구버전 상태와 version 2 복원 테스트
- 데이터 출처 배지·상세 필드·경고 테스트
- 수업용 데이터 보고서 경고와 장소 구분 테스트
- 학생 모드 교사용 설정 비노출 테스트
- A/B 설계 저장·비교 UI 테스트
- 빈 CSV, 잘못된 행, 잘못된 파일, CP949/EUC-KR 회귀 테스트 유지
- 1MB 초과·잘못된 CSV가 기존 정상 데이터를 지우지 않는지 확인
- 초기화 대화상자의 초점 잠금과 모바일 표의 셀 단위 표시 확인

## 완료 게이트

```bash
npm test
npm run build
```

브라우저에서는 데스크톱, 태블릿, 375px 스마트폰에서 첫 화면부터 보고서까지 확인한다. 수업용 데이터와 실제 CSV 업로드 흐름을 각각 검사하고 콘솔 오류, 가로 스크롤, 잘못된 출처 표기를 확인한다.
