import { describe, expect, it } from 'vitest';
import {
  restoreDataProvenanceDetails,
  restoreEnergyScenario,
  restoreSavedEnergyState,
  restoreTeacherAssumptions
} from '../src/utils/stateRestore';
import type { DataProvenanceDetails, EnergyScenario, TeacherAssumptions } from '../src/types';

const scenarioDefaults: EnergyScenario = {
  solarLevel: 45,
  essLevel: 40,
  hydrogenFuelCellLevel: 20,
  savingRate: 15,
  smartControlLevel: 30
};

const assumptionDefaults: TeacherAssumptions = {
  solarMaxKWhPerActiveHour: 50,
  hydrogenMaxKWhPerHour: 37.5,
  essMaxCapacityKWh: 120,
  essMaxChargeKWhPerHour: 30,
  essMaxDischargeKWhPerHour: 30,
  essRoundTripEfficiency: 0.85,
  savingMaxRate: 50,
  smartControlMaxPeakSavingRate: 20,
  gridEmissionFactor: 0.45,
  solarActiveStartHour: 7,
  solarActiveEndHour: 18,
  hydrogenSource: 'unspecified'
};

const provenanceDefaults: DataProvenanceDetails = {
  provider: '',
  datasetName: '',
  referenceDate: '',
  regionUnit: '',
  scope: 'unknown'
};

describe('state restore helpers', () => {
  it('restores valid provenance details without changing their values', () => {
    expect(
      restoreDataProvenanceDetails(
        {
          provider: '서울 열린데이터광장',
          datasetName: '시간대별 전력 사용량',
          referenceDate: '2026-07-01',
          regionUnit: '서울특별시',
          scope: 'regional-proxy'
        },
        provenanceDefaults
      )
    ).toEqual({
      provider: '서울 열린데이터광장',
      datasetName: '시간대별 전력 사용량',
      referenceDate: '2026-07-01',
      regionUnit: '서울특별시',
      scope: 'regional-proxy'
    });
  });

  it('replaces malformed provenance strings and scope with field defaults', () => {
    expect(
      restoreDataProvenanceDetails(
        {
          provider: 123,
          datasetName: { text: '잘못된 객체' },
          referenceDate: ['2026-07-01'],
          regionUnit: false,
          scope: 'school-wide'
        },
        provenanceDefaults
      )
    ).toEqual(provenanceDefaults);
  });

  it.each([null, undefined, 42, 'invalid', true, []])(
    'falls back safely when provenance details root is %p',
    (value) => {
      expect(restoreDataProvenanceDetails(value, provenanceDefaults)).toEqual(provenanceDefaults);
    }
  );

  it('preserves valid provenance fields while defaulting only damaged fields', () => {
    expect(
      restoreDataProvenanceDetails(
        {
          provider: '공공데이터포털',
          datasetName: 99,
          referenceDate: '2026-06-30',
          regionUnit: null,
          scope: 'school'
        },
        provenanceDefaults
      )
    ).toEqual({
      provider: '공공데이터포털',
      datasetName: '',
      referenceDate: '2026-06-30',
      regionUnit: '',
      scope: 'school'
    });
  });

  it('keeps in-range scenario fields and replaces invalid values with defaults', () => {
    expect(
      restoreEnergyScenario(
        {
          solarLevel: 80,
          essLevel: Number.NaN,
          hydrogenFuelCellLevel: 'bad',
          savingRate: Number.POSITIVE_INFINITY,
          smartControlLevel: -1
        },
        scenarioDefaults
      )
    ).toEqual({
      solarLevel: 80,
      essLevel: 40,
      hydrogenFuelCellLevel: 20,
      savingRate: 15,
      smartControlLevel: 30
    });
  });

  it('migrates v1 hydrogenLevel, ignores nuclearLevel, and creates the smart-control default', () => {
    expect(
      restoreEnergyScenario(
        {
          solarLevel: 60,
          essLevel: 50,
          hydrogenLevel: 65,
          nuclearLevel: 100,
          savingRate: 25
        },
        scenarioDefaults
      )
    ).toEqual({
      solarLevel: 60,
      essLevel: 50,
      hydrogenFuelCellLevel: 65,
      savingRate: 25,
      smartControlLevel: 30
    });
  });

  it('rejects finite scenario values outside the 0 to 100 range', () => {
    expect(
      restoreEnergyScenario(
        {
          solarLevel: 101,
          essLevel: -1,
          hydrogenFuelCellLevel: 120,
          savingRate: -5,
          smartControlLevel: 101
        },
        scenarioDefaults
      )
    ).toEqual(scenarioDefaults);
  });

  it('ignores old total-kWh assumption fields and restores new defaults', () => {
    expect(
      restoreTeacherAssumptions(
        {
          solarMaxKWh: 1200,
          hydrogenMaxKWh: 900,
          nuclearMaxKWh: 1100,
          savingMaxRate: 40,
          gridEmissionFactor: 0.4
        },
        assumptionDefaults
      )
    ).toEqual({
      ...assumptionDefaults,
      savingMaxRate: 40,
      gridEmissionFactor: 0.4
    });
  });

  it('restores the complete teacher-assumption contract', () => {
    expect(
      restoreTeacherAssumptions(
        {
          solarMaxKWhPerActiveHour: 60,
          hydrogenMaxKWhPerHour: 45,
          essMaxCapacityKWh: 150,
          essMaxChargeKWhPerHour: 40,
          essMaxDischargeKWhPerHour: 35,
          essRoundTripEfficiency: 0.9,
          savingMaxRate: 45,
          smartControlMaxPeakSavingRate: 25,
          gridEmissionFactor: 0.35,
          solarActiveStartHour: 8,
          solarActiveEndHour: 17,
          hydrogenSource: 'green'
        },
        assumptionDefaults
      )
    ).toEqual({
      solarMaxKWhPerActiveHour: 60,
      hydrogenMaxKWhPerHour: 45,
      essMaxCapacityKWh: 150,
      essMaxChargeKWhPerHour: 40,
      essMaxDischargeKWhPerHour: 35,
      essRoundTripEfficiency: 0.9,
      savingMaxRate: 45,
      smartControlMaxPeakSavingRate: 25,
      gridEmissionFactor: 0.35,
      solarActiveStartHour: 8,
      solarActiveEndHour: 17,
      hydrogenSource: 'green'
    });
  });

  it('replaces out-of-range assumptions and invalid hydrogen source with defaults', () => {
    expect(
      restoreTeacherAssumptions(
        {
          solarMaxKWhPerActiveHour: -1,
          hydrogenMaxKWhPerHour: -1,
          essMaxCapacityKWh: -1,
          essMaxChargeKWhPerHour: -1,
          essMaxDischargeKWhPerHour: -1,
          essRoundTripEfficiency: 1.1,
          savingMaxRate: 101,
          smartControlMaxPeakSavingRate: -1,
          gridEmissionFactor: -0.1,
          solarActiveStartHour: -1,
          solarActiveEndHour: 24,
          hydrogenSource: 'unknown'
        },
        assumptionDefaults
      )
    ).toEqual(assumptionDefaults);
  });

  it('falls back to a valid default solar interval when restored start is after end', () => {
    expect(
      restoreTeacherAssumptions(
        {
          solarActiveStartHour: 19,
          solarActiveEndHour: 6
        },
        assumptionDefaults
      )
    ).toMatchObject({
      solarActiveStartHour: 7,
      solarActiveEndHour: 18
    });
  });

  it('restores a version 2 saved energy state through the core helper', () => {
    const restored = restoreSavedEnergyState(
      {
        version: 2,
        scenario: {
          solarLevel: 70,
          essLevel: 60,
          hydrogenFuelCellLevel: 50,
          savingRate: 20,
          smartControlLevel: 40
        },
        assumptions: {
          ...assumptionDefaults,
          essMaxCapacityKWh: 180,
          hydrogenSource: 'mixed'
        }
      },
      { scenario: scenarioDefaults, assumptions: assumptionDefaults }
    );

    expect(restored.version).toBe(2);
    expect(restored.scenario).toMatchObject({ hydrogenFuelCellLevel: 50, smartControlLevel: 40 });
    expect(restored.assumptions).toMatchObject({ essMaxCapacityKWh: 180, hydrogenSource: 'mixed' });
  });

  it.each([null, undefined, 42, 'invalid', true, []])(
    'restores scenario and assumptions defaults for malformed root %p',
    (value) => {
      expect(restoreEnergyScenario(value, scenarioDefaults)).toEqual(scenarioDefaults);
      expect(restoreTeacherAssumptions(value, assumptionDefaults)).toEqual(assumptionDefaults);
      expect(restoreSavedEnergyState(value, { scenario: scenarioDefaults, assumptions: assumptionDefaults })).toEqual({
        version: 2,
        scenario: scenarioDefaults,
        assumptions: assumptionDefaults
      });
    }
  );
});
