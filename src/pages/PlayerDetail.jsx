import { Link, useParams } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { EVENTS, TRIALS, formatDate, formatTime, trialValue } from '../lib/records.js';
import { schoolRegionLabel } from '../lib/regions.js';
import { RECORD_UNIT } from '../config.js';
import BaseDiagram from '../components/BaseDiagram.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';
import NotFound from './NotFound.jsx';

export default function PlayerDetail() {
  const { id } = useParams();
  const { players, playersById, schoolsById, gallery, demo } = useData();
  const player = playersById[id];

  // 비공개 선수는 목록에서 이미 제외되어 있으므로 404
  if (!player) {
    return <NotFound title="선수 기록을 찾을 수 없습니다" message="비공개 처리되었거나 존재하지 않는 선수입니다." />;
  }

  const school = schoolsById[player.schoolId];
  const ordered = [...players].sort(
    (a, b) => schoolsById[a.schoolId].name.localeCompare(schoolsById[b.schoolId].name, 'ko') || a.name.localeCompare(b.name, 'ko'),
  );
  const idx = ordered.findIndex((p) => p.id === player.id);
  const prev = ordered[idx - 1];
  const next = ordered[idx + 1];
  const photos = gallery.filter((g) => g.playerId === player.id);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="현재 위치">
        <Link to="/records">선수 기록</Link> / <Link to={`/records?school=${school.id}`}>{school.name}</Link> / <span aria-current="page">{player.name}</span>
      </nav>

      <header className="player-head">
        <div>
          <p className="eyebrow">Player Profile{demo && <span className="demo-tag">DEMO</span>}</p>
          <h1>{player.name}</h1>
          <div className="player-tags">
            <span className="tag">학교<b>{school.name}</b></span>
            <span className="tag">지역<b>{schoolRegionLabel(school)}</b></span>
            <span className="tag">포지션<b>{player.position || '—'}</b></span>
            {player.uniformNumber != null && player.uniformNumber !== '' && (
              <span className="tag">배번<b className="num">{player.uniformNumber}</b></span>
            )}
            {player.measuredAt && <span className="tag">측정일<b className="num">{formatDate(player.measuredAt)}</b></span>}
          </div>
        </div>
        <UpdatedAt />
      </header>

      <div className="event-grid">
        {EVENTS.map((e) => (
          <section key={e.key} className="glass card" aria-labelledby={`h-${e.key}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p className="eyebrow">{e.route}</p>
                <h2 id={`h-${e.key}`} style={{ fontSize: 24, marginTop: 8 }}>{e.label}</h2>
              </div>
              <div className="diagram" style={{ width: 96, flex: '0 0 auto' }}><BaseDiagram event={e.key} /></div>
            </div>
            <div className="trial-grid">
              {TRIALS.map((t) => {
                const v = trialValue(player, e.key, t);
                return (
                  <div key={t}>
                    <small>{t}차 측정</small>
                    <div className={`v${v == null ? ' empty' : ''}`}>
                      {formatTime(v)}
                      {v != null && <span className="u">{RECORD_UNIT}</span>}
                    </div>
                    {v == null && <small>측정 기록 없음</small>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="notice mt-24">
        <span className="i" aria-hidden="true">i</span>
        <span>대표 기록과 순위는 공식 산정 기준이 확정된 후 표시됩니다. 기록 정정이 필요한 경우 운영팀에 문의해 주세요.</span>
      </div>

      {photos.length > 0 && (
        <section className="mt-40" aria-labelledby="h-photos">
          <h2 id="h-photos" className="eyebrow" style={{ marginBottom: 14 }}>Field Photos</h2>
          <div className="gallery-grid">
            {photos.map((g) => (
              <figure key={g.id} className="gallery-item" style={{ margin: 0, cursor: 'default' }}>
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
