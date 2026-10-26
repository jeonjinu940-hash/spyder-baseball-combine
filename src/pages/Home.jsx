import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { EVENTS, formatDate, formatTime, trialValue } from '../lib/records.js';
import { countByProvince, provinceLabel } from '../lib/regions.js';
import { PROGRAM } from '../config.js';
import SearchBar from '../components/SearchBar.jsx';
import KoreaMap from '../components/KoreaMap.jsx';
import BaseDiagram from '../components/BaseDiagram.jsx';
import EmptyState from '../components/EmptyState.jsx';
import UpdatedAt from '../components/UpdatedAt.jsx';

function Metrics() {
  const { schools, players, updatedAt } = useData();
  const updated = formatDate(updatedAt);
  return (
    <dl className="metrics" aria-label="핵심 지표">
      <div className="metric">
        <dt className="label">참가 학교</dt>
        <dd className="value num" style={{ margin: 0 }}>{schools.length}<span className="unit">개교</span></dd>
      </div>
      <div className="metric">
        <dt className="label">등록 선수</dt>
        {players.length ? (
          <dd className="value num" style={{ margin: 0 }}>{players.length}<span className="unit">명</span></dd>
        ) : (
          <dd className="value pending" style={{ margin: 0 }}>기록 집계 전</dd>
        )}
      </div>
      <div className="metric">
        <dt className="label">측정 종목</dt>
        <dd className="value num" style={{ margin: 0 }}>{EVENTS.length}<span className="unit">종목</span></dd>
      </div>
      <div className="metric">
        <dt className="label">기록 업데이트</dt>
        {updated ? (
          <dd className="value num" style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 40px)' }}>{updated}</dd>
        ) : (
          <dd className="value pending" style={{ margin: 0 }}>업데이트 예정</dd>
        )}
      </div>
    </dl>
  );
}

function LatestRecords() {
  const { players, schoolsById } = useData();
  const latest = [...players]
    .sort((a, b) => (b.measuredAt ?? '').localeCompare(a.measuredAt ?? '') || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 6);

  if (!latest.length) {
    return (
      <EmptyState title="공개된 측정 기록이 아직 없습니다" icon="⏱">
        측정이 완료되고 운영팀 검수를 거친 기록이 이곳에 순차적으로 공개됩니다.
      </EmptyState>
    );
  }
  return (
    <div className="grid-3">
      {latest.map((p) => (
        <Link key={p.id} to={`/players/${encodeURIComponent(p.id)}`} className="feat-card glass">
          <div className="nm">{p.name}</div>
          <div className="sc">
            {schoolsById[p.schoolId].name}
            {p.position ? ` · ${p.position}` : ''}
            {p.measuredAt ? ` · ${formatDate(p.measuredAt)}` : ''}
          </div>
          <div className="vals">
            {EVENTS.map((e) => (
              <div key={e.key}>
                <small>{e.short} 1차 / 2차</small>
                <b>{formatTime(trialValue(p, e.key, 1))}</b>
                <span className="muted"> / </span>
                <b>{formatTime(trialValue(p, e.key, 2))}</b>
              </div>
            ))}
          </div>
        </Link>
      ))}
    </div>
  );
}

function GalleryPreview() {
  const { gallery } = useData();
  const items = gallery.slice(0, 3);
  if (!items.length) {
    return (
      <div className="grid-3" aria-label="갤러리 준비 중">
        {['FIELD', 'PLAYERS', 'SCHOOLS'].map((t) => (
          <div key={t} className="gallery-placeholder">{t} · COMING SOON</div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid-3">
      {items.map((g) => (
        <Link key={g.id} to="/gallery" className="gallery-item" style={{ display: 'block' }}>
          <img src={g.thumb ?? g.src} alt={g.alt} loading="lazy" />
        </Link>
      ))}
    </div>
  );
}

export default function Home() {
  const { schools } = useData();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const counts = countByProvince(schools);
  const regionCount = Object.keys(counts).length;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/records?q=${encodeURIComponent(q.trim())}` : '/records');
  };

  return (
    <>
      <section className="hero">
        <div className="speed-lines" aria-hidden="true" />
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">SPYDER KOREA · {PROGRAM.season}</p>
            <h1 className="display">
              <span className="line">SPYDER</span>
              <span className="line outline">BASEBALL</span>
              <span className="line">COMBINE</span>
            </h1>
            <p className="slogan">{PROGRAM.slogan}</p>
            <p className="desc">{PROGRAM.description}</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" to="/records">선수 기록 확인 →</Link>
              <Link className="btn btn-ghost" to="/schools">참가 학교 보기</Link>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/logos/combine-wordmark.jpg" alt="BASEBALL COMBINE 워드마크" width="1200" height="512" />
          </div>
        </div>
      </section>

      <section className="container" aria-label="핵심 지표와 기록 검색">
        <Metrics />
        <form className="search-cta mt-24" onSubmit={submit}>
          <SearchBar id="home-search" value={q} onChange={setQ} />
          <button type="submit" className="btn btn-primary" style={{ minHeight: 60 }}>기록 검색</button>
        </form>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Latest Records</p>
              <h2>최신 업데이트 기록</h2>
            </div>
            <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
              <UpdatedAt />
              <Link className="link-arrow" to="/records">전체 기록 보기 →</Link>
            </div>
          </div>
          <LatestRecords />
        </div>
      </section>

      <section className="section">
        <div className="container map-layout">
          <div className="map-panel glass">
            <KoreaMap counts={counts} compact />
          </div>
          <div>
            <p className="eyebrow">Participating Schools</p>
            <h2 className="display" style={{ fontSize: 'clamp(36px, 6vw, 64px)', margin: '8px 0 16px' }}>
              {schools.length} SCHOOLS
              <br />
              {regionCount} REGIONS
            </h2>
            <p className="muted">전국 고교 야구팀 중 선정된 {schools.length}개 학교가 2026 시범 운영에 참가합니다.</p>
            <ul className="region-list mt-24" aria-label="지역별 참가 학교 수 상위">
              {top.map(([k, n]) => (
                <li key={k}>
                  <Link className="region-btn" to={`/schools?region=${k}`} style={{ textDecoration: 'none' }}>
                    <span>{provinceLabel(k)}</span>
                    <span className="bar" aria-hidden="true"><i style={{ width: `${(n / top[0][1]) * 100}%` }} /></span>
                    <span className="cnt">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="btn btn-ghost mt-24" to="/schools">전체 지역 탐색 →</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Measurement Events</p>
              <h2>측정 종목</h2>
            </div>
            <p className="lead">선수의 신체 능력과 경기력을 데이터로 측정하는 선수 평가 프로그램. 종목별로 선수 1인당 2회 측정합니다.</p>
          </div>
          <div className="event-grid">
            {EVENTS.map((e) => (
              <article key={e.key} className="event-card glass">
                <div>
                  <p className="eyebrow">{e.label}</p>
                  <h3 className="en">55M {e.en}</h3>
                  <p className="route">{e.route}</p>
                  <span className="trials-badge">1인 2회 측정</span>
                </div>
                <div className="diagram"><BaseDiagram event={e.key} /></div>
              </article>
            ))}
          </div>
          <Link className="link-arrow mt-24" to="/about" style={{ marginTop: 24 }}>프로그램 자세히 보기 →</Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Field Gallery</p>
              <h2>현장 갤러리</h2>
            </div>
            <Link className="link-arrow" to="/gallery">갤러리 보기 →</Link>
          </div>
          <GalleryPreview />
        </div>
      </section>
    </>
  );
}
