export const gaewonTemplatePath = '/sample-data/gaewon_energy_usage_upload_template.csv';

export const gaewonSchoolContext = {
  schoolName: '개원중학교',
  englishName: 'Gaewon Middle School',
  schoolLevel: '중학교',
  schoolCode: '7091420',
  educationOfficeCode: 'B10',
  address: '서울특별시 강남구 영동대로 101',
  district: '강남구',
  localPowerRegion: '개포동',
  studentCount: 966,
  teacherCount: 65,
  homepage: 'https://gaewon.sen.ms.kr/',
  proxyUsageMethod: '개포동 시간별 전력자료를 학교 주변 대체 지표로 사용',
  limitNotice: '학교 자체 전력량이 아닙니다. 개원중학교 주변 법정동인 개포동 자료를 대체 지표로 사용합니다.',
  sourceUrls: {
    schoolInfo: 'https://www.schoolinfo.go.kr/ei/ss/Pneiss_b01_s0.do?SHL_IDF_CD=4541fc38-2561-4cf0-9af7-8fd191a29911',
    seoulMiddleSchoolInfo: 'https://data.seoul.go.kr/dataList/OA-20556/S/1/datasetView.do',
    seoulPowerUsage: 'https://data.seoul.go.kr/dataList/OA-22835/F/1/datasetView.do'
  }
} as const;

export const gaewonPowerUsageSource = {
  datasetName: '서울특별시 법정동별시간별전력사용량',
  packReferenceFile: 'gaewon_local_filter.csv',
  collectionPlanFile: 'gaewon_public_data_collection_plan.csv',
  filterField: '법정동/동명',
  filterValue: '개포동',
  sourceUrl: gaewonSchoolContext.sourceUrls.seoulPowerUsage,
  standardColumns: ['date', 'hour', 'region', 'usage_kWh'],
  actualValuesIncludedInPack: false,
  preprocessingNote: '원본에서 개포동 행만 추출하고 date,hour,region,usage_kWh 형식으로 변환합니다.',
  caution:
    '팩에는 빈 업로드 템플릿만 있고 실제 학교 전력값은 포함되어 있지 않습니다. 학교 자체 전력량이 아닙니다. 개포동 법정동 자료를 대체 지표로 사용하며 실제 usage_kWh 값을 임의로 만들지 않습니다.'
} as const;
