import { Link } from 'react-router-dom';
import { EVENTS } from '../lib/records.js';
import BaseDiagram from './BaseDiagram.jsx';

export default function AboutContent() {
  return (
    <>
      <section className="section" id="about" aria-labelledby="about-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">About Combine</p>
              <h2 id="about-title">컴바인이란?</h2>
            </div>
            <p className="lead">
              SPYDER BASEBALL COMBINE은 선수의 신체 능력과 경기력을 데이터로 측정하는 선수 평가 프로그램입니다.
              전국 고교 야구팀 중 선정된 참가 학교의 선수들을 대상으로 동일한 기준의 스프린트 기록을 측정합니다.
            </p>
          </div>
          <div className="stat-row">
            <div className="glass card">
              <p className="eyebrow">01 · Data</p>
              <h3 className="mt-16">데이터로 보는 경기력</h3>
              <p className="muted mt-16">감각이 아닌 측정값으로 선수의 스피드를 기록하고, 같은 조건에서 비교할 수 있게 합니다.</p>
            </div>
            <div className="glass card">
              <p className="eyebrow">02 · Standard</p>
              <h3 className="mt-16">동일한 측정 기준</h3>
              <p className="muted mt-16">모든 참가 학교에서 같은 거리·같은 경로·같은 횟수로 측정해 기록의 신뢰도를 높입니다.</p>
            </div>
            <div className="glass card">
              <p className="eyebrow">03 · Next Up</p>
              <h3 className="mt-16">다음 세대를 위한 기록</h3>
              <p className="muted mt-16">고교 유망 선수의 기록을 누구나 확인할 수 있도록 공개해 선수의 성장을 함께 응원합니다.</p>
            </div>
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

      <section className="section" id="events" aria-labelledby="events-title">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Measurement Events</p>
              <h2 id="events-title">측정 종목과 방식</h2>
            </div>
            <p className="lead">두 종목 모두 거리는 55M이며, 종목별로 선수 1인당 2회 측정합니다. 1차·2차 기록은 모두 보존됩니다.</p>
          </div>
          <div className="event-grid">
            {EVENTS.map((e) => (
              <article key={e.key} className="event-card glass">
                <div>
                  <p className="eyebrow">{e.label}</p>
                  <h3 className="en">55M {e.en}</h3>
                  <p className="route">{e.route}</p>
                  <p className="ko">{e.routeKo}</p>
                  <span className="trials-badge">측정 횟수 · 1인 2회</span>
                </div>
                <div className="diagram"><BaseDiagram event={e.key} /></div>
              </article>
            ))}
          </div>
          <div className="notice mt-24">
            <span className="i" aria-hidden="true">i</span>
            <span>
              공식 기록의 최종 산정 방식(대표 기록), 순위·동률 처리, 기록 단위 표기 및 정정 정책은 운영팀 확인 후 확정되며,
              확정 전에는 1차·2차 측정값만 공개합니다.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
