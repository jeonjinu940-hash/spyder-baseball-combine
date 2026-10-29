import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { RANK_BOARDS, formatGrip, formatTime, rankPlayers } from '../lib/records.js';
import PageBanner from '../components/PageBanner.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';
import EmptyState from '../components/EmptyState.jsx';

const LIMIT = 15;

// 순위 행 공통 형태: { rank, value, name, schoolId, grade, position, playerId }
// playerId가 없으면(학교별 상위 5명 밖 선수) 상세 페이지 링크 없이 순위에만 표시
function useBoardRows(board) {
  const { rankings, players } = useData();
  return useMemo(() => {
    if (rankings?.[board.key]) return rankings[board.key];
    return rankPlayers(players, board, LIMIT).map(({ player: p, rank, value }) => ({
      rank,
      value,
      name: p.name,
      schoolId: p.schoolId,
      grade: p.grade,
      position: p.position,
      playerId: p.id,
    }));
  }, [rankings, players, board]);
}

// 상세 페이지가 있는 선수만 링크
function RowLink({ row, className, children }) {
  if (!row.playerId) return <div className={`${className} no-link`}>{children}</div>;
  return (
    <Link to={`/players/${encodeURIComponent(row.playerId)}`} className={className}>
      {children}
    </Link>
  );
}

// 실시간 순위: 전체 측정 선수 기준 종목별 TOP 15 — 새 기록 반영 시 자동 갱신
export default function Rankings() {
  const { schoolsById } = useData();
  const [params, setParams] = useSearchParams();
  const board = RANK_BOARDS.find((b) => b.key === params.get('board')) ?? RANK_BOARDS[0];
  const rows = useBoardRows(board);
  const fmt = (v) => (board.key === 'grip' ? formatGrip(v) : formatTime(v));
  const podium = rows.filter((r) => r.rank <= 3);
  const rest = rows.filter((r) => r.rank > 3);

  const meta = (r) => [schoolsById[r.schoolId]?.name, r.grade ? `${r.grade}학년` : null, r.position].filter(Boolean).join(' · ');

  return (
    <>
      <PageBanner title="실시간 순위">전체 측정 선수 기준 종목별 TOP {LIMIT} | 새 기록이 반영될 때마다 순위가 갱신됩니다.</PageBanner>

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
              {podium.map((r, i) => (
                <li key={`p${i}`} className={`podium-card glass rank-${r.rank}`}>
                  <RowLink row={r} className="podium-inner">
                    <span className="podium-rank num">{r.rank}<small>위</small></span>
                    <span className="podium-name">{r.name}</span>
                    <span className="podium-meta">{meta(r)}</span>
                    <span className="podium-value num">
                      {fmt(r.value)}
                      <small>{board.unit}</small>
                    </span>
                  </RowLink>
                </li>
              ))}
            </ol>

            {rest.length > 0 && (
              <ol className="rank-list" aria-label={`${board.label} 4~${LIMIT}위`}>
                {rest.map((r, i) => (
                  <li key={`r${i}`}>
                    <RowLink row={r} className="rank-row">
                      <span className="rank-no num">{r.rank}위</span>
                      <span className="rank-who">
                        <b>{r.name}</b>
                        <span>{meta(r)}</span>
                      </span>
                      <span className="rank-val num">
                        {fmt(r.value)}
                        <small>{board.unit}</small>
                      </span>
                    </RowLink>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        <div className="notice mt-24">
          <span className="i" aria-hidden="true">i</span>
          <span>
            순위는 전체 측정 선수 기준이며, 같은 기록은 같은 순위로 표시합니다. 학교별 상위 5명(55M 기준) 선수만 이름을 누르면 상세 기록을 볼 수 있습니다.
            {board.key === 'grip' ? ' 악력은 덕수고 측정부터 실시해 측정한 학교 선수만 포함됩니다.' : ''}
            {board.key !== 'sprint' && board.key !== 'grip' ? ` ${board.short}는 55M 직선 스프린트 중 해당 지점 통과 기록입니다.` : ''}
          </span>
        </div>
      </section>
    </>
  );
}
