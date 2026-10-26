// 엑셀(.xlsx / .csv) 기록 → src/data/players.json 반영
//
//   미리보기·검증만:  npm run import -- imports/기록.xlsx
//   검증 후 반영:     npm run import -- imports/기록.xlsx --confirm
//   템플릿 생성:      npm run import -- --template
//
// 검증 실패 시 기존 공개 데이터는 변경하지 않는다 (전체 반영 중단).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, extname } from 'node:path';
import * as XLSX from 'xlsx';

const ROOT = new URL('../', import.meta.url);
const SCHOOLS = new URL('src/data/schools.json', ROOT);
const PLAYERS = new URL('src/data/players.json', ROOT);
const HISTORY = new URL('src/data/import-history.json', ROOT);
const TEMPLATE_DIR = new URL('public/templates/', ROOT);

const COLUMNS = [
  { key: 'player_id', required: true, desc: '고유 식별자 (이름만으로 식별하지 않음)' },
  { key: 'player_name', required: true, desc: '공개 표시 선수명' },
  { key: 'school_id', required: true, desc: '학교 고유 식별자 (아래 학교 ID 표 참고)' },
  { key: 'school_name', required: true, desc: '학교명' },
  { key: 'region', required: true, desc: '지역' },
  { key: 'position', required: false, desc: '포지션' },
  { key: 'uniform_number', required: false, desc: '배번 (공개 승인된 경우만 입력)' },
  { key: 'sprint_27m_trial_1', required: true, blankOk: true, desc: '55M 직선 스프린트 1차 기록' },
  { key: 'sprint_27m_trial_2', required: true, blankOk: true, desc: '55M 직선 스프린트 2차 기록' },
  { key: 'sprint_54m_trial_1', required: true, blankOk: true, desc: '55M 베이스러닝 1차 기록' },
  { key: 'sprint_54m_trial_2', required: true, blankOk: true, desc: '55M 베이스러닝 2차 기록' },
  { key: 'measured_at', required: false, desc: '측정 일자 (YYYY-MM-DD)' },
  { key: 'publish_status', required: false, desc: '공개 / 비공개' },
  { key: 'photo_id', required: false, desc: '관련 사진 연결용 식별자' },
];

const TIME_COLS = [
  ['sprint', 0, 'sprint_27m_trial_1'],
  ['sprint', 1, 'sprint_27m_trial_2'],
  ['baserun', 0, 'sprint_54m_trial_1'],
  ['baserun', 1, 'sprint_54m_trial_2'],
];

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const isBlank = (v) => v == null || String(v).trim() === '';

function writeTemplate() {
  const { schools } = readJson(SCHOOLS);
  const header = COLUMNS.map((c) => c.key);
  const example = ['P2026-0001', '홍길동', schools[0].id, schools[0].name, schools[0].region, '내야수', '', '', '', '', '', '2026-05-01', '비공개', ''];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, example]), 'records');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['column', 'required', 'description'], ...COLUMNS.map((c) => [c.key, c.required ? (c.blankOk ? 'Yes/blank allowed' : 'Yes') : 'Optional', c.desc])]),
    'columns',
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([['school_id', 'school_name', 'region'], ...schools.map((s) => [s.id, s.name, s.region])]),
    'schools',
  );
  if (!existsSync(TEMPLATE_DIR)) mkdirSync(TEMPLATE_DIR, { recursive: true });
  writeFileSync(new URL('combine_template.xlsx', TEMPLATE_DIR), XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  // Excel에서 한글이 깨지지 않도록 BOM 포함 CSV
  writeFileSync(new URL('combine_template.csv', TEMPLATE_DIR), '﻿' + header.join(',') + '\n');
  console.log('템플릿 생성: public/templates/combine_template.xlsx, combine_template.csv');
}

function parseTime(v) {
  if (isBlank(v)) return { value: null };
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return { error: `숫자가 아닌 기록 "${v}"` };
  if (n < 0) return { error: `음수 기록 ${n}` };
  if (n === 0) return { error: '0은 유효한 기록이 아님 (미측정은 빈칸으로 입력)' };
  return { value: Math.round(n * 1000) / 1000 };
}

function parseDate(v) {
  if (isBlank(v)) return { value: null };
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return { error: `잘못된 날짜 ${v}` };
    return { value: `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` };
  }
  const s = String(v).trim().replace(/[./]/g, '-');
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(s) || Number.isNaN(new Date(s).getTime())) return { error: `잘못된 날짜 "${v}" (YYYY-MM-DD)` };
  const [y, m, d] = s.split('-');
  return { value: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` };
}

function parsePublish(v) {
  if (isBlank(v)) return { value: true, defaulted: true };
  const s = String(v).trim().toLowerCase();
  if (['공개', 'public', 'y', 'yes', 'true', '1'].includes(s)) return { value: true };
  if (['비공개', 'private', 'n', 'no', 'false', '0'].includes(s)) return { value: false };
  return { error: `publish_status 값 "${v}" (공개/비공개)` };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--template')) return writeTemplate();

  const file = args.find((a) => !a.startsWith('--'));
  const confirm = args.includes('--confirm');
  if (!file) {
    console.error('사용법: npm run import -- <파일.xlsx|csv> [--confirm]');
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`파일을 찾을 수 없습니다: ${file}`);
    process.exit(1);
  }
  if (!['.xlsx', '.xls', '.csv'].includes(extname(file).toLowerCase())) {
    console.error('지원 형식: .xlsx / .xls / .csv');
    process.exit(1);
  }

  const { schools } = readJson(SCHOOLS);
  const schoolsById = Object.fromEntries(schools.map((s) => [s.id, s]));

  // CSV는 UTF-8(BOM 제거) 문자열로 읽어 한글 깨짐 방지
  const wb = extname(file).toLowerCase() === '.csv'
    ? XLSX.read(readFileSync(file, 'utf8').replace(/^﻿/, ''), { type: 'string', raw: true })
    : XLSX.read(readFileSync(file), { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });
  const header = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] ?? []).map((h) => String(h ?? '').trim());

  const errors = [];
  const warnings = [];

  // 1) 컬럼 검증
  const missing = COLUMNS.filter((c) => c.required && !header.includes(c.key)).map((c) => c.key);
  if (missing.length) {
    console.error(`\n✖ 필수 컬럼 누락: ${missing.join(', ')}`);
    console.error('  템플릿: public/templates/combine_template.xlsx');
    process.exit(1);
  }
  const unknown = header.filter((h) => h && !COLUMNS.some((c) => c.key === h));
  if (unknown.length) warnings.push(`알 수 없는 컬럼은 무시됨: ${unknown.join(', ')}`);

  // 2) 행 검증
  const seen = new Map();
  const players = [];
  let rowCount = 0;
  let hidden = 0;
  let defaultedPublish = 0;

  rows.forEach((raw, i) => {
    const line = i + 2; // 엑셀 행 번호 (헤더 = 1행)
    const r = Object.fromEntries(Object.entries(raw).map(([k, v]) => [String(k).trim(), typeof v === 'string' ? v.trim() : v]));
    if (COLUMNS.every((c) => isBlank(r[c.key]))) return; // 빈 행
    rowCount++;
    const err = (msg) => errors.push(`${line}행: ${msg}`);

    for (const c of COLUMNS.filter((col) => col.required && !col.blankOk)) {
      if (isBlank(r[c.key])) err(`${c.key} 누락`);
    }
    const id = String(r.player_id ?? '').trim();
    if (id) {
      if (seen.has(id)) err(`중복 player_id "${id}" (${seen.get(id)}행과 중복)`);
      else seen.set(id, line);
    }
    const school = schoolsById[String(r.school_id ?? '').trim()];
    if (!isBlank(r.school_id) && !school) err(`미등록 school_id "${r.school_id}"`);
    if (school && !isBlank(r.school_name) && String(r.school_name).trim() !== school.name) {
      err(`school_name "${r.school_name}"이(가) school_id "${school.id}"의 학교명 "${school.name}"과 다름`);
    }

    const records = { sprint: [null, null], baserun: [null, null] };
    for (const [ev, idx, col] of TIME_COLS) {
      const t = parseTime(r[col]);
      if (t.error) err(`${col}: ${t.error}`);
      else records[ev][idx] = t.value;
    }
    const date = parseDate(r.measured_at);
    if (date.error) err(`measured_at: ${date.error}`);
    const pub = parsePublish(r.publish_status);
    if (pub.error) err(pub.error);
    if (pub.defaulted) defaultedPublish++;

    if (pub.value === false) {
      hidden++;
      return; // 비공개 행은 공개 데이터에 저장하지 않음
    }
    players.push({
      id,
      name: String(r.player_name ?? '').trim(),
      schoolId: school?.id ?? null,
      position: isBlank(r.position) ? null : String(r.position).trim(),
      uniformNumber: isBlank(r.uniform_number) ? null : String(r.uniform_number).trim(),
      measuredAt: date.value ?? null,
      photoId: isBlank(r.photo_id) ? null : String(r.photo_id).trim(),
      records,
    });
  });

  if (defaultedPublish) warnings.push(`publish_status가 비어 있는 ${defaultedPublish}행은 "공개"로 처리됨`);

  // 3) 결과 출력
  console.log(`\n파일: ${basename(file)}  ·  데이터 행 ${rowCount}개`);
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));

  if (errors.length) {
    console.error(`\n✖ 검증 실패: 오류 ${errors.length}건 — 기존 공개 데이터는 변경되지 않았습니다.\n`);
    errors.slice(0, 200).forEach((e) => console.error(`  - ${e}`));
    if (errors.length > 200) console.error(`  ... 외 ${errors.length - 200}건`);
    process.exit(1);
  }

  // 4) 기존 데이터와 비교
  const prev = readJson(PLAYERS);
  const prevById = new Map(prev.players.map((p) => [p.id, p]));
  const nextIds = new Set(players.map((p) => p.id));
  const added = players.filter((p) => !prevById.has(p.id));
  const changed = players.filter((p) => prevById.has(p.id) && JSON.stringify(prevById.get(p.id)) !== JSON.stringify(p));
  const removed = prev.players.filter((p) => !nextIds.has(p.id));

  console.log('\n✔ 검증 통과');
  console.log(`  공개 반영 대상 ${players.length}명 (비공개 제외 ${hidden}명)`);
  console.log(`  기존 대비: 신규 ${added.length} · 변경 ${changed.length} · 삭제/비공개 전환 ${removed.length}`);
  console.log('\n  미리보기 (최대 10행)');
  console.table(
    players.slice(0, 10).map((p) => ({
      id: p.id,
      name: p.name,
      school: schoolsById[p.schoolId].name,
      '직선1': p.records.sprint[0] ?? '—',
      '직선2': p.records.sprint[1] ?? '—',
      '베러1': p.records.baserun[0] ?? '—',
      '베러2': p.records.baserun[1] ?? '—',
    })),
  );

  if (!confirm) {
    console.log('\n미리보기만 실행했습니다. 반영하려면 --confirm 을 붙여 다시 실행하세요.');
    return;
  }

  const now = new Date().toISOString();
  writeFileSync(PLAYERS, JSON.stringify({ updatedAt: now, source: basename(file), players }, null, 2) + '\n');
  const history = existsSync(HISTORY) ? readJson(HISTORY) : [];
  history.unshift({ at: now, file: basename(file), published: players.length, hidden, added: added.length, changed: changed.length, removed: removed.length });
  writeFileSync(HISTORY, JSON.stringify(history, null, 2) + '\n');
  console.log(`\n✔ 반영 완료: src/data/players.json (${players.length}명) · 업데이트 ${now}`);
  console.log('  다음 단계: git add -A && git commit -m "기록 업데이트" && git push  → Render 자동 배포');
}

main();
