import { Link, useParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { RECORD_EVENTS, SPRINT_COLUMNS, formatDate, formatGrip, formatTime, recordValue, sortPlayers } from '../lib/records.js';
import { schoolRegionLabel } from '../lib/regions.js';
import { GRIP_UNIT, RECORD_UNIT } from '../config.js';
import BaseDiagram from '../components/BaseDiagram.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';
import NotFound from './NotFound.jsx';

export default function PlayerDetail() {
  const { id } = useParams();
  const { players, playersById, schoolsById, galleryAlbums, measuredSchools, demo } = useData();
  const player = playersById[id];

  // 비공개 선수는 목록에서 이미 제외되어 있으므로 404
  if (!player) {
    return <NotFound title="선수 기록을 찾을 수 없습니다" message="비공개 처리되었거나 존재하지 않는 선수입니다." />;
  }

  const school = schoolsById[player.schoolId];
  const schoolInfo = measuredSchools.find((m) => m.schoolId === player.schoolId);
  const grip = recordValue(player, 'grip');
  // 이전/다음 선수: 학교순 → 교내 순위순
  const ordered = sortPlayers(players, 'school', [], schoolsById);
  const idx = ordered.findIndex((p) => p.id === player.id);
  const prev = ordered[idx - 1];
  const next = ordered[idx + 1];
  // 선수 이름을 연결한 사진은 별도 공개 승인 시에만 (photos[].playerId)
  const photos = galleryAlbums.flatMap((a) => a.photos).filter((g) => g.playerId === player.id);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="현재 위치">
        <Link to="/records">선수 기록</Link> / <Link to={`/records?school=${school.id}`}>{school.name}</Link> / <span aria-current="page">{player.name}</span>
      </nav>

      {/* 상단: 참가 학교·선수 기록 탭과 같은 레드 그라데이션 배너, 가운데 정렬 */}
      <header className="page-banner player-banner">
        <p className="eyebrow">Player Profile{demo && <span className="demo-tag">DEMO</span>}</p>
        <h1>{player.name}</h1>
        <div className="player-tags">
            <span className="tag">학교<b>{school.name}</b></span>
            <span className="tag">지역<b>{schoolRegionLabel(school)}</b></span>
            {player.grade && <span className="tag">학년<b>{player.grade}학년</b></span>}
            <span className="tag">포지션<b>{player.position || '—'}</b></span>
            {player.schoolRank && (
              <span className="tag tag-rank">
                교내 순위<b className="num">{player.schoolRank}위</b>
                {schoolInfo?.measuredCount ? <span className="muted"> / {schoolInfo.measuredCount}명 측정</span> : null}
              </span>
            )}
            {player.uniformNumber != null && player.uniformNumber !== '' && (
              <span className="tag">배번<b className="num">{player.uniformNumber}</b></span>
            )}
            {player.measuredAt && <span className="tag">측정일<b className="num">{formatDate(player.measuredAt)}</b></span>}
        </div>
      </header>
      <div className="player-updated">
        <UpdatedAt />
      </div>

      <div className={`event-grid player-records${grip != null ? ' with-grip' : ''}`}>
        {RECORD_EVENTS.map((e) => (
          <section key={e.key} className="glass card glass-hover record-card-detail" aria-labelledby={`h-${e.key}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p className="eyebrow">{e.routeKo}</p>
                <h2 id={`h-${e.key}`} style={{ fontSize: 24, marginTop: 8 }}>{e.label}</h2>
              </div>
              <div className="diagram" style={{ width: 96, flex: '0 0 auto' }}><BaseDiagram event={e.key} /></div>
            </div>
            {/* 1인 1회 측정 — 5M·27M 지점 통과 기록 + 55M 최종 기록 */}
            <div className="trial-grid split-grid">
              {SPRINT_COLUMNS.map((c) => {
                const v = recordValue(player, c.key);
                return (
                  <div key={c.key} className={c.key === 'sprint' ? 'final' : undefined}>
                    <small>{c.title}</small>
                    <div className={`v${v == null ? ' empty' : ''}`}>
                      {formatTime(v)}
                      {v != null && <span className="u">{RECORD_UNIT}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {/* 악력: 측정한 학교(덕수고~)만 표시 */}
        {grip != null && (
          <section className="glass card glass-hover record-card-detail" aria-labelledby="h-grip">
            <p className="eyebrow">Grip Strength</p>
            <h2 id="h-grip" style={{ fontSize: 24, marginTop: 8 }}>악력</h2>
            <div className="trial-grid grip-grid">
              <div>
                <small>측정 기록</small>
                <div className="v">
                  {formatGrip(grip)}
                  <span className="u">{GRIP_UNIT}</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="notice mt-24">
        <span className="i" aria-hidden="true">i</span>
        <span>
          종목별 1인 1회 측정 기록입니다. 교내 순위는 55M 직선 스프린트 기록 기준이며, 학교별 상위 5명만 공개됩니다.
          기록 정정이 필요한 경우 운영팀에 문의해 주세요.
        </span>
      </div>

      {photos.length > 0 && (
        <section className="mt-40" aria-labelledby="h-photos">
          <h2 id="h-photos" className="eyebrow" style={{ marginBottom: 14 }}>Field Photos</h2>
          <div className="gallery-grid">
            {photos.map((g) => (
              <figure key={g.src} className="gallery-item" style={{ margin: 0, cursor: 'default' }}>
                <img src={g.thumb ?? g.src} alt={g.alt} loading="lazy" />
                {g.caption && <figcaption className="cap">{g.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}

      <nav className="pager" aria-label="다른 선수 기록">
        {prev ? (
          <Link className="btn btn-ghost" to={`/players/${encodeURIComponent(prev.id)}`}>← {prev.name}</Link>
        ) : <span />}
        <Link className="btn btn-ghost" to="/records">목록으로</Link>
        {next ? (
          <Link className="btn btn-ghost" to={`/players/${encodeURIComponent(next.id)}`}>{next.name} →</Link>
        ) : <span />}
      </nav>
    </div>
  );
}
