import { RECORD_DECIMALS, GRIP_DECIMALS } from '../config.js';

export const EVENTS = [
  {
    key: 'sprint',
    label: '55M 직선 스프린트',
    short: '직선 스프린트',
    en: 'STRAIGHT SPRINT',
    route: 'HOME → 1ST BASE → OUTFIELD',
    routeKo: '홈 → 1루 → 외야 (직선 거리 55M)',
  },
  {
    key: 'baserun',
    label: '55M 베이스러닝',
    short: '베이스러닝',
    en: 'BASERUNNING',
    route: 'HOME → 1ST BASE → 2ND BASE',
    routeKo: '홈 → 1루 → 2루 (베이스러닝 거리 55M)',
  },
];

// 선수 기록 탭·선수 상세에 공개하는 종목 (55M 직선 스프린트만 공개)
export const RECORD_EVENTS = EVENTS.filter((e) => e.key === 'sprint');

// 기록이 없으면 '—' (0.00 등으로 대체하지 않음)
export function formatTime(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(RECORD_DECIMALS) : '—';
}

export function formatGrip(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(GRIP_DECIMALS) : '—';
}

// 현재 목록에 악력 기록이 하나라도 있으면 악력 열을 보여준다
export const hasGrip = (players) => players.some((p) => typeof p.records?.grip === 'number');

// 종목별 1인 1회 측정 → 종목당 기록 1개
export function recordValue(player, eventKey) {
  const v = player.records?.[eventKey];
  return typeof v === 'number' ? v : null;
}

// 정렬용 값: 선택 종목 기록 중 가장 빠른 값 (공식 순위 아님)
export function sortValue(player, eventKeys) {
  let best = null;
  for (const e of eventKeys) {
    const v = recordValue(player, e);
    if (v != null && (best == null || v < best)) best = v;
  }
  return best;
}

export function hasEvent(player, eventKey) {
  return recordValue(player, eventKey) != null;
}

export function filterPlayers(players, { q, province, position, event, school }, schoolsById) {
  const needle = (q ?? '').trim().toLowerCase();
  return players.filter((p) => {
    const s = schoolsById[p.schoolId];
    if (needle && !p.name.toLowerCase().includes(needle) && !s.name.toLowerCase().includes(needle)) return false;
    if (province && s.province !== province) return false;
    if (school && p.schoolId !== school) return false;
    if (position && p.position !== position) return false;
    if (event && !hasEvent(p, event)) return false;
    return true;
  });
}

const byName = (a, b) => a.name.localeCompare(b.name, 'ko');

export function sortPlayers(list, sort, eventKeys, schoolsById) {
  const out = [...list];
  if (sort === 'name') return out.sort(byName);
  if (sort === 'school') {
    // 학교 이름순, 같은 학교 안에서는 교내 순위(55M 기준)순
    return out.sort(
      (a, b) =>
        schoolsById[a.schoolId].name.localeCompare(schoolsById[b.schoolId].name, 'ko') ||
        (a.schoolRank ?? 99) - (b.schoolRank ?? 99) ||
        byName(a, b),
    );
  }
  const dir = sort === 'slowest' ? -1 : 1;
  return out.sort((a, b) => {
    const va = sortValue(a, eventKeys);
    const vb = sortValue(b, eventKeys);
    // 기록 없는 선수는 항상 뒤로
    if (va == null && vb == null) return byName(a, b);
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va - vb) * dir || byName(a, b);
  });
}

export function formatDate(iso, withTime = false) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Seoul' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit', hour12: false });
  return new Intl.DateTimeFormat('ko-KR', opts).format(d);
}
