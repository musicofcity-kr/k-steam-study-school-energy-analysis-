export type EnergyUsageRow = {
  date?: string;
  hour: number;
  region?: string;
  usageKWh: number;
};

export type EnergyScenario = {
  solarLevel: number;
  essLevel: number;
  hydrogenFuelCellLevel: number;
  savingRate: number;
  smartControlLevel: number;
};

export type TeacherAssumptions = {
  solarMaxKWhPerActiveHour: number;
  hydrogenMaxKWhPerHour: number;
  essMaxCapacityKWh: number;
  essMaxChargeKWhPerHour: number;
  essMaxDischargeKWhPerHour: number;
  essRoundTripEfficiency: number;
  savingMaxRate: number;
  smartControlMaxPeakSavingRate: number;
  gridEmissionFactor: number;
  solarActiveStartHour: number;
  solarActiveEndHour: number;
  hydrogenSource: 'green' | 'mixed' | 'unspecified';
};

export type EnergyRole = 'generation' | 'storage' | 'saving' | 'management' | 'external-supply';

export type PlacementScope = 'onsite' | 'district-conditional' | 'external-grid';

export type EnergyTechnology = {
  id: string;
  name: string;
  role: EnergyRole;
  placement: PlacementScope;
  simplePrinciple: string;
  processSteps: string[];
  requiredConditions: string[];
  difficultNearSchoolReasons: string[];
  futureSchoolRole: string;
  strengths: string[];
  limits: string[];
  misconceptionWarning?: string;
};

export type TechnologyPlacementDecision = {
  technologyId: string;
  placement: PlacementScope;
  reason: string;
};

export type DataProvenance = 'practice-assumption' | 'teacher-prepared-public-data' | 'unknown-upload';

export type DataProvenanceDetails = {
  provider: string;
  datasetName: string;
  referenceDate: string;
  regionUnit: string;
  scope: 'school' | 'regional-proxy' | 'unknown';
};

export type ColumnMapping = {
  date?: string;
  hour?: string;
  region?: string;
  usageKWh?: string;
};

export type CsvIssueCode =
  | 'EMPTY_CSV'
  | 'MISSING_HOUR_COLUMN'
  | 'MISSING_USAGE_COLUMN'
  | 'INVALID_ROWS'
  | 'PARSER_ERROR';

export type CsvParseIssue = {
  code: CsvIssueCode;
  message: string;
  rowNumber?: number;
};

export type CsvParseResult = {
  rows: EnergyUsageRow[];
  columns: string[];
  mapping: ColumnMapping;
  errors: CsvParseIssue[];
  warnings: CsvParseIssue[];
  skippedRowCount: number;
};

export type UsageSummary = {
  totalUsageKWh: number;
  averageUsageKWh: number;
  peakHour: number | null;
  peakUsageKWh: number;
  lowestHour: number | null;
  lowestUsageKWh: number;
  rowCount: number;
  dayCount: number;
  byHourMode: 'sum' | 'average';
  regionLabel: string;
  byHour: Array<{ hour: number; usageKWh: number }>;
};

export type HourlyEnergyBalance = {
  date?: string;
  hour: number;
  demandKWh: number;
  reducedDemandKWh: number;
  solarGeneratedKWh: number;
  hydrogenGeneratedKWh: number;
  directLocalUseKWh: number;
  essChargeKWh: number;
  essDischargeKWh: number;
  essStateOfChargeKWh: number;
  gridImportKWh: number;
  surplusKWh: number;
};

export type ScenarioResult = {
  summary: UsageSummary;
  reducedUsageKWh: number;
  hourlyBalance: HourlyEnergyBalance[];
  localSupplyRate: number;
  supplyKWh: number;
  gridImportKWh: number;
  surplusKWh: number;
  nightGridDependent: boolean;
  peakGridImportKWh: number;
  sourceBreakdown: {
    solarGeneratedKWh: number;
    hydrogenGeneratedKWh: number;
    directLocalUseKWh: number;
    essChargeKWh: number;
    essDischargeKWh: number;
    essEndStateOfChargeKWh: number;
  };
  isSurplus: boolean;
  stabilityScore: number;
  diversityScore: number;
  environmentalScore: number;
  realismScore: number;
  estimatedAvoidedEmissionKg: number;
  studentWarnings: string[];
};

export type EnergySourceCard = {
  id: string;
  name: string;
  shortDescription: string;
  strengths: string[];
  limits: string[];
  role: string;
  studentTerm: string;
};

export type ReportInput = {
  teamName: string;
  cityName: string;
  dataSource: string;
  dataProvenance: DataProvenance;
  provenanceDetails: DataProvenanceDetails;
  placementDecisions: TechnologyPlacementDecision[];
  peakReason: string;
  scenario: EnergyScenario;
  result: ScenarioResult;
  keyStrategies: string[];
};

export type ReportJson = ReportInput & {
  createdAt: string;
};

export type SavedEnergyStateV2 = {
  version: 2;
  scenario: EnergyScenario;
  assumptions: TeacherAssumptions;
};
