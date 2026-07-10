import type { DataProvenanceDetails, EnergyScenario, SavedEnergyStateV2, TeacherAssumptions } from '../types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function numberInRangeOrDefault(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function nonNegativeNumberOrDefault(value: unknown, fallback: number): number {
  return numberInRangeOrDefault(value, fallback, 0, Number.MAX_VALUE);
}

function hasOwn(source: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function restoreProvenanceScope(value: unknown, fallback: DataProvenanceDetails['scope']) {
  return value === 'school' || value === 'regional-proxy' || value === 'unknown' ? value : fallback;
}

function restoreHydrogenSource(value: unknown, fallback: TeacherAssumptions['hydrogenSource']) {
  return value === 'green' || value === 'mixed' || value === 'unspecified' ? value : fallback;
}

export function restoreDataProvenanceDetails(
  value: unknown,
  defaults: DataProvenanceDetails
): DataProvenanceDetails {
  const source = asRecord(value);

  return {
    provider: stringOrDefault(source.provider, defaults.provider),
    datasetName: stringOrDefault(source.datasetName, defaults.datasetName),
    referenceDate: stringOrDefault(source.referenceDate, defaults.referenceDate),
    regionUnit: stringOrDefault(source.regionUnit, defaults.regionUnit),
    scope: restoreProvenanceScope(source.scope, defaults.scope)
  };
}

export function restoreEnergyScenario(value: unknown, defaults: EnergyScenario): EnergyScenario {
  const source = asRecord(value);
  const hydrogenValue = hasOwn(source, 'hydrogenFuelCellLevel')
    ? source.hydrogenFuelCellLevel
    : source.hydrogenLevel;

  return {
    solarLevel: numberInRangeOrDefault(source.solarLevel, defaults.solarLevel, 0, 100),
    essLevel: numberInRangeOrDefault(source.essLevel, defaults.essLevel, 0, 100),
    hydrogenFuelCellLevel: numberInRangeOrDefault(hydrogenValue, defaults.hydrogenFuelCellLevel, 0, 100),
    savingRate: numberInRangeOrDefault(source.savingRate, defaults.savingRate, 0, 100),
    smartControlLevel: numberInRangeOrDefault(source.smartControlLevel, defaults.smartControlLevel, 0, 100)
  };
}

export function restoreTeacherAssumptions(value: unknown, defaults: TeacherAssumptions): TeacherAssumptions {
  const source = asRecord(value);
  const solarPerActiveHourValue = hasOwn(source, 'solarMaxKWhPerActiveHour')
    ? source.solarMaxKWhPerActiveHour
    : source.solarMaxKWhPerHour;
  let solarActiveStartHour = numberInRangeOrDefault(
    source.solarActiveStartHour,
    defaults.solarActiveStartHour,
    0,
    23
  );
  let solarActiveEndHour = numberInRangeOrDefault(source.solarActiveEndHour, defaults.solarActiveEndHour, 0, 23);

  if (solarActiveStartHour > solarActiveEndHour) {
    solarActiveStartHour = defaults.solarActiveStartHour;
    solarActiveEndHour = defaults.solarActiveEndHour;
  }

  return {
    solarMaxKWhPerActiveHour: nonNegativeNumberOrDefault(
      solarPerActiveHourValue,
      defaults.solarMaxKWhPerActiveHour
    ),
    hydrogenMaxKWhPerHour: nonNegativeNumberOrDefault(
      source.hydrogenMaxKWhPerHour,
      defaults.hydrogenMaxKWhPerHour
    ),
    essMaxCapacityKWh: nonNegativeNumberOrDefault(source.essMaxCapacityKWh, defaults.essMaxCapacityKWh),
    essMaxChargeKWhPerHour: nonNegativeNumberOrDefault(
      source.essMaxChargeKWhPerHour,
      defaults.essMaxChargeKWhPerHour
    ),
    essMaxDischargeKWhPerHour: nonNegativeNumberOrDefault(
      source.essMaxDischargeKWhPerHour,
      defaults.essMaxDischargeKWhPerHour
    ),
    essRoundTripEfficiency: numberInRangeOrDefault(
      source.essRoundTripEfficiency,
      defaults.essRoundTripEfficiency,
      0,
      1
    ),
    savingMaxRate: numberInRangeOrDefault(source.savingMaxRate, defaults.savingMaxRate, 0, 100),
    smartControlMaxPeakSavingRate: numberInRangeOrDefault(
      source.smartControlMaxPeakSavingRate,
      defaults.smartControlMaxPeakSavingRate,
      0,
      100
    ),
    gridEmissionFactor: nonNegativeNumberOrDefault(source.gridEmissionFactor, defaults.gridEmissionFactor),
    solarActiveStartHour,
    solarActiveEndHour,
    hydrogenSource: restoreHydrogenSource(source.hydrogenSource, defaults.hydrogenSource)
  };
}

export function restoreSavedEnergyState(
  value: unknown,
  defaults: { scenario: EnergyScenario; assumptions: TeacherAssumptions }
): SavedEnergyStateV2 {
  const source = asRecord(value);

  return {
    version: 2,
    scenario: restoreEnergyScenario(source.scenario, defaults.scenario),
    assumptions: restoreTeacherAssumptions(source.assumptions, defaults.assumptions)
  };
}
