import { useEffect, useMemo, useRef, useState } from 'react';
import { energySourceCards } from './data/energySourceCards';
import { practiceDataNotice, sampleEnergyUsageRows } from './data/sampleEnergyUsage';
import type { EnergyScenario, EnergyUsageRow, ReportInput, TeacherAssumptions } from './types';
import { calculateScenarioResult, calculateUsageSummary } from './utils/energyModel';
import { buildReportDraft } from './utils/reportBuilder';
import { restoreEnergyScenario, restoreTeacherAssumptions } from './utils/stateRestore';
import { DataUploadSection } from './components/DataUploadSection';
import { DesignLabSection } from './components/DesignLabSection';
import { EnergyChart } from './components/EnergyChart';
import { EnergySourceCards } from './components/EnergySourceCards';
import { Header } from './components/Header';
import { MissionMap, type MissionStep } from './components/MissionMap';
import { ReportSection } from './components/ReportSection';
import { StartSection } from './components/StartSection';
import { TeacherSettingsPanel } from './components/TeacherSettingsPanel';

const STORAGE_KEY = 'ecity2050-energy-lab-state';

const defaultScenario: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenLevel: 20,
  nuclearLevel: 0,
  savingRate: 15
};

const defaultAssumptions: TeacherAssumptions = {
  solarMaxKWhPerHour: 50,
  hydrogenMaxKWhPerHour: 37.5,
  nuclearMaxKWhPerHour: 45.8,
  savingMaxRate: 50,
  gridEmissionFactor: 0.45
};

const defaultStrategies = ['피크 시간 전력 사용 줄이기', '낮 시간 태양광 활용하기', 'ESS로 남는 전기 저장하기'];

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
        typeof (row as EnergyUsageRow).usageKWh === 'number'
    )
  );
}

export default function App() {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<EnergyUsageRow[]>([]);
  const [dataSource, setDataSource] = useState('아직 데이터 없음');
  const [scenario, setScenario] = useState<EnergyScenario>(defaultScenario);
  const [assumptions, setAssumptions] = useState<TeacherAssumptions>(defaultAssumptions);
  const [teamName, setTeamName] = useState('');
  const [cityName, setCityName] = useState('');
  const [keyStrategies, setKeyStrategies] = useState<string[]>(defaultStrategies);
  const [reportDraft, setReportDraft] = useState('');
  const [reportTouched, setReportTouched] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [dataMessage, setDataMessage] = useState('');
  const [peakConfirmed, setPeakConfirmed] = useState(false);
  const [cardsCompared, setCardsCompared] = useState(false);
  const [designChanged, setDesignChanged] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Partial<{
        rows: unknown;
        dataSource: string;
        scenario: EnergyScenario;
        assumptions: TeacherAssumptions;
        teamName: string;
        cityName: string;
        keyStrategies: string[];
        reportDraft: string;
      }>;

      if (isEnergyRowArray(parsed.rows)) setRows(parsed.rows);
      if (typeof parsed.dataSource === 'string') setDataSource(parsed.dataSource);
      if (parsed.scenario) setScenario(restoreEnergyScenario(parsed.scenario, defaultScenario));
      if (parsed.assumptions) setAssumptions(restoreTeacherAssumptions(parsed.assumptions, defaultAssumptions));
      if (typeof parsed.teamName === 'string') setTeamName(parsed.teamName);
      if (typeof parsed.cityName === 'string') setCityName(parsed.cityName);
      if (Array.isArray(parsed.keyStrategies)) setKeyStrategies(parsed.keyStrategies.slice(0, 3));
      if (typeof parsed.reportDraft === 'string') {
        setReportDraft(parsed.reportDraft);
        setReportTouched(true);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const summary = useMemo(() => calculateUsageSummary(rows), [rows]);
  const result = useMemo(() => calculateScenarioResult(rows, scenario, assumptions), [rows, scenario, assumptions]);

  const reportInput: ReportInput = useMemo(
    () => ({
      teamName,
      cityName,
      dataSource,
      scenario,
      result,
      keyStrategies
    }),
    [cityName, dataSource, keyStrategies, result, scenario, teamName]
  );
  const missionSteps: MissionStep[] = [
    {
      id: 'data-lab',
      title: '데이터 수집',
      status: rows.length > 0 ? '완료' : '대기',
      done: rows.length > 0
    },
    {
      id: 'chart',
      title: '패턴 탐정',
      status: peakConfirmed ? '완료' : rows.length > 0 ? '피크 확인' : '대기',
      done: peakConfirmed
    },
    {
      id: 'energy-sources',
      title: '에너지 카드',
      status: cardsCompared ? '완료' : '카드 비교',
      done: cardsCompared
    },
    {
      id: 'design-lab',
      title: '도시 설계 랩',
      status: designChanged ? '완료' : '조절 대기',
      done: designChanged
    },
    {
      id: 'report',
      title: '보고서 & 발표',
      status: teamName.trim() && cityName.trim() ? '완료' : '작성 대기',
      done: Boolean(teamName.trim() && cityName.trim())
    }
  ];
  const activeMissionIndex = missionSteps.findIndex((step) => !step.done);

  useEffect(() => {
    if (!reportTouched) {
      setReportDraft(buildReportDraft(reportInput));
    }
  }, [reportInput, reportTouched]);

  const loadPracticeData = () => {
    setRows(sampleEnergyUsageRows);
    setDataSource('수업 연습용 예시 데이터');
    setDataMessage(practiceDataNotice);
    setPeakConfirmed(false);
    scrollToId('data-lab');
  };

  const handleRowsParsed = (nextRows: EnergyUsageRow[], sourceLabel: string) => {
    setRows(nextRows);
    setDataSource(sourceLabel);
    setPeakConfirmed(false);
    if (nextRows.length === 0) {
      setDataMessage(`${sourceLabel}에서 유효한 전력사용량 행을 찾지 못했습니다. usage_kWh 값을 확인해 주세요.`);
      return;
    }
    setDataMessage(`${sourceLabel} 데이터를 불러왔습니다. 유효 행 ${nextRows.length}개를 사용합니다.`);
  };

  const handleSaveState = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        rows,
        dataSource,
        scenario,
        assumptions,
        teamName,
        cityName,
        keyStrategies,
        reportDraft
      })
    );
    setSaveMessage('현재 설계와 보고서를 이 브라우저에 저장했습니다.');
  };

  const handleScenarioChange = (nextScenario: EnergyScenario) => {
    setScenario(nextScenario);
    setDesignChanged(true);
  };

  const handleReportDraftChange = (value: string) => {
    setReportTouched(true);
    setReportDraft(value);
  };

  return (
    <div className="app-shell">
      <Header rowCount={rows.length} selfSufficiencyRate={result.selfSufficiencyRate} dataSource={dataSource} />
      <main>
        <StartSection
          onStart={() => scrollToId('data-lab')}
          onLoadPractice={loadPracticeData}
          onUploadClick={() => {
            scrollToId('data-lab');
            window.setTimeout(() => uploadInputRef.current?.click(), 250);
          }}
        />

        <section className="notice-band" aria-label="데이터 진실성 안내">
          <strong>중요 안내</strong>
          <span>
            이 앱은 중1 수업용 비교 도구입니다. 샘플 데이터와 교사용 기본값은 실제 공공데이터나 공식값이 아닙니다.
          </span>
        </section>

        <MissionMap steps={missionSteps} activeIndex={activeMissionIndex} onSelect={scrollToId} />

        <DataUploadSection
          rows={rows}
          summary={summary}
          dataSource={dataSource}
          uploadInputRef={uploadInputRef}
          dataMessage={dataMessage}
          onRowsParsed={handleRowsParsed}
          onLoadPractice={loadPracticeData}
        />

        <EnergyChart summary={summary} peakConfirmed={peakConfirmed} onPeakConfirmed={() => setPeakConfirmed(true)} />

        <EnergySourceCards cards={energySourceCards} onCardCompared={() => setCardsCompared(true)} />

        <DesignLabSection
          scenario={scenario}
          assumptions={assumptions}
          result={result}
          onScenarioChange={handleScenarioChange}
        />

        <TeacherSettingsPanel assumptions={assumptions} onAssumptionsChange={setAssumptions} />

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
          onTeamNameChange={setTeamName}
          onCityNameChange={setCityName}
          onKeyStrategiesChange={setKeyStrategies}
          onReportDraftChange={handleReportDraftChange}
          onSaveState={handleSaveState}
        />
      </main>
    </div>
  );
}
