import type { EnergyScenario, TeacherAssumptions } from '../types';

function finiteNumberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function restoreEnergyScenario(value: unknown, defaults: EnergyScenario): EnergyScenario {
  const source = typeof value === 'object' && value !== null ? (value as Partial<EnergyScenario>) : {};
  return {
    solarLevel: finiteNumberOrDefault(source.solarLevel, defaults.solarLevel),
    essLevel: finiteNumberOrDefault(source.essLevel, defaults.essLevel),
    hydrogenLevel: finiteNumberOrDefault(source.hydrogenLevel, defaults.hydrogenLevel),
    nuclearLevel: finiteNumberOrDefault(source.nuclearLevel, defaults.nuclearLevel),
    savingRate: finiteNumberOrDefault(source.savingRate, defaults.savingRate)
  };
}

export function restoreTeacherAssumptions(value: unknown, defaults: TeacherAssumptions): TeacherAssumptions {
  const source = typeof value === 'object' && value !== null ? (value as Partial<TeacherAssumptions>) : {};
  return {
    solarMaxKWhPerHour: finiteNumberOrDefault(source.solarMaxKWhPerHour, defaults.solarMaxKWhPerHour),
    hydrogenMaxKWhPerHour: finiteNumberOrDefault(source.hydrogenMaxKWhPerHour, defaults.hydrogenMaxKWhPerHour),
    nuclearMaxKWhPerHour: finiteNumberOrDefault(source.nuclearMaxKWhPerHour, defaults.nuclearMaxKWhPerHour),
    savingMaxRate: finiteNumberOrDefault(source.savingMaxRate, defaults.savingMaxRate),
    gridEmissionFactor: finiteNumberOrDefault(source.gridEmissionFactor, defaults.gridEmissionFactor)
  };
}
