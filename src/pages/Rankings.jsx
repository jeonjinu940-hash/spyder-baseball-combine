import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { RANK_BOARDS, formatGrip, formatTime, rankPlayers } from '../lib/records.js';
import PageBanner from '../components/PageBanner.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';
import EmptyState from '../components/EmptyState.jsx';

const LIMIT = 15;

// 실시간 순위: 공개된 기록(학교별 55M 상위 5명)으로 종목별 TOP 15 — 새 기록 반영 시 자동 갱신
export default function Rankings() {
  const { players, schoolsById } = useData();
  const [params, setParams] = useSearchParams();
  const board = RANK_BOARDS.find((b) => b.key === params.get('board')) ?? RANK_BOARDS[0];
  const rows = useMemo(() => rankPlayers(players, board, LIMIT), [players, board]);
  const fmt = (v) => (board.key === 'grip' ? formatGrip(v) : formatTime(v));
  const podium = rows.filter((r) => r.rank <= 3);
  const rest = rows.filter((r) => r.rank > 3);

  const meta = (p) => {
    const s = schoolsById[p.schoolId];
    return [s.name, p.grade ? `${p.grade}학년` : null, p.position].filter(Boolean).join(' · ');
  };

  return (
    <>
      <PageBanner title="실시간 순위">공개 기록 기준 종목별 TOP {LIMIT} | 새 기록이 반영될 때마다 순위가 갱신됩니다.</PageBanner>

      <section className="container">
        <div className="rank-toolbar">
          <div className="chips" role="group" aria-label="순위 종목">
            {RANK_BOARDS.map((b) => (
              <button
                key={b.key}
                type="button"
                className="chip"
                aria-pressed={b.key === board.key}
                onClick={() => setParams(b.key === RANK_BOARDS[0].key ? {} : { board: b.key }, { replace: true })}
              >
                {b.label}
              </button>
            ))}
          </div>
          <UpdatedAt />
        </div>

        {!rows.length ? (
          <EmptyState title="아직 순위를 집계할 기록이 없습니다" icon="🏁">
            {board.key === 'grip' ? '악력은 덕수고 측정부터 실시합니다.' : '기록이 반영되면 순위가 표시됩니다.'}
          </EmptyState>
        ) : (
          <>
            <ol className="podium" aria-label={`${board.label} 1~3위`}>
              {podium.map(({ player: p, rank, value }) => (
                <li key={p.id} className={`podium-card glass rank-${rank}`}>
                  <Link to={`/players/${encodeURIComponent(p.id)}`}>
                    <span className="podium-rank num">{rank}<small>위</small></span>
                    <span className="podium-name">{p.name}</span>
                    <span className="podium-meta">{meta(p)}</span>
                    <span className="podium-value num">
                      {fmt(value)}
                      <small>{board.unit}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            {rest.length > 0 && (
              <ol className="rank-list" aria-label={`${board.label} 4~${LIMIT}위`}>
                {rest.map(({ player: p, rank, value }) => (
                  <li key={p.id}>
                    <Link to={`/players/${encodeURIComponent(p.id)}`} className="rank-row">
                      <span className="rank-no num">{rank}위</span>
                      <span className="rank-who">
                        <b>{p.name}</b>
                        <span>{meta(p)}</span>
                      </span>
                      <span className="rank-val num">
                        {fmt(value)}
                        <small>{board.unit}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <div className="notice mt-24">
          <span className="i" aria-hidden="true">i</span>
          <span>
            순위는 학교별 55M 상위 5명으로 공개된 기록만으로 집계하며, 같은 기록은 같은 순위로 표시합니다.
            {board.key === 'grip' ? ' 악력은 덕수고 측정부터 실시해 측정한 학교 선수만 포함됩니다.' : ''}
            {board.key !== 'sprint' && board.key !== 'grip' ? ` ${board.short}는 55M 직선 스프린트 중 해당 지점 통과 기록입니다.` : ''}
          </span>
        </div>
      </section>
    </>
  );
}
