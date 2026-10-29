import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { countByProvince, provinceLabel, schoolRegionLabel } from '../lib/regions.js';
import { formatMeasured } from '../lib/records.js';
import KoreaMap from '../components/KoreaMap.jsx';
import PageBanner from '../components/PageBanner.jsx';

export default function Schools() {
  const { schools, players, measuredSchools } = useData();
  const measuredById = useMemo(() => Object.fromEntries(measuredSchools.map((m) => [m.schoolId, m])), [measuredSchools]);
  const [params, setParams] = useSearchParams();
  const counts = useMemo(() => countByProvince(schools), [schools]);
  const selected = counts[params.get('region')] ? params.get('region') : '';

  const playerCount = useMemo(() => {
    const out = {};
    for (const p of players) out[p.schoolId] = (out[p.schoolId] ?? 0) + 1;
    return out;
  }, [players]);

  const regions = Object.entries(counts).sort((a, b) => b[1] - a[1] || provinceLabel(a[0]).localeCompare(provinceLabel(b[0]), 'ko'));
  const max = regions[0]?.[1] ?? 1;
  const listed = schools
    .filter((s) => !selected || s.province === selected)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const select = (key) => {
    const next = new URLSearchParams(params);
    if (key && key !== selected) next.set('region', key);
    else next.delete('region');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageBanner title="참가 학교">
        2026 시범 운영 참가 {schools.length}개교 | 지역을 선택하면 학교 목록을, 학교를 선택하면 선수 기록을 볼 수 있습니다.
      </PageBanner>

      <section className="container map-layout">
        <div className="map-panel glass">
          <KoreaMap counts={counts} selected={selected} onSelect={select} />
          <div className="map-legend" aria-hidden="true">
            <span><i className="sw" style={{ background: '#4a4a4a' }} />참가 학교 있음</span>
            <span><i className="sw" style={{ background: '#1a1a1a', border: '1px solid #3a3a3a' }} />참가 학교 없음</span>
            <span><i className="sw" style={{ background: 'repeating-linear-gradient(45deg,#e5e5e5 0 3px,#9a9a9a 3px 6px)', outline: '2px solid #fff' }} />선택 지역</span>
          </div>
        </div>

        <div>
          <h2 className="eyebrow" style={{ marginBottom: 14 }}>지역별 참가 학교 수</h2>
          <ul className="region-list">
            <li>
              <button type="button" className="region-btn" aria-pressed={!selected} onClick={() => select('')}>
                <span>전체{!selected && <span className="sel">선택됨</span>}</span>
                <span className="bar" aria-hidden="true"><i style={{ width: '100%' }} /></span>
                <span className="cnt">{schools.length}</span>
              </button>
            </li>
            {regions.map(([k, n]) => (
              <li key={k}>
                <button type="button" className="region-btn" aria-pressed={selected === k} onClick={() => select(k)}>
                  <span>
                    {provinceLabel(k)}
                    {selected === k && <span className="sel">선택됨</span>}
                  </span>
                  <span className="bar" aria-hidden="true"><i style={{ width: `${(n / max) * 100}%` }} /></span>
                  <span className="cnt" aria-label={`${n}개교`}>{n}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="school-list-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">{selected ? provinceLabel(selected) : 'All Regions'}</p>
              <h2 id="school-list-title">{selected ? `${provinceLabel(selected)} 참가 학교` : '전체 참가 학교'}</h2>
            </div>
            <p className="lead" aria-live="polite">{listed.length}개교</p>
          </div>
          <ul className="school-list">
            {listed.map((s) => (
              <li key={s.id}>
                <Link className="school-item glass" to={`/records?school=${s.id}`}>
                  <div>
                    <div className="nm">{s.name}</div>
                    <div className="rg">{schoolRegionLabel(s)}</div>
                  </div>
                  <div className="pc">
                    {measuredById[s.id] ? (
                      <>
                        <span className="num">{formatMeasured(measuredById[s.id].measuredAt, measuredById[s.id].measuredWeekday) ?? ''} 측정 · {measuredById[s.id].measuredCount}명</span>
                        <br />
                        상위 <b className="num">{playerCount[s.id] ?? 0}</b>명 기록 →
                      </>
                    ) : (
                      <>측정 예정</>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="muted small mt-24">
            지역 구분은 운영팀 제공 기준을 따릅니다. 학교의 정확한 주소·좌표가 확정되지 않아 지도에는 지역 단위로만 표시합니다.
          </p>
        </div>
      </section>
    </>
  );
}
