import { Link } from 'react-router-dom';
import { RECORD_EVENTS, formatTime, recordValue } from '../lib/records.js';
import { schoolRegionLabel } from '../lib/regions.js';
import { RECORD_UNIT } from '../config.js';

// 데스크톱: 고정 헤더 테이블 / 모바일: 카드 (CSS로 전환). 종목별 1인 1회 측정 → 종목당 기록 1칸
export default function RecordList({ players, schoolsById, events = RECORD_EVENTS }) {
  return (
    <>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="선수 기록 표 (가로 스크롤 가능)">
        <table className="record-table">
          <caption className="sr-only">선수별 종목 측정 기록</caption>
          <thead>
            <tr>
              <th scope="col">선수명</th>
              <th scope="col">학교</th>
              <th scope="col">지역</th>
              <th scope="col">포지션</th>
              {events.map((e) => (
                <th key={e.key} scope="col" className="t ev-start">
                  {e.label} ({RECORD_UNIT})
                </th>
              ))}
              <th scope="col"><span className="sr-only">상세</span></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const s = schoolsById[p.schoolId];
              return (
                <tr key={p.id}>
                  <td className="name"><Link to={`/players/${encodeURIComponent(p.id)}`}>{p.name}</Link></td>
                  <td>{s.name}</td>
                  <td>{schoolRegionLabel(s)}</td>
                  <td>{p.position || '—'}</td>
                  {events.map((e) => {
                    const v = recordValue(p, e.key);
                    return (
                      <td key={e.key} className={`t ev-start${v == null ? ' empty' : ''}`}>
                        {formatTime(v)}
                      </td>
                    );
                  })}
                  <td>
                    <Link className="link-arrow small" to={`/players/${encodeURIComponent(p.id)}`} aria-label={`${p.name} 상세 보기`}>
                      상세 →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="record-cards" role="list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {players.map((p) => {
          const s = schoolsById[p.schoolId];
          return (
            <li key={p.id}>
              <Link className="record-card glass" to={`/players/${encodeURIComponent(p.id)}`}>
                <div className="top">
                  <div>
                    <div className="name">{p.name}</div>
                    <div className="meta">
                      {s.name} · {schoolRegionLabel(s)}{p.position ? ` · ${p.position}` : ''}
                    </div>
                  </div>
                  <span className="go" aria-hidden="true">상세 →</span>
                </div>
                <div className="ev-grid">
                  {events.map((e) => (
                    <div className="ev" key={e.key}>
                      <div className="ev-name">{e.label}</div>
                      <div className="trials">
                        <div className="trial">
                          <b>{formatTime(recordValue(p, e.key))}</b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
