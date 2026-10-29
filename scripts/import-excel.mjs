// 운영 기록 엑셀 → src/data/players.json (학교별 55M 상위 5명만 공개)
//
//   미리보기·검증:  npm run import -- "(SPYDER) 베이스볼컴바인 기록 (10.28).xlsx"
//   검증 후 반영:   npm run import -- "(SPYDER) 베이스볼컴바인 기록 (10.28).xlsx" --confirm
//   파일을 생략하면 프로젝트 폴더에서 '기록'이 들어간 가장 최근 .xlsx를 사용
//
// 읽는 범위 (그 외 시트·열은 읽지 않음 — 연락처 등 개인정보 보호)
//   · '전체 측정표' 시트: No.·학교·이름·학년·포지션·5m·27m·55m(fin)·1루·2루(fin)·악력
//   · 'SCHEDULE' 시트: 일정(날짜)·학교 열만 → 학교별 측정일
// 공개 데이터에는 학교별 55M 상위 5명의 이름·학교·학년·포지션·5m·27m·55m 기록·악력·교내 순위를 저장하고,
// 실시간 순위용으로 전체 측정 선수 중 종목별 TOP 15(이름·학교·학년·포지션·해당 기록)만 추가 저장한다.
// 검증 오류가 하나라도 있으면 전체 반영을 중단하고 기존 데이터를 그대로 둔다.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SCHOOLS = join(ROOT, 'src', 'data', 'schools.json');
const PLAYERS = join(ROOT, 'src', 'data', 'players.json');
const HISTORY = join(ROOT, 'src', 'data', 'import-history.json');

const RECORD_SHEET = '전체 측정표';
const SCHEDULE_SHEET = 'SCHEDULE';
const TOP_N = 5; // 학교별 공개 인원 (선수 기록 탭·상세)
const RANK_LIMIT = 15; // 실시간 순위 보드별 인원

// 실시간 순위: 전체 측정 선수 기준. 상위 5명 밖 선수는 순위에만 노출되고 상세 페이지 링크(playerId)는 없음
const RANK_BOARDS = [
  { key: 'sprint', field: 'm55', lower: true },
  { key: 'split27', field: 'm27', lower: true },
  { key: 'split5', field: 'm5', lower: true },
  { key: 'grip', field: 'grip', lower: false },
];

// 헤더 이름 → 키 (공백 무시)
const COLUMNS = {
  학교: 'school',
  이름: 'name',
  학년: 'grade',
  포지션: 'position',
  '5m': 'm5',
  '27m': 'm27',
  '55m(fin)': 'm55',
  악력: 'grip',
};
const REQUIRED = ['school', 'name', 'm55'];

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const clean = (v) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim());
const isBlank = (v) => ['', '-', '–', '—'].includes(clean(v));

function pickFile(arg) {
  if (arg) return arg;
  const candidates = [ROOT, join(ROOT, 'imports')]
    .filter(existsSync)
    .flatMap((d) => readdirSync(d).filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$') && f.includes('기록')).map((f) => join(d, f)));
  candidates.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0];
}

function parseNumber(v, label, err) {
  if (isBlank(v)) return null;
  const n = Number(clean(v));
  if (!Number.isFinite(n)) return err(`${label}: 숫자가 아님 "${clean(v)}"`), null;
  if (n <= 0) return err(`${label}: 0 이하 값 ${n}`), null;
  return Math.round(n * 1000) / 1000;
}

// 파일 이름의 (10.28) → 2026-10-28 (시즌 연도 기준)
function dateFromFilename(file, season) {
  const m = basename(file).match(/\((\d{1,2})\.(\d{1,2})\)/);
  return m ? `${season}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
}

// SCHEDULE: 한 행에서 '10/6 (화)' 같은 날짜 칸과 학교명 칸만 읽는다
function readSchedule(wb, schools, season) {
  const ws = wb.Sheets[SCHEDULE_SHEET];
  const out = {};
  if (!ws) return out;
  for (const row of XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false })) {
    const cells = row.map(clean);
    const dateCell = cells.find((c) => /^\d{1,2}\/\d{1,2}/.test(c));
    const school = schools.find((s) => cells.includes(s.name));
    if (!dateCell || !school) continue;
    const [, mo, d] = dateCell.match(/^(\d{1,2})\/(\d{1,2})/);
    out[school.id] = `${season}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const file = pickFile(args.find((a) => !a.startsWith('--')));
  if (!file || !existsSync(file)) {
    console.error('기록 엑셀 파일을 찾을 수 없습니다. 사용법: npm run import -- "<파일.xlsx>" [--confirm]');
    process.exit(1);
  }
  if (extname(file).toLowerCase() !== '.xlsx') {
    console.error('지원 형식: .xlsx');
    process.exit(1);
  }

  const { season, schools } = readJson(SCHOOLS);
  const byName = Object.fromEntries(schools.map((s) => [s.name, s]));
  const wb = XLSX.read(readFileSync(file), { type: 'buffer' });
  const ws = wb.Sheets[RECORD_SHEET];
  if (!ws) {
    console.error(`✖ '${RECORD_SHEET}' 시트가 없습니다. 시트 목록: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  // 헤더 행: '학교'와 '이름'이 모두 있는 첫 행. 같은 이름의 열이 여러 개면(오른쪽 TOP 15 표) 가장 왼쪽 것만 사용
  const headerIdx = rows.findIndex((r) => r.map(clean).includes('학교') && r.map(clean).includes('이름'));
  if (headerIdx < 0) {
    console.error(`✖ '${RECORD_SHEET}'에서 헤더(학교·이름) 행을 찾을 수 없습니다.`);
    process.exit(1);
  }
  const col = {};
  rows[headerIdx].forEach((h, i) => {
    const key = COLUMNS[clean(h)];
    if (key && col[key] == null) col[key] = i;
  });
  const missing = REQUIRED.filter((k) => col[k] == null);
  if (missing.length) {
    const names = Object.entries(COLUMNS).filter(([, k]) => missing.includes(k)).map(([h]) => h);
    console.error(`✖ 필수 열 누락: ${names.join(', ')}`);
    process.exit(1);
  }

  const errors = [];
  const seq = {}; // 학교별 측정 순번
  const measured = []; // 전체 측정 선수 (메모리에서만 사용, 저장하지 않음)

  rows.slice(headerIdx + 1).forEach((r, k) => {
    const line = headerIdx + k + 2; // 엑셀 행 번호
    const schoolName = clean(r[col.school]);
    const name = clean(r[col.name]);
    if (!schoolName && !name) return; // 빈 행
    const err = (msg) => errors.push(`${line}행 (${schoolName || '?'} ${name || '?'}): ${msg}`);
    if (!schoolName) return err('학교 누락');
    if (!name) return err('이름 누락');
    const school = byName[schoolName];
    if (!school) return err(`참가 학교 목록에 없는 학교 "${schoolName}"`);

    seq[school.id] = (seq[school.id] ?? 0) + 1;
    measured.push({
      line,
      seq: seq[school.id],
      schoolId: school.id,
      name,
      grade: clean(r[col.grade]) || null,
      position: clean(r[col.position]) || null,
      m5: col.m5 != null ? parseNumber(r[col.m5], '5m', err) : null,
      m27: col.m27 != null ? parseNumber(r[col.m27], '27m', err) : null,
      m55: parseNumber(r[col.m55], '55m', err),
      grip: col.grip != null ? parseNumber(r[col.grip], '악력', err) : null,
    });
  });

  console.log(`\n파일: ${basename(file)}  ·  측정 선수 ${measured.length}명 · 학교 ${Object.keys(seq).length}곳`);

  if (errors.length) {
    console.error(`\n✖ 검증 실패: 오류 ${errors.length}건 — 기존 공개 데이터는 변경되지 않았습니다.\n`);
    errors.slice(0, 200).forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  // 학교별 55M 상위 5명 (동기록 시 27m → 5m → 측정 순번 순)
  const schedule = readSchedule(wb, schools, season);
  const warnings = [];
  const players = [];
  const measuredSchools = [];
  for (const school of schools.filter((s) => seq[s.id])) {
    const list = measured.filter((p) => p.schoolId === school.id);
    const ranked = list
      .filter((p) => p.m55 != null)
      .sort((a, b) => a.m55 - b.m55 || (a.m27 ?? 99) - (b.m27 ?? 99) || (a.m5 ?? 99) - (b.m5 ?? 99) || a.seq - b.seq);
    const top = ranked.slice(0, TOP_N);
    const cut = ranked[TOP_N - 1];
    const next = ranked[TOP_N];
    if (cut && next && cut.m55 === next.m55) warnings.push(`${school.name}: 5위와 6위 55m 동기록(${cut.m55}) — 27m 기록으로 구분`);
    if (!schedule[school.id]) warnings.push(`${school.name}: SCHEDULE 시트에서 측정일을 찾지 못함`);
    const gripMeasured = list.some((p) => p.grip != null);

    measuredSchools.push({
      schoolId: school.id,
      measuredAt: schedule[school.id] ?? null,
      measuredCount: list.length,
      gripMeasured,
    });
    top.forEach((p, i) =>
      players.push({
        id: `${school.id}-${p.seq}`,
        name: p.name,
        schoolId: school.id,
        grade: p.grade,
        position: p.position,
        measuredAt: schedule[school.id] ?? null,
        schoolRank: i + 1,
        // 직선 스프린트 구간 기록(5m·27m)과 55m 최종 기록, 악력
        records: { split5: p.m5, split27: p.m27, sprint: p.m55, grip: gripMeasured ? p.grip : null },
      }),
    );
  }

  // 실시간 순위 (전체 측정 선수 기준, 동기록 = 같은 순위)
  const publishedIds = new Set(players.map((p) => p.id));
  const rankings = {};
  for (const b of RANK_BOARDS) {
    const list = measured
      .filter((p) => p[b.field] != null)
      .sort((a, c) => (a[b.field] - c[b.field]) * (b.lower ? 1 : -1) || a.name.localeCompare(c.name, 'ko'));
    let prevValue = null;
    let rank = 0;
    rankings[b.key] = list
      .map((p, i) => {
        if (p[b.field] !== prevValue) rank = i + 1;
        prevValue = p[b.field];
        const id = `${p.schoolId}-${p.seq}`;
        return {
          rank,
          value: p[b.field],
          name: p.name,
          schoolId: p.schoolId,
          grade: p.grade,
          position: p.position,
          playerId: publishedIds.has(id) ? id : null,
        };
      })
      .filter((r) => r.rank <= RANK_LIMIT);
  }
  const rankOnly = new Set(Object.values(rankings).flat().filter((r) => !r.playerId).map((r) => `${r.schoolId}:${r.name}`));
  console.log(`  실시간 순위: 보드 ${RANK_BOARDS.length}개 × TOP ${RANK_LIMIT} (상위 5명 밖 선수 ${rankOnly.size}명은 순위에만 표시)`);

  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  console.log(`\n✔ 검증 통과 — 공개 대상: ${measuredSchools.length}개 학교 × 상위 ${TOP_N}명 = ${players.length}명`);
  console.table(
    measuredSchools.map((m) => ({
      학교: schools.find((s) => s.id === m.schoolId).name,
      측정일: m.measuredAt ?? '—',
      측정인원: m.measuredCount,
      악력: m.gripMeasured ? 'O' : '',
      공개: players.filter((p) => p.schoolId === m.schoolId).map((p) => `${p.schoolRank}.${p.name}(${p.records.sprint})`).join(' '),
    })),
  );

  const prev = readJson(PLAYERS);
  const prevIds = new Set(prev.players.map((p) => p.id));
  const added = players.filter((p) => !prevIds.has(p.id)).length;
  const removed = prev.players.filter((p) => !players.some((q) => q.id === p.id)).length;
  console.log(`  기존 대비: 신규 ${added} · 제외 ${removed}`);

  if (!confirm) {
    console.log('\n미리보기만 실행했습니다. 반영하려면 --confirm 을 붙여 다시 실행하세요.');
    return;
  }

  const updatedAt = dateFromFilename(file, season) ?? new Date().toISOString();
  writeFileSync(
    PLAYERS,
    JSON.stringify({ updatedAt, source: basename(file), topN: TOP_N, measuredSchools, players, rankings }, null, 2) + '\n',
  );
  const history = existsSync(HISTORY) ? readJson(HISTORY) : [];
  history.unshift({
    at: new Date().toISOString(),
    file: basename(file),
    updatedAt,
    schools: measuredSchools.length,
    measured: measured.length,
    published: players.length,
  });
  writeFileSync(HISTORY, JSON.stringify(history, null, 2) + '\n');
  console.log(`\n✔ 반영 완료: src/data/players.json (${players.length}명) · 기록 기준일 ${updatedAt}`);
}

main();
