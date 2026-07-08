export type EnergyUsageRow = {
  date?: string;
  hour: number;
  region?: string;
  usageKWh: number;
};

export type EnergyScenario = {
  solarLevel: number;
  essLevel: number;
  hydrogenLevel: number;
  nuclearLevel: number;
  savingRate: number;
};

export type TeacherAssumptions = {
  solarMaxKWh: number;
  hydrogenMaxKWh: number;
  nuclearMaxKWh: number;
  savingMaxRate: number;
  gridEmissionFactor: number;
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
  regionLabel: string;
  byHour: Array<{ hour: number; usageKWh: number }>;
};

export type ScenarioResult = {
  summary: UsageSummary;
  reducedUsageKWh: number;
  supplyKWh: number;
  sourceBreakdown: {
    solarKWh: number;
    hydrogenKWh: number;
    nuclearKWh: number;
    essKWh: number;
  };
  selfSufficiencyRate: number;
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
  scenario: EnergyScenario;
  result: ScenarioResult;
  keyStrategies: string[];
};

export type ReportJson = ReportInput & {
  createdAt: string;
};
