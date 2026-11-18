// 나의 기록 보기: 전체 측정 선수 개인 기록을 '이름 + 스파이더 온라인몰 아이디'로만 열 수 있게 암호화해 저장
//
// 선수마다 PBKDF2(이름 + 아이디)로 64바이트를 만들어
//   · 앞 16바이트 → 파일 이름 (public/my/<hex>.json)
//   · 뒤 32바이트 → AES-GCM 키
// 이름과 아이디를 모두 알아야 파일을 찾고 열 수 있다. 아이디 원본은 저장하지 않는다.
// 브라우저 쪽 같은 계산: src/lib/myRecords.js (상수를 바꾸면 양쪽을 함께 바꿀 것)
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, rmSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { pbkdf2Sync, randomBytes, createCipheriv } from 'node:crypto';
import * as XLSX from 'xlsx';
import { ROOT, DATA_DIR } from './paths.mjs';

export const MY_SALT = 'spyder-combine-my-records-v1';
export const MY_ITERATIONS = 150000;
const OUT = join(ROOT, 'public', 'my');

const clean = (v) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim());
export const normName = (s) => clean(s).replace(/\s+/g, '');
export const normId = (s) => clean(s).replace(/\s+/g, '').toLowerCase();

// 아이디 파일: 인자(--ids) 또는 자료 폴더에서 이름에 '아이디'/'ID'가 들어간 가장 최근 .xlsx/.csv
export function findIdsFile(arg) {
  if (arg) return existsSync(arg) ? arg : join(DATA_DIR, arg);
  const list = [...new Set([DATA_DIR, ROOT, join(ROOT, 'imports')])]
    .filter(existsSync)
    .flatMap((d) =>
      readdirSync(d)
        .filter((f) => /\.(xlsx|csv)$/i.test(f) && !f.startsWith('~$') && /아이디|(^|[^a-z])id([^a-z]|$)/i.test(f))
        .map((f) => join(d, f)),
    );
  list.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return list[0] ?? null;
}

// 모든 시트에서 '이름' + 아이디 열이 있는 헤더 행을 찾아 { 학교, 이름, 학년, 아이디 } 목록으로
function readIds(file) {
  const wb =
    extname(file).toLowerCase() === '.csv'
      ? XLSX.read(readFileSync(file, 'utf8').replace(/^﻿/, ''), { type: 'string', raw: true })
      : XLSX.read(readFileSync(file), { type: 'buffer' });
  const out = [];
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null, raw: false });
    const h = rows.findIndex((r) => r.map(clean).includes('이름') && r.map(clean).some((c) => /아이디|^id$|온라인몰/i.test(c)));
    if (h < 0) continue;
    const head = rows[h].map(clean);
    const col = {
      name: head.indexOf('이름'),
      id: head.findIndex((c) => /아이디|^id$|온라인몰/i.test(c)),
      school: head.indexOf('학교'),
      grade: head.indexOf('학년'),
    };
    rows.slice(h + 1).forEach((r, k) => {
      const nm = clean(r[col.name]);
      const id = clean(r[col.id]);
      if (!nm && !id) return;
      out.push({
        line: `${name} ${h + k + 2}행`,
        name: nm,
        id,
        school: col.school >= 0 ? clean(r[col.school]) : '',
        grade: col.grade >= 0 ? clean(r[col.grade]) : '',
      });
    });
  }
  return out;
}

function deriveKey(name, id) {
  const buf = pbkdf2Sync(`${normName(name)}\u0000${normId(id)}`, MY_SALT, MY_ITERATIONS, 48, 'sha256');
  return { file: buf.subarray(0, 16).toString('hex'), key: buf.subarray(16, 48) };
}

function encrypt(key, data) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(data), 'utf8'), c.final(), c.getAuthTag()]);
  return { v: 1, iv: iv.toString('base64'), ct: ct.toString('base64') };
}

// measured: import-excel의 전체 측정 선수, 반환: 경고 목록·매칭 수. confirm일 때만 파일 기록
export function buildMyRecords({ measured, schools, schedule, measuredSchools, updatedAt, idsFile, confirm }) {
  const schoolsById = Object.fromEntries(schools.map((s) => [s.id, s]));
  const byName = Object.fromEntries(schools.map((s) => [s.name, s]));
  const warnings = [];

  // 교내 순위(전원)·전체 순위(55m)
  const order = (a, b) => a.m55 - b.m55 || (a.m27 ?? 99) - (b.m27 ?? 99) || (a.m5 ?? 99) - (b.m5 ?? 99) || a.seq - b.seq;
  const ranked = measured.filter((p) => p.m55 != null).sort(order);
  const overall = new Map();
  let prev = null;
  ranked.forEach((p, i) => {
    overall.set(p, p.m55 === prev?.m55 ? overall.get(prev) : i + 1);
    prev = p;
  });
  const schoolRank = new Map();
  for (const s of schools) {
    ranked.filter((p) => p.schoolId === s.id).forEach((p, i) => schoolRank.set(p, i + 1));
  }

  const ids = readIds(idsFile);
  const matched = new Map(); // 선수 → 아이디
  for (const r of ids) {
    if (!r.name || !r.id) {
      warnings.push(`${r.line}: 이름 또는 아이디 누락`);
      continue;
    }
    const school = r.school ? byName[r.school] : null;
    if (r.school && !school) {
      warnings.push(`${r.line}: 참가 학교 목록에 없는 학교 "${r.school}"`);
      continue;
    }
    let cands = measured.filter((p) => normName(p.name) === normName(r.name) && (!school || p.schoolId === school.id));
    if (cands.length > 1 && r.grade) cands = cands.filter((p) => p.grade === r.grade.replace(/학년/, ''));
    if (!cands.length) {
      warnings.push(`${r.line}: ${r.school || ''} ${r.name} — 측정 기록 없음 (아직 측정 전이면 정상)`);
      continue;
    }
    if (cands.length > 1) {
      warnings.push(`${r.line}: ${r.name} — 같은 이름이 여러 명 (학교·학년 열로 구분 필요)`);
      continue;
    }
    if (matched.has(cands[0])) warnings.push(`${r.line}: ${r.name} — 아이디가 두 번 등록됨 (나중 값 사용)`);
    matched.set(cands[0], r.id);
  }
  const noId = measured.filter((p) => !matched.has(p));

  if (confirm) {
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    const seen = new Set();
    for (const [p, id] of matched) {
      const { file, key } = deriveKey(p.name, id);
      if (seen.has(file)) {
        warnings.push(`${p.name}: 이름+아이디 조합 중복 — 건너뜀`);
        continue;
      }
      seen.add(file);
      const ms = measuredSchools.find((m) => m.schoolId === p.schoolId);
      const data = {
        name: p.name,
        school: schoolsById[p.schoolId].name,
        grade: p.grade,
        position: p.position,
        measuredAt: schedule[p.schoolId]?.date ?? null,
        measuredWeekday: schedule[p.schoolId]?.weekday ?? null,
        records: { split5: p.m5, split27: p.m27, sprint: p.m55, grip: ms?.gripMeasured ? p.grip : null },
        schoolRank: schoolRank.get(p) ?? null,
        schoolCount: ms?.measuredCount ?? null,
        overallRank: overall.get(p) ?? null,
        overallCount: ranked.length,
        updatedAt,
      };
      writeFileSync(join(OUT, `${file}.json`), JSON.stringify(encrypt(key, data)));
    }
    // 공개해도 되는 요약만 (선수 정보 없음)
    writeFileSync(join(OUT, 'index.json'), JSON.stringify({ updatedAt, count: seen.size, iterations: MY_ITERATIONS }));
  }

  return { idsCount: ids.length, matchedCount: matched.size, noIdCount: noId.length, warnings, idsFile: basename(idsFile) };
}
