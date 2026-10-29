import { Link } from 'react-router-dom';
import { SPRINT_COLUMNS, formatGrip, formatTime, hasGrip, recordValue } from '../lib/records.js';
import { schoolRegionLabel } from '../lib/regions.js';
import { GRIP_UNIT, RECORD_UNIT } from '../config.js';

const gradeLabel = (g) => (g ? `${g}학년` : '—');

// 데스크톱: 고정 헤더 테이블 / 모바일: 카드 (CSS로 전환)
// 직선 스프린트 5M·27M 구간 + 55M 기록, 악력은 목록에 악력 측정 학교가 있을 때만 열 표시 (덕수고 측정부터)
export default function RecordList({ players, schoolsById }) {
  const showGrip = hasGrip(players);
  return (
    <>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="선수 기록 표 (가로 스크롤 가능)">
        <table className="record-table">
          <caption className="sr-only">학교별 55M 직선 스프린트 상위 선수 기록</caption>
          <thead>
            <tr className="group">
              <th colSpan={5} aria-hidden="true" />
              <th colSpan={SPRINT_COLUMNS.length} scope="colgroup" className="ev-start">
                55M 직선 스프린트 ({RECORD_UNIT})
              </th>
              {showGrip && <th aria-hidden="true" />}
              <th aria-hidden="true" />
            </tr>
            <tr className="sub">
              <th scope="col">선수명</th>
              <th scope="col">학교</th>
              <th scope="col">지역</th>
              <th scope="col">학년</th>
              <th scope="col">포지션</th>
              {SPRINT_COLUMNS.map((c, i) => (
                <th key={c.key} scope="col" className={`t${i === 0 ? ' ev-start' : ''}${c.key === 'sprint' ? ' final' : ''}`}>
                  {c.label}
                </th>
              ))}
              {showGrip && <th scope="col" className="t ev-start">악력 ({GRIP_UNIT})</th>}
              <th scope="col"><span className="sr-only">상세</span></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const s = schoolsById[p.schoolId];
              const grip = recordValue(p, 'grip');
              return (
                <tr key={p.id}>
                  <td className="name"><Link to={`/players/${encodeURIComponent(p.id)}`}>{p.name}</Link></td>
                  <td>{s.name}</td>
                  <td>{schoolRegionLabel(s)}</td>
                  <td>{gradeLabel(p.grade)}</td>
                  <td>{p.position || '—'}</td>
                  {SPRINT_COLUMNS.map((c, i) => {
                    const v = recordValue(p, c.key);
                    return (
                      <td
                        key={c.key}
                        className={`t${i === 0 ? ' ev-start' : ''}${c.key === 'sprint' ? ' final' : ' split'}${v == null ? ' empty' : ''}`}
                      >
                        {formatTime(v)}
                      </td>
                    );
                  })}
                  {showGrip && <td className={`t grip ev-start${grip == null ? ' empty' : ''}`}>{formatGrip(grip)}</td>}
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
                    <div className="name">{p.name}</div>
                    <div className="meta">
                      {s.name} · {schoolRegionLabel(s)}
                      {p.grade ? ` · ${gradeLabel(p.grade)}` : ''}
                      {p.position ? ` · ${p.position}` : ''}
                    </div>
                  </div>
                  <span className="go" aria-hidden="true">상세 →</span>
                </div>
                <div className="ev">
                  <div className="ev-name">55M 직선 스프린트 ({RECORD_UNIT})</div>
                  <div className="trials">
                    {SPRINT_COLUMNS.map((c) => (
                      <div className={`trial${c.key === 'sprint' ? ' final' : ''}`} key={c.key}>
                        <small>{c.label}</small>
                        <b>{formatTime(recordValue(p, c.key))}</b>
                      </div>
                    ))}
                    {grip != null && (
                      <div className="trial">
                        <small>악력 ({GRIP_UNIT})</small>
                        <b>{formatGrip(grip)}</b>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
