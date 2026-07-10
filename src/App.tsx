import { useEffect, useMemo, useRef, useState } from 'react';
import { sampleEnergyUsageRows, practiceDataNotice } from './data/sampleEnergyUsage';
import { energyTechnologyCatalog } from './data/energyTechnologyCatalog';
import type {
  DataProvenance,
  DataProvenanceDetails,
  EnergyScenario,
  EnergyUsageRow,
  ReportInput,
  TeacherAssumptions,
  TechnologyPlacementDecision
} from './types';
import { calculateScenarioResult, calculateUsageSummary } from './utils/energyModel';
import { buildReportDraft } from './utils/reportBuilder';
import { restoreDataProvenanceDetails, restoreEnergyScenario, restoreTeacherAssumptions } from './utils/stateRestore';
import { ConceptCheckSection, conceptCheckQuestions } from './components/ConceptCheckSection';
import { DataUploadSection } from './components/DataUploadSection';
import { DesignLabSection } from './components/DesignLabSection';
import { ElectricityJourneySection } from './components/ElectricityJourneySection';
import { EnergyChart } from './components/EnergyChart';
import { Header } from './components/Header';
import { MissionMap, type MissionStep } from './components/MissionMap';
import { ReportSection } from './components/ReportSection';
import { requiredSitingTechnologyIds, SitingSuitabilitySection } from './components/SitingSuitabilitySection';
import { StartSection } from './components/StartSection';
import { TeacherSettingsPanel } from './components/TeacherSettingsPanel';

const STORAGE_KEY = 'ecity2050-energy-lab-state';
const SESSION_STORAGE_KEY = 'ecity2050-energy-lab-session';
const SAVED_STATE_VERSION = 2;

const defaultScenario: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenFuelCellLevel: 20,
  savingRate: 15,
  smartControlLevel: 50
};

const defaultAssumptions: TeacherAssumptions = {
  solarMaxKWhPerActiveHour: 50,
  hydrogenMaxKWhPerHour: 37.5,
  essMaxCapacityKWh: 180,
  essMaxChargeKWhPerHour: 30,
  essMaxDischargeKWhPerHour: 30,
  essRoundTripEfficiency: 0.9,
  savingMaxRate: 50,
  smartControlMaxPeakSavingRate: 10,
  gridEmissionFactor: 0.45,
  solarActiveStartHour: 7,
  solarActiveEndHour: 18,
  hydrogenSource: 'unspecified'
};

const defaultStrategies = ['피크 시간 전력 사용 줄이기', '낮 시간 태양광과 ESS 연결하기', '스마트 관리로 낭비 줄이기'];
const emptyProvenanceDetails: DataProvenanceDetails = {
  provider: '',
  datasetName: '',
  referenceDate: '',
  regionUnit: '',
  scope: 'unknown'
};

type ScenarioSlots = {
  A?: EnergyScenario;
  B?: EnergyScenario;
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function isEnergyRowArray(value: unknown): value is EnergyUsageRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        typeof row === 'object' &&
        row !== null &&
        typeof (row as EnergyUsageRow).hour === 'number' &&
        Number.isFinite((row as EnergyUsageRow).hour) &&
        (row as EnergyUsageRow).hour >= 0 &&
        (row as EnergyUsageRow).hour <= 23 &&
        typeof (row as EnergyUsageRow).usageKWh === 'number' &&
        Number.isFinite((row as EnergyUsageRow).usageKWh) &&
        (row as EnergyUsageRow).usageKWh >= 0
    )
  );
}

function isProvenance(value: unknown): value is DataProvenance {
  return value === 'practice-assumption' || value === 'teacher-prepared-public-data' || value === 'unknown-upload';
}

function isPlacementDecision(value: unknown): value is TechnologyPlacementDecision {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TechnologyPlacementDecision).technologyId === 'string' &&
    typeof (value as TechnologyPlacementDecision).placement === 'string' &&
    typeof (value as TechnologyPlacementDecision).reason === 'string'
  );
}

export default function App() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const isTeacherMode = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'teacher',
    []
  );
  const [rows, setRows] = useState<EnergyUsageRow[]>([]);
  const [dataSource, setDataSource] = useState('아직 데이터 없음');
  const [dataProvenance, setDataProvenance] = useState<DataProvenance>('unknown-upload');
  const [provenanceDetails, setProvenanceDetails] = useState<DataProvenanceDetails>(emptyProvenanceDetails);
  const [scenario, setScenario] = useState<EnergyScenario>(defaultScenario);
  const [assumptions, setAssumptions] = useState<TeacherAssumptions>(defaultAssumptions);
  const [savedScenarios, setSavedScenarios] = useState<ScenarioSlots>({});
  const [selectedScenarioId, setSelectedScenarioId] = useState<'A' | 'B' | undefined>();
  const [journeyAnswers, setJourneyAnswers] = useState<Record<string, string>>({});
  const [conceptAnswers, setConceptAnswers] = useState<Record<string, string>>({});
  const [viewedTechnologyIds, setViewedTechnologyIds] = useState<string[]>([]);
  const [placementDecisions, setPlacementDecisions] = useState<TechnologyPlacementDecision[]>([]);
  const [peakReason, setPeakReason] = useState('');
  const [peakConfirmed, setPeakConfirmed] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [cityName, setCityName] = useState('');
  const [keyStrategies, setKeyStrategies] = useState<string[]>(defaultStrategies);
  const [reportDraft, setReportDraft] = useState('');
  const [reportTouched, setReportTouched] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [storageStatus, setStorageStatus] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [restoredExistingProgress, setRestoredExistingProgress] = useState(false);
  const [dataMessage, setDataMessage] = useState('');
  const [dataMessageTone, setDataMessageTone] = useState<'success' | 'error'>('success');

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY) ?? (isTeacherMode ? localStorage.getItem(STORAGE_KEY) : null);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Record<string, unknown>;

      if (isEnergyRowArray(parsed.rows)) setRows(parsed.rows);
      if (typeof parsed.dataSource === 'string') setDataSource(parsed.dataSource);
      if (isProvenance(parsed.dataProvenance)) setDataProvenance(parsed.dataProvenance);
      setProvenanceDetails(restoreDataProvenanceDetails(parsed.provenanceDetails, emptyProvenanceDetails));
      setScenario(restoreEnergyScenario(parsed.scenario, defaultScenario));
      setAssumptions(isTeacherMode ? restoreTeacherAssumptions(parsed.assumptions, defaultAssumptions) : defaultAssumptions);
      if (typeof parsed.teamName === 'string') setTeamName(parsed.teamName);
      if (typeof parsed.cityName === 'string') setCityName(parsed.cityName);
      if (Array.isArray(parsed.keyStrategies)) {
        const safeStrategies = parsed.keyStrategies.filter((value): value is string => typeof value === 'string').slice(0, 3);
        if (safeStrategies.length > 0) setKeyStrategies(safeStrategies);
      }
      if (typeof parsed.reportDraft === 'string') setReportDraft(parsed.reportDraft);
      if (typeof parsed.reportTouched === 'boolean') setReportTouched(parsed.reportTouched);
      if (typeof parsed.peakReason === 'string') setPeakReason(parsed.peakReason);
      if (parsed.peakConfirmed === true) setPeakConfirmed(true);
      if (Array.isArray(parsed.viewedTechnologyIds)) {
        setViewedTechnologyIds(parsed.viewedTechnologyIds.filter((value): value is string => typeof value === 'string'));
      }
      if (Array.isArray(parsed.placementDecisions)) setPlacementDecisions(parsed.placementDecisions.filter(isPlacementDecision));
      if (typeof parsed.journeyAnswers === 'object' && parsed.journeyAnswers !== null) setJourneyAnswers(parsed.journeyAnswers as Record<string, string>);
      if (typeof parsed.conceptAnswers === 'object' && parsed.conceptAnswers !== null) setConceptAnswers(parsed.conceptAnswers as Record<string, string>);
      if (typeof parsed.savedScenarios === 'object' && parsed.savedScenarios !== null) {
        const raw = parsed.savedScenarios as ScenarioSlots;
        setSavedScenarios({
          A: raw.A ? restoreEnergyScenario(raw.A, defaultScenario) : undefined,
          B: raw.B ? restoreEnergyScenario(raw.B, defaultScenario) : undefined
        });
      }
      if (parsed.selectedScenarioId === 'A' || parsed.selectedScenarioId === 'B') setSelectedScenarioId(parsed.selectedScenarioId);
      setRestoredExistingProgress(true);
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Restricted browsers may block storage. The app still works without persistence.
      }
    } finally {
      setStorageReady(true);
    }
  }, []);

  const summary = useMemo(() => calculateUsageSummary(rows), [rows]);
  const result = useMemo(() => calculateScenarioResult(rows, scenario, assumptions), [rows, scenario, assumptions]);
  const isPracticeData = dataSource === '수업용 가정 데이터';
  const effectiveDataProvenance: DataProvenance = isPracticeData ? 'practice-assumption' : dataProvenance;
  const effectiveProvenanceDetails = isPracticeData ? emptyProvenanceDetails : provenanceDetails;
  const reportInput: ReportInput = useMemo(
    () => ({
      teamName,
      cityName,
      dataSource,
      dataProvenance: effectiveDataProvenance,
      provenanceDetails: effectiveProvenanceDetails,
      scenario,
      result,
      keyStrategies,
      placementDecisions,
      peakReason
    }),
    [cityName, dataSource, effectiveDataProvenance, effectiveProvenanceDetails, keyStrategies, peakReason, placementDecisions, result, scenario, teamName]
  );

  const journeyDone =
    journeyAnswers.directConversion === 'solar' && journeyAnswers.sharedPrinciple === 'steam-turbine-generator';
  const placementById = new Map(energyTechnologyCatalog.map((technology) => [technology.id, technology.placement]));
  const requiredSitingIds = new Set<string>(requiredSitingTechnologyIds);
  const completeDecisions = placementDecisions.filter(
    (item) => requiredSitingIds.has(item.technologyId) && item.reason.trim() && viewedTechnologyIds.includes(item.technologyId) && placementById.get(item.technologyId) === item.placement
  );
  const sitingDone = completeDecisions.length === requiredSitingTechnologyIds.length;
  const conceptDone = conceptCheckQuestions.every((question) => conceptAnswers[question.id] === question.answer);
  const missionTwoDone = journeyDone && sitingDone && conceptDone;
  const dataDone = missionTwoDone && rows.length > 0 && peakConfirmed && Boolean(peakReason);
  const designDone = dataDone && Boolean(savedScenarios.A && savedScenarios.B && selectedScenarioId);
  const reportDone = Boolean(
    designDone && teamName.trim() && cityName.trim() && effectiveDataProvenance !== 'unknown-upload'
  );
  const missionSteps: MissionStep[] = [
    { id: 'electricity-journey', title: '1 전기는 어디서?', status: journeyDone ? '완료' : '개념 확인', done: journeyDone },
    { id: 'siting-suitability', title: '2 학교 주변 적합성', status: missionTwoDone ? '완료' : journeyDone ? '분류·확인' : '이전 미션 먼저', done: missionTwoDone, locked: !journeyDone },
    { id: 'data-lab', title: '3 전력 패턴 탐정', status: dataDone ? '완료' : missionTwoDone ? rows.length > 0 ? '원인 추론' : '데이터 대기' : '이전 미션 먼저', done: dataDone, locked: !missionTwoDone },
    { id: 'design-lab', title: '4 미래학교 시스템', status: designDone ? '완료' : dataDone ? 'A/B 비교' : '이전 미션 먼저', done: designDone, locked: !dataDone },
    { id: 'report', title: '5 보고서 & 발표', status: reportDone ? '완료' : designDone ? '작성 대기' : '이전 미션 먼저', done: reportDone, locked: !designDone }
  ];
  const activeMissionIndex = missionSteps.findIndex((step) => !step.done);
  const nextMissionId = activeMissionIndex >= 0 ? missionSteps[activeMissionIndex].id : 'report';

  const savedStatePayload = useMemo(
    () => ({
      version: SAVED_STATE_VERSION,
      rows,
      dataSource,
      dataProvenance: effectiveDataProvenance,
      provenanceDetails: effectiveProvenanceDetails,
      scenario,
      assumptions: isTeacherMode ? assumptions : defaultAssumptions,
      savedScenarios,
      selectedScenarioId,
      journeyAnswers,
      conceptAnswers,
      viewedTechnologyIds,
      placementDecisions,
      peakReason,
      peakConfirmed,
      teamName,
      cityName,
      keyStrategies,
      reportDraft,
      reportTouched
    }),
    [
      assumptions,
      cityName,
      conceptAnswers,
      dataSource,
      effectiveDataProvenance,
      effectiveProvenanceDetails,
      journeyAnswers,
      keyStrategies,
      peakConfirmed,
      peakReason,
      placementDecisions,
      reportDraft,
      reportTouched,
      rows,
      savedScenarios,
      scenario,
      selectedScenarioId,
      teamName,
      viewedTechnologyIds,
      isTeacherMode
    ]
  );

  useEffect(() => {
    if (!storageReady) return;
    setStorageStatus('저장 중');
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(savedStatePayload));
        setStorageStatus('이 탭에 자동 저장됨');
      } catch {
        setStorageStatus('자동 저장을 사용할 수 없음');
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [savedStatePayload, storageReady]);

  useEffect(() => {
    if (!reportTouched) setReportDraft(buildReportDraft(reportInput));
  }, [reportInput, reportTouched]);

  const loadPracticeData = () => {
    setRows(sampleEnergyUsageRows);
    setDataSource('수업용 가정 데이터');
    setDataProvenance('practice-assumption');
    setProvenanceDetails(emptyProvenanceDetails);
    setDataMessage(practiceDataNotice);
    setDataMessageTone('success');
    setPeakConfirmed(false);
    setPeakReason('');
  };

  const handleRowsParsed = (nextRows: EnergyUsageRow[], sourceLabel: string, provenance: DataProvenance) => {
    setRows(nextRows);
    setDataProvenance(provenance);
    setProvenanceDetails(emptyProvenanceDetails);
    setPeakConfirmed(false);
    setPeakReason('');
    if (nextRows.length === 0) {
      setDataSource('아직 유효 데이터 없음');
      setDataMessage(`${sourceLabel}에서 유효한 전력사용량 행을 찾지 못했습니다. usage_kWh 값을 확인해 주세요.`);
      setDataMessageTone('error');
      return;
    }
    setDataSource(sourceLabel);
    setDataMessage(`${sourceLabel} 데이터를 불러왔습니다. 유효 행 ${nextRows.length}개를 사용합니다.`);
    setDataMessageTone('success');
  };

  const handleSaveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStatePayload));
      setSaveMessage('현재 활동과 보고서를 이 브라우저에 저장했습니다.');
      setStorageStatus('이 탭에 자동 저장됨');
    } catch {
      setSaveMessage('브라우저 저장 공간이 부족하거나 저장이 차단되었습니다. JSON 저장을 사용해 주세요.');
    }
  };

  const updatePlacementDecision = (decision: TechnologyPlacementDecision) => {
    setPlacementDecisions((current) => [...current.filter((item) => item.technologyId !== decision.technologyId), decision]);
  };

  const resetDesign = () => {
    setScenario(defaultScenario);
    setSavedScenarios({});
    setSelectedScenarioId(undefined);
    setReportTouched(false);
    setRestoredExistingProgress(false);
    setSaveMessage('현재 팀의 설계안 A/B를 초기화했습니다.');
  };

  const resetClass = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // State reset below is still available when storage access is restricted.
    }
    setRows([]);
    setDataSource('아직 데이터 없음');
    setDataProvenance('unknown-upload');
    setProvenanceDetails(emptyProvenanceDetails);
    setScenario(defaultScenario);
    setAssumptions(defaultAssumptions);
    setSavedScenarios({});
    setSelectedScenarioId(undefined);
    setJourneyAnswers({});
    setConceptAnswers({});
    setViewedTechnologyIds([]);
    setPlacementDecisions([]);
    setPeakReason('');
    setPeakConfirmed(false);
    setTeamName('');
    setCityName('');
    setKeyStrategies(defaultStrategies);
    setReportDraft('');
    setReportTouched(false);
    setDataMessage('');
    setSaveMessage('수업 활동과 브라우저 저장 내용을 초기화했습니다.');
    scrollToId('start');
  };

  return (
    <div className="app-shell">
      <Header
        rowCount={rows.length}
        localSupplyRate={result.localSupplyRate}
        dataSource={dataSource}
        dataProvenance={effectiveDataProvenance}
        isTeacherMode={isTeacherMode}
        storageStatus={storageStatus}
        onResetDesign={resetDesign}
        onResetClass={resetClass}
      />
      <main>
        <StartSection
          isTeacherMode={isTeacherMode}
          hasSavedProgress={restoredExistingProgress}
          onStart={() => scrollToId(restoredExistingProgress ? nextMissionId : 'electricity-journey')}
        />

        <section className="notice-band" aria-label="수업용 모델 안내">
          <strong>중요 안내</strong>
          <span>학교 밖 발전소, 학교 안 기술, 저장·절감·관리와 외부 전력망을 구분합니다. 모든 기본값은 수업용 가정값입니다.</span>
        </section>

        <MissionMap steps={missionSteps} activeIndex={activeMissionIndex} onSelect={scrollToId} />

        <ElectricityJourneySection
          answers={journeyAnswers}
          onAnswerChange={(questionId, answer) => setJourneyAnswers((current) => ({ ...current, [questionId]: answer }))}
        />

        <SitingSuitabilitySection
          viewedTechnologyIds={viewedTechnologyIds}
          decisions={placementDecisions}
          locked={!journeyDone}
          conceptDone={conceptDone}
          isTeacherMode={isTeacherMode}
          onViewed={(id) => setViewedTechnologyIds((current) => current.includes(id) ? current : [...current, id])}
          onDecisionChange={updatePlacementDecision}
        />

        <ConceptCheckSection
          answers={conceptAnswers}
          locked={!journeyDone}
          onAnswerChange={(questionId, answer) => setConceptAnswers((current) => ({ ...current, [questionId]: answer }))}
        />

        <DataUploadSection
          rows={rows}
          summary={summary}
          dataSource={dataSource}
          dataProvenance={effectiveDataProvenance}
          provenanceDetails={effectiveProvenanceDetails}
          dataMessage={dataMessage}
          dataMessageTone={dataMessageTone}
          locked={!missionTwoDone}
          provenanceLocked={isPracticeData}
          isTeacherMode={isTeacherMode}
          uploadInputRef={uploadInputRef}
          onRowsParsed={handleRowsParsed}
          onProvenanceChange={(provenance, details) => {
            if (isPracticeData) return;
            setDataProvenance(provenance);
            setProvenanceDetails(details);
          }}
          onLoadPractice={loadPracticeData}
        />

        <EnergyChart
          summary={summary}
          peakConfirmed={peakConfirmed}
          solarLevel={scenario.solarLevel}
          solarActiveStartHour={assumptions.solarActiveStartHour}
          solarActiveEndHour={assumptions.solarActiveEndHour}
          peakReason={peakReason}
          locked={!missionTwoDone}
          onPeakReasonChange={(reason) => {
            setPeakReason(reason);
            setPeakConfirmed(false);
          }}
          onPeakConfirmed={() => setPeakConfirmed(true)}
        />

        <DesignLabSection
          scenario={scenario}
          assumptions={assumptions}
          result={result}
          savedScenarios={savedScenarios}
          selectedScenarioId={selectedScenarioId}
          locked={!dataDone}
          onScenarioChange={(nextScenario) => {
            setScenario(nextScenario);
            setSelectedScenarioId(undefined);
          }}
          onSaveScenario={(slot) => setSavedScenarios((current) => ({ ...current, [slot]: scenario }))}
          onLoadScenario={(slot) => savedScenarios[slot] && setScenario(savedScenarios[slot] as EnergyScenario)}
          onSelectScenario={(slot) => {
            const selected = savedScenarios[slot];
            if (selected) {
              setScenario(selected);
              setSelectedScenarioId(slot);
            }
          }}
        />

        {isTeacherMode && <TeacherSettingsPanel assumptions={assumptions} onAssumptionsChange={setAssumptions} />}

        <ReportSection
          teamName={teamName}
          cityName={cityName}
          dataSource={dataSource}
          scenario={scenario}
          result={result}
          keyStrategies={keyStrategies}
          reportDraft={reportDraft}
          reportInput={reportInput}
          saveMessage={saveMessage}
          isTeacherMode={isTeacherMode}
          locked={!designDone}
          onTeamNameChange={setTeamName}
          onCityNameChange={setCityName}
          onKeyStrategiesChange={setKeyStrategies}
          onReportDraftChange={(value) => {
            setReportTouched(true);
            setReportDraft(value);
          }}
          onRegenerateReport={() => {
            setReportTouched(false);
            setReportDraft(buildReportDraft(reportInput));
            setSaveMessage('현재 데이터와 설계로 자동 초안을 다시 만들었습니다.');
          }}
          onSaveState={handleSaveState}
        />
      </main>
    </div>
  );
}
