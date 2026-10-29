import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { RECORD_EVENTS, filterPlayers, sortPlayers } from '../lib/records.js';
import { provinceLabel } from '../lib/regions.js';
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
  { key: 'school', label: '학교순' },
];

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
      <PageBanner title="선수 기록">55M 직선 스프린트 기록 | 측정 기록 확인하기</PageBanner>
      <section className="container records-top">
        <UpdatedAt />
      </section>

      <section className="container" aria-label="전체 선수 기록">
        <SearchBar
          id="records-search"
          value={q}
          onChange={(v) => update('q', v)}
          label="선수명 검색"
          placeholder="선수명으로 검색"
        />

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
            <label htmlFor="f-sort" className="sr-only">정렬</label>
            <select id="f-sort" className="select" value={sort} onChange={(e) => update('sort', e.target.value === 'fastest' ? '' : e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 공개 기준 안내: 검색 결과 바로 아래 */}
        <div className="notice notice-strong notice-compact" role="note">
          <span className="i" aria-hidden="true">!</span>
          <span>
            <strong>학교별 상위 5명의 기록만 공개됩니다.</strong>
            <span className="muted"> (55M 직선 스프린트 기록 기준)</span>
          </span>
        </div>

        <div className="notice notice-strong notice-compact" role="note" style={{ marginBottom: 16 }}>
          <span className="i" aria-hidden="true">i</span>
          <span>악력은 덕수고 측정부터 실시해 해당 학교만 표시됩니다. 측정되지 않은 기록은 —로 표시합니다.</span>
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
            <RecordList players={results.slice(0, limit)} schoolsById={schoolsById} />
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
