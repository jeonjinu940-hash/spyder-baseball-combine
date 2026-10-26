import { Link } from 'react-router-dom';
import { EVENTS } from '../lib/records.js';
import BaseDiagram from './BaseDiagram.jsx';

const PURPOSES = [
  { tag: '01 · Data', title: '데이터로 보는 경기력', body: '감각이 아닌 측정값으로 선수의 스피드를 기록하고, 같은 조건에서 비교할 수 있게 합니다.' },
  { tag: '02 · Standard', title: '동일한 측정 기준', body: '모든 참가 학교에서 같은 거리·같은 경로·같은 횟수로 측정해 기록의 신뢰도를 높입니다.' },
  { tag: '03 · Next Up', title: '다음 세대를 위한 기록', body: '고교 유망 선수의 기록을 누구나 확인할 수 있도록 공개해 선수의 성장을 함께 응원합니다.' },
];

export default function AboutContent() {
  return (
    <>
      <section className="section glass-stage" id="about" aria-labelledby="about-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">About Combine</p>
              <h2 id="about-title">컴바인이란?</h2>
            </div>
          </div>
          <div className="stat-row">
            {PURPOSES.map((p) => (
              <div key={p.tag} className="glass card glass-hover">
                <p className="eyebrow">{p.tag}</p>
                <h3 className="mt-16">{p.title}</h3>
                <p className="muted mt-16">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="notice mt-24">
            <span className="i" aria-hidden="true">i</span>
            <span>
              <strong>2026 시범 운영</strong> — 전국 고교 야구 104개 팀 중 20개 팀이 참가합니다.{' '}
              <Link to="/schools">참가 학교 보기 →</Link>
            </span>
          </div>
        </div>
      </section>

      <section className="section glass-stage" id="events" aria-labelledby="events-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Measurement Events</p>
              <h2 id="events-title">측정 종목</h2>
            </div>
            <p className="lead lead-nowrap">두 종목 모두 거리는 55M이며, 종목별 1인당 1회씩 측정합니다.</p>
          </div>
          <div className="event-grid">
            {EVENTS.map((e) => (
              <article key={e.key} className="event-card glass glass-strong">
                <div>
                  <p className="eyebrow">{e.label}</p>
                  <h3 className="en">{e.en}</h3>
                  <p className="ko">{e.routeKo}</p>
                </div>
                <div className="diagram"><BaseDiagram event={e.key} /></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
