import { Link } from 'react-router-dom';
import { EVENTS } from '../lib/records.js';
import BaseDiagram from '../components/BaseDiagram.jsx';

const FLOW = ['현장 도착', '측정 구간 세팅', '장비 점검', '선수 준비', '55M 직선 스프린트 측정', '55M 베이스러닝 측정', '측정 종료'];
const KEY_STEPS = new Set([4, 5]);

export default function About() {
  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">About Combine</p>
        <h1>WHAT IS<br />THE COMBINE</h1>
        <p>
          SPYDER BASEBALL COMBINE은 선수의 신체 능력과 경기력을 데이터로 측정하는 선수 평가 프로그램입니다.
          전국 고교 야구팀 중 선정된 참가 학교의 선수들을 대상으로 동일한 기준의 스프린트 기록을 측정합니다.
        </p>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Purpose</p>
              <h2>운영 목적</h2>
            </div>
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

      <section className="section" id="events">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Measurement Events</p>
              <h2>측정 종목과 방식</h2>
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
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="eyebrow">Field Process</p>
              <h2>현장 운영 프로세스</h2>
            </div>
          </div>
          <ol className="timeline">
            {FLOW.map((f, i) => (
              <li key={f} className={KEY_STEPS.has(i) ? 'key' : undefined}>{f}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container two-col">
          <div className="glass card">
            <p className="eyebrow">Check-in</p>
            <h3 className="mt-16" style={{ fontSize: 24 }}>측정 전 본인 확인</h3>
            <ul className="check-list">
              <li>선수는 홈 플레이트 앞에서 본인 확인을 진행합니다.</li>
              <li>배번 → 포지션 → 이름 순으로 확인합니다.</li>
            </ul>
          </div>
          <div className="glass card">
            <p className="eyebrow">Dress Code</p>
            <h3 className="mt-16" style={{ fontSize: 24 }}>복장 기준</h3>
            <ul className="check-list">
              <li>참가 선수 전원 본인 소유 야구화를 착용합니다.</li>
            </ul>
          </div>
        </div>
        <div className="container mt-24">
          <div className="notice">
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
