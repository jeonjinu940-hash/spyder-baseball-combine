import { useEffect, useState } from 'react';
import { SPRINT_COLUMNS, formatGrip, formatMeasured, formatTime, formatDate } from '../lib/records.js';
import { fetchMyIndex, lookupMyRecord } from '../lib/myRecords.js';
import { GRIP_UNIT, RECORD_UNIT } from '../config.js';
import PageBanner from '../components/PageBanner.jsx';

// 나의 기록 보기: 이름 + 스파이더 온라인몰 아이디가 일치하는 본인 기록만 표시 (전체 측정 선수 대상)
export default function MyRecords() {
  const [index, setIndex] = useState(undefined); // undefined: 불러오는 중, null: 준비 전
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | notfound | error
  const [record, setRecord] = useState(null);

  useEffect(() => {
    fetchMyIndex()
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) return;
    setStatus('loading');
    try {
      const r = await lookupMyRecord(name, id);
      if (r) {
        setRecord(r);
        setStatus('idle');
      } else setStatus('notfound');
    } catch {
      setStatus('error');
    }
  };

  const reset = () => {
    setRecord(null);
    setName('');
    setId('');
    setStatus('idle');
  };

  const ready = index && index.count > 0;

  return (
    <>
      <PageBanner title="나의 기록 보기">이름과 스파이더 온라인몰 아이디로 본인의 측정 기록을 확인할 수 있습니다.</PageBanner>

      <section className="container">
        {record ? (
          <MyRecordCard r={record} onReset={reset} />
        ) : (
          <form className="my-login glass card" onSubmit={submit} autoComplete="off">
            <h2>본인 확인</h2>
            <p className="muted small">참가 선수 본인만 조회할 수 있습니다. 입력한 정보는 저장되지 않습니다.</p>
            <label htmlFor="my-name">이름</label>
            <input id="my-name" className="my-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 홍길동" required />
            <label htmlFor="my-id">스파이더 온라인몰 아이디</label>
            <input id="my-id" className="my-input" value={id} onChange={(e) => setId(e.target.value)} placeholder="온라인몰 로그인 아이디" required autoCapitalize="none" spellCheck="false" />
            {status === 'notfound' && (
              <p className="my-error" role="alert">일치하는 기록이 없습니다. 이름과 아이디를 다시 확인해 주세요.</p>
            )}
            {status === 'error' && <p className="my-error" role="alert">조회 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>}
            {index === null || (index && !index.count) ? (
              <p className="my-error" role="status">기록 조회를 준비 중입니다.</p>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={!ready || status === 'loading'}>
              {status === 'loading' ? '확인 중…' : '내 기록 보기'}
            </button>
          </form>
        )}
      </section>
    </>
  );
}

function MyRecordCard({ r, onReset }) {
  const grip = typeof r.records.grip === 'number' ? r.records.grip : null;
  return (
    <>
      <header className="page-banner player-banner">
        <p className="eyebrow">My Record</p>
        <h1>{r.name}</h1>
        <div className="player-tags">
          <span className="tag">학교<b>{r.school}</b></span>
          {r.grade && <span className="tag">학년<b>{r.grade}학년</b></span>}
          {r.position && <span className="tag">포지션<b>{r.position}</b></span>}
          {r.schoolRank && (
            <span className="tag tag-rank">
              교내 순위<b className="num">{r.schoolRank}위</b>
              {r.schoolCount ? <span className="muted"> / {r.schoolCount}명</span> : null}
            </span>
          )}
          {r.overallRank && (
            <span className="tag tag-rank">
              전체 순위<b className="num">{r.overallRank}위</b>
              <span className="muted"> / {r.overallCount}명</span>
            </span>
          )}
          {r.measuredAt && <span className="tag">측정일<b className="num">{formatMeasured(r.measuredAt, r.measuredWeekday)}</b></span>}
        </div>
      </header>

      <div className={`event-grid player-records mt-24${grip != null ? ' with-grip' : ''}`}>
        <section className="glass card glass-hover record-card-detail">
          <p className="eyebrow">홈 → 1루 → 외야 (직선 거리 55M)</p>
          <h2 style={{ fontSize: 24, marginTop: 8 }}>55M 직선 스프린트</h2>
          <div className="trial-grid split-grid">
            {SPRINT_COLUMNS.map((c) => {
              const v = r.records[c.key];
              return (
                <div key={c.key} className={c.key === 'sprint' ? 'final' : undefined}>
                  <small>{c.title}</small>
                  <div className={`v${typeof v !== 'number' ? ' empty' : ''}`}>
                    {formatTime(v)}
                    {typeof v === 'number' && <span className="u">{RECORD_UNIT}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {grip != null && (
          <section className="glass card glass-hover record-card-detail">
            <p className="eyebrow">Grip Strength</p>
            <h2 style={{ fontSize: 24, marginTop: 8 }}>악력</h2>
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

      <div className="notice notice-compact mt-24">
        <span className="i" aria-hidden="true">i</span>
        <span>
          교내·전체 순위는 55M 직선 스프린트 기준입니다. 기록 업데이트 {formatDate(r.updatedAt)} 기준. 기록 정정이 필요한 경우 운영팀에 문의해 주세요.
        </span>
      </div>
      <div className="pager" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn btn-ghost" onClick={onReset}>다른 기록 조회 / 나가기</button>
      </div>
    </>
  );
}
