import { describe, expect, it } from 'vitest';
import { restoreEnergyScenario, restoreTeacherAssumptions } from '../src/utils/stateRestore';
import type { EnergyScenario, TeacherAssumptions } from '../src/types';

const scenarioDefaults: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenLevel: 20,
  nuclearLevel: 0,
  savingRate: 15
};

const assumptionDefaults: TeacherAssumptions = {
  solarMaxKWhPerHour: 50,
  hydrogenMaxKWhPerHour: 37.5,
  nuclearMaxKWhPerHour: 45.8,
  savingMaxRate: 50,
  gridEmissionFactor: 0.45
};

describe('state restore helpers', () => {
  it('keeps finite numeric scenario fields and replaces invalid values with defaults', () => {
    expect(
      restoreEnergyScenario(
        {
          solarLevel: 80,
          essLevel: Number.NaN,
          hydrogenLevel: 'bad',
          nuclearLevel: 10,
          savingRate: Number.POSITIVE_INFINITY
        },
        scenarioDefaults
      )
    ).toEqual({
      solarLevel: 80,
      essLevel: 40,
      hydrogenLevel: 20,
      nuclearLevel: 10,
      savingRate: 15
    });
  });

  it('ignores old total-kWh assumption fields and restores hourly defaults', () => {
    expect(
      restoreTeacherAssumptions(
        {
          solarMaxKWh: 1200,
          hydrogenMaxKWh: 900,
          nuclearMaxKWh: 1100,
          savingMaxRate: 70,
          gridEmissionFactor: 0.4
        },
        assumptionDefaults
      )
    ).toEqual({
      solarMaxKWhPerHour: 50,
      hydrogenMaxKWhPerHour: 37.5,
      nuclearMaxKWhPerHour: 45.8,
      savingMaxRate: 70,
      gridEmissionFactor: 0.4
    });
  });
});
