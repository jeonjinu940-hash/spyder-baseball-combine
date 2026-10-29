import { Link } from 'react-router-dom';
import { RECORD_EVENTS, formatGrip, formatTime, hasGrip, recordValue } from '../lib/records.js';
import { schoolRegionLabel } from '../lib/regions.js';
import { GRIP_UNIT, RECORD_UNIT } from '../config.js';

const gradeLabel = (g) => (g ? `${g}학년` : '—');

// 데스크톱: 고정 헤더 테이블 / 모바일: 카드 (CSS로 전환). 종목별 1인 1회 측정 → 종목당 기록 1칸
// 악력은 목록에 악력 기록이 있는 학교가 포함될 때만 열을 표시 (덕수고 측정부터)
export default function RecordList({ players, schoolsById, events = RECORD_EVENTS }) {
  const showGrip = hasGrip(players);
  return (
    <>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="선수 기록 표 (가로 스크롤 가능)">
        <table className="record-table">
          <caption className="sr-only">학교별 55M 직선 스프린트 상위 선수 기록</caption>
          <thead>
            <tr>
              <th scope="col" className="rank">교내 순위</th>
              <th scope="col">선수명</th>
              <th scope="col">학교</th>
              <th scope="col">지역</th>
              <th scope="col">학년</th>
              <th scope="col">포지션</th>
              {events.map((e) => (
                <th key={e.key} scope="col" className="t ev-start">
                  {e.label} ({RECORD_UNIT})
                </th>
              ))}
              {showGrip && <th scope="col" className="t">악력 ({GRIP_UNIT})</th>}
              <th scope="col"><span className="sr-only">상세</span></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const s = schoolsById[p.schoolId];
              const grip = recordValue(p, 'grip');
              return (
                <tr key={p.id}>
                  <td className="rank num">{p.schoolRank ? `${p.schoolRank}위` : '—'}</td>
                  <td className="name"><Link to={`/players/${encodeURIComponent(p.id)}`}>{p.name}</Link></td>
                  <td>{s.name}</td>
                  <td>{schoolRegionLabel(s)}</td>
                  <td>{gradeLabel(p.grade)}</td>
                  <td>{p.position || '—'}</td>
                  {events.map((e) => {
                    const v = recordValue(p, e.key);
                    return (
                      <td key={e.key} className={`t ev-start${v == null ? ' empty' : ''}`}>
                        {formatTime(v)}
                      </td>
                    );
                  })}
                  {showGrip && <td className={`t grip${grip == null ? ' empty' : ''}`}>{formatGrip(grip)}</td>}
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
          const grip = recordValue(p, 'grip');
          return (
            <li key={p.id}>
              <Link className="record-card glass" to={`/players/${encodeURIComponent(p.id)}`}>
                <div className="top">
                  <div>
                    <div className="name">
                      {p.schoolRank && <span className="rank-badge num">{p.schoolRank}위</span>}
                      {p.name}
                    </div>
                    <div className="meta">
                      {s.name} · {schoolRegionLabel(s)}
                      {p.grade ? ` · ${gradeLabel(p.grade)}` : ''}
                      {p.position ? ` · ${p.position}` : ''}
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
                  {grip != null && (
                    <div className="ev">
                      <div className="ev-name">악력 ({GRIP_UNIT})</div>
                      <div className="trials">
                        <div className="trial">
                          <b>{formatGrip(grip)}</b>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
