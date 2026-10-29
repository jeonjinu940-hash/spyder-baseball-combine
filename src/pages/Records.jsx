import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { RECORD_EVENTS, filterPlayers, formatDate, formatGrip, formatTime, sortPlayers, recordValue } from '../lib/records.js';
import { provinceLabel } from '../lib/regions.js';
import { GRIP_UNIT, RECORD_UNIT } from '../config.js';
import SearchBar from '../components/SearchBar.jsx';
import RecordList from '../components/RecordList.jsx';
import EmptyState from '../components/EmptyState.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';
import PageBanner from '../components/PageBanner.jsx';

const PAGE = 30;
const SORTS = [
  { key: 'fastest', label: '빠른 기록순' },
  { key: 'slowest', label: '느린 기록순' },
  { key: 'name', label: '이름순' },
  { key: 'school', label: '학교순 (교내 순위)' },
];

// 가장 최근에 측정한 학교의 상위 선수 (교내 순위순)
function LatestRecords({ players, schoolsById }) {
  const latestDate = players.reduce((max, p) => ((p.measuredAt ?? '') > max ? p.measuredAt : max), '');
  const latest = players
    .filter((p) => p.measuredAt === latestDate)
    .sort((a, b) => a.schoolId.localeCompare(b.schoolId) || (a.schoolRank ?? 99) - (b.schoolRank ?? 99))
    .slice(0, 6);
  if (!latest.length) return null;
  const latestSchools = [...new Set(latest.map((p) => schoolsById[p.schoolId].name))].join(' · ');
  return (
    <section className="container" aria-labelledby="latest-title" style={{ marginBottom: 48 }}>
      <div className="section-head" style={{ marginBottom: 20 }}>
        <div>
          <p className="eyebrow">Latest Records</p>
          <h2 id="latest-title" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>최신 업데이트 기록</h2>
          <p className="muted mt-16">
            {latestSchools}
            {latestDate ? ` · ${formatDate(latestDate)} 측정` : ''}
          </p>
        </div>
        <UpdatedAt />
      </div>
      <div className="grid-3">
        {latest.map((p) => {
          const grip = recordValue(p, 'grip');
          return (
            <Link key={p.id} to={`/players/${encodeURIComponent(p.id)}`} className="feat-card glass">
              <div className="nm">
                {p.schoolRank && <span className="rank-badge num">{p.schoolRank}위</span>}
                {p.name}
              </div>
              <div className="sc">
                {schoolsById[p.schoolId].name}
                {p.grade ? ` · ${p.grade}학년` : ''}
                {p.position ? ` · ${p.position}` : ''}
              </div>
              <div className="vals">
                {RECORD_EVENTS.map((e) => (
                  <div key={e.key}>
                    <small>{e.label} ({RECORD_UNIT})</small>
                    <b>{formatTime(recordValue(p, e.key))}</b>
                  </div>
                ))}
                {grip != null && (
                  <div>
                    <small>악력 ({GRIP_UNIT})</small>
                    <b>{formatGrip(grip)}</b>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Chip({ pressed, onClick, children }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}

export default function Records() {
  const { players, schools, schoolsById } = useData();
  const [params, setParams] = useSearchParams();
  const [limit, setLimit] = useState(PAGE);

  const q = params.get('q') ?? '';
  const province = params.get('region') ?? '';
  const position = params.get('position') ?? '';
  const school = params.get('school') ?? '';
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'fastest';

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === 'region') next.delete('school');
    setParams(next, { replace: true });
  };

  useEffect(() => setLimit(PAGE), [q, province, position, school, sort]);

  const provinces = useMemo(() => [...new Set(schools.map((s) => s.province))], [schools]);
  const positions = useMemo(() => [...new Set(players.map((p) => p.position).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')), [players]);
  const schoolOptions = useMemo(
    () => schools.filter((s) => !province || s.province === province).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [schools, province],
  );

  const results = useMemo(() => {
    const filtered = filterPlayers(players, { q, province, position, school }, schoolsById);
    return sortPlayers(filtered, sort, RECORD_EVENTS.map((e) => e.key), schoolsById);
  }, [players, q, province, position, school, sort, schoolsById]);

  const activeFilters = Boolean(q || province || position || school);

  return (
    <>
      <PageBanner title="선수 기록">55M 직선 스프린트 기록 | 이름 검색과 지역·학교·포지션 필터를 함께 사용할 수 있습니다.</PageBanner>
      <section className="container" style={{ marginBottom: 40 }}>
        <div className="notice notice-strong" role="note">
          <span className="i" aria-hidden="true">!</span>
          <span>
            <strong>학교별 상위 5명의 기록만 공개됩니다.</strong>
            <span className="muted"> (55M 직선 스프린트 기록 기준)</span>
          </span>
        </div>
      </section>

      <LatestRecords players={players} schoolsById={schoolsById} />

      <section className="container" aria-label="전체 선수 기록">
        <SearchBar id="records-search" value={q} onChange={(v) => update('q', v)} />

        <div className="filters glass mt-16" role="group" aria-label="기록 필터">
          <div className="filter-row">
            <span className="filter-label" id="f-region">지역</span>
            <div className="chips scroll-x" role="group" aria-labelledby="f-region">
              <Chip pressed={!province} onClick={() => update('region', '')}>전체</Chip>
              {provinces.map((k) => (
                <Chip key={k} pressed={province === k} onClick={() => update('region', province === k ? '' : k)}>
                  {provinceLabel(k)}
                </Chip>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <label className="filter-label" htmlFor="f-school">학교</label>
            <div>
              <select id="f-school" className="select" value={school} onChange={(e) => update('school', e.target.value)}>
                <option value="">전체 학교</option>
                {schoolOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-row">
            <span className="filter-label" id="f-pos">포지션</span>
            <div className="chips scroll-x" role="group" aria-labelledby="f-pos">
              <Chip pressed={!position} onClick={() => update('position', '')}>전체</Chip>
              {positions.map((p) => (
                <Chip key={p} pressed={position === p} onClick={() => update('position', position === p ? '' : p)}>{p}</Chip>
              ))}
              {!positions.length && <span className="muted small" style={{ paddingTop: 8 }}>기록 공개 후 표시됩니다</span>}
            </div>
          </div>
        </div>

        <div className="toolbar">
          <div>
            <span className="result-count" aria-live="polite">
              {players.length ? `검색 결과 ${results.length}명` : '공개 기록 없음'}
            </span>
            {activeFilters && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={() => setParams({}, { replace: true })}>
                필터 초기화
              </button>
            )}
          </div>
          <div className="sort">
            <UpdatedAt />
            <label htmlFor="f-sort" className="sr-only">정렬</label>
            <select id="f-sort" className="select" value={sort} onChange={(e) => update('sort', e.target.value === 'fastest' ? '' : e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="notice" style={{ marginBottom: 16 }}>
          <span className="i" aria-hidden="true">i</span>
          <span>
            기록 단위: 55M {RECORD_UNIT}, 악력 {GRIP_UNIT}. 교내 순위는 각 학교 측정 선수 중 55M 직선 스프린트 기록 순서입니다.
            종목별 1인 1회 측정 기록이며, 악력은 덕수고 측정부터 실시해 해당 학교만 표시됩니다.
            측정되지 않은 기록은 —로 표시합니다.
          </span>
        </div>

        {!players.length ? (
          <EmptyState
            title="공개된 선수 기록이 아직 없습니다"
            icon="⏱"
            actions={<Link className="btn btn-ghost btn-sm" to="/schools">참가 학교 보기</Link>}
          >
            측정이 완료되고 운영팀 검수를 거친 기록이 순차적으로 공개됩니다.
          </EmptyState>
        ) : !results.length ? (
          <EmptyState
            title="조건에 맞는 선수가 없습니다"
            icon="?"
            actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>필터 초기화</button>}
          >
            검색어 철자를 확인하거나 필터를 줄여보세요.
          </EmptyState>
        ) : (
          <>
            <RecordList players={results.slice(0, limit)} schoolsById={schoolsById} events={RECORD_EVENTS} />
            {results.length > limit && (
              <div className="load-more">
                <button type="button" className="btn btn-ghost" onClick={() => setLimit((l) => l + PAGE)}>
                  더 보기 ({results.length - limit}명 남음)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
