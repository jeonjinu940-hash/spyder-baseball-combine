import { RECORD_DECIMALS } from '../config.js';

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

export const TRIALS = [1, 2];

// 기록이 없으면 '—' (0.00 등으로 대체하지 않음)
export function formatTime(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(RECORD_DECIMALS) : '—';
}

export function trialValue(player, eventKey, trial) {
  const v = player.records?.[eventKey]?.[trial - 1];
  return typeof v === 'number' ? v : null;
}

// 정렬용 값: 선택 종목의 측정값 중 가장 빠른 값 (공식 대표 기록·순위 아님)
export function sortValue(player, eventKeys) {
  let best = null;
  for (const e of eventKeys) {
    for (const t of TRIALS) {
      const v = trialValue(player, e, t);
      if (v != null && (best == null || v < best)) best = v;
    }
  }
  return best;
}

export function hasEvent(player, eventKey) {
  return TRIALS.some((t) => trialValue(player, eventKey, t) != null);
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
    return out.sort((a, b) => schoolsById[a.schoolId].name.localeCompare(schoolsById[b.schoolId].name, 'ko') || byName(a, b));
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
