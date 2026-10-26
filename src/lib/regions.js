// 지도 시·도 key → 표시명
export const PROVINCES = {
  seoul: { label: '서울', full: '서울특별시' },
  busan: { label: '부산', full: '부산광역시' },
  daegu: { label: '대구', full: '대구광역시' },
  incheon: { label: '인천', full: '인천광역시' },
  gwangju: { label: '광주', full: '광주광역시' },
  daejeon: { label: '대전', full: '대전광역시' },
  ulsan: { label: '울산', full: '울산광역시' },
  sejong: { label: '세종', full: '세종특별자치시' },
  gyeonggi: { label: '경기도', full: '경기도' },
  gangwon: { label: '강원도', full: '강원도' },
  chungbuk: { label: '충청북도', full: '충청북도' },
  chungnam: { label: '충청남도', full: '충청남도' },
  jeonbuk: { label: '전라북도', full: '전라북도' },
  jeonnam: { label: '전남', full: '전라남도' },
  gyeongbuk: { label: '경상북도', full: '경상북도' },
  gyeongnam: { label: '경상남도', full: '경상남도' },
  jeju: { label: '제주', full: '제주특별자치도' },
};

export function provinceLabel(key) {
  return PROVINCES[key]?.label ?? key;
}

// 시·도별 참가 학교 수 (학교 데이터에서 자동 집계)
export function countByProvince(schools) {
  const out = {};
  for (const s of schools) out[s.province] = (out[s.province] ?? 0) + 1;
  return out;
}

// 학교의 지역 표기: 시 단위 지역은 "경기도 > 수원" 형태
export function schoolRegionLabel(school) {
  if (!school) return '—';
  if (school.city) return `${provinceLabel(school.province)} › ${school.city}`;
  return school.region;
}
