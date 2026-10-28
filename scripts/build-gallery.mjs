// 현장 갤러리 폴더 → 웹용 이미지 + src/data/gallery.json
//
//   폴더 규칙:  현장 갤러리/<월.일 학교명>/사진들   예) 현장 갤러리/10.28 전주고/
//              (연도를 붙여도 됨: 2026.10.28 전주고)
//   대표 이미지: 파일명이 'cover' 또는 '대표'로 시작하면 그 사진, 없으면 파일명 순 첫 번째 사진
//   사용:       npm run gallery
//
// 사진은 EXIF 방향대로 회전한 뒤 메타데이터(촬영 위치·기기 정보 등)를 제거하고 웹 크기로 줄인다.
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(ROOT, '현장 갤러리');
const OUT = join(ROOT, 'public', 'gallery');
const DATA = join(ROOT, 'src', 'data', 'gallery.json');
const MANIFEST = join(ROOT, 'scripts', 'gallery-sources.json'); // 앨범별 순서 번호 ↔ 원본 파일명
const { season, schools } = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'schools.json'), 'utf8'));

const FULL_MAX = 1600; // 크게 보기
const THUMB_MAX = 800; // 목록 타일
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic']);

// 표시용 학교 정식 명칭: schools.json의 fullName, 없으면 '○○고' → '○○고등학교'
const fullSchoolName = (s) => s.fullName ?? s.name.replace(/고$/, '고등학교');

function parseFolder(name) {
  const m = name.trim().match(/^(?:(\d{4})[.\-/])?(\d{1,2})[.\-/](\d{1,2})\.?\s+(.+)$/);
  if (!m) return null;
  const [, y, mo, d, schoolText] = m;
  const school = schools.find((s) => s.name === schoolText.trim() || fullSchoolName(s) === schoolText.trim());
  return {
    year: y ?? season,
    month: mo.padStart(2, '0'),
    day: d.padStart(2, '0'),
    school,
    schoolText: schoolText.trim(),
  };
}

async function main() {
  if (!existsSync(SRC)) {
    console.log('현장 갤러리 폴더가 없습니다.');
    return;
  }
  const albums = [];
  const keep = new Set();
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  const nextManifest = {};

  for (const dir of readdirSync(SRC, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const info = parseFolder(dir.name);
    if (!info) {
      console.warn(`⚠ 폴더 이름 형식이 아님 (예: "10.28 전주고"): ${dir.name} — 건너뜀`);
      continue;
    }
    if (!info.school) {
      console.warn(`⚠ 참가 학교 목록에 없는 학교: "${info.schoolText}" (${dir.name}) — 건너뜀`);
      continue;
    }

    const files = readdirSync(join(SRC, dir.name))
      .filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()))
      // 확장자를 뺀 이름으로 정렬해야 'a.jpg'가 'a_01.jpg'보다 앞에 온다
      .sort((a, b) => basename(a, extname(a)).localeCompare(basename(b, extname(b)), 'en', { numeric: true }));
    const coverIdx = Math.max(0, files.findIndex((f) => /^(cover|대표)/i.test(f)));
    if (coverIdx > 0) files.unshift(...files.splice(coverIdx, 1));
    if (!files.length) continue;

    const id = `${info.year}${info.month}${info.day}-${info.school.id}`;
    const outDir = join(OUT, id);
    mkdirSync(outDir, { recursive: true });
    keep.add(id);

    const dateLabel = `${info.year}.${info.month}.${info.day}.`;
    const schoolName = fullSchoolName(info.school);
    const photos = [];

    // 순서 번호(01, 02…)별로 어떤 원본에서 만들었는지 기록 — 파일 순서를 바꾸면 해당 번호를 다시 만든다
    // (원본 파일명이 공개되지 않도록 public/ 밖에 저장)
    const prevSources = manifest[id] ?? {};
    const sources = {};
    // 사진 수가 줄었을 때 남는 이전 번호 파일 정리
    for (const f of readdirSync(outDir)) {
      const m = f.match(/^(\d+)(-thumb)?\.jpg$/);
      if (m && Number(m[1]) > files.length) rmSync(join(outDir, f));
    }

    for (const [i, f] of files.entries()) {
      const n = String(i + 1).padStart(2, '0');
      const src = join(SRC, dir.name, f);
      const full = join(outDir, `${n}.jpg`);
      const thumb = join(outDir, `${n}-thumb.jpg`);
      sources[n] = f;
      const fresh =
        prevSources[n] === f && existsSync(full) && existsSync(thumb) && statSync(full).mtimeMs >= statSync(src).mtimeMs;
      if (!fresh) {
        // rotate(): EXIF 방향 적용. sharp는 기본적으로 메타데이터를 출력에 포함하지 않음
        await sharp(src).rotate().resize(FULL_MAX, FULL_MAX, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(full);
        await sharp(src).rotate().resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 76, mozjpeg: true }).toFile(thumb);
      }
      const meta = await sharp(full).metadata();
      // 내용 기반 버전(?v=) — 같은 번호에 다른 사진이 들어가도 CDN·브라우저 캐시가 옛 사진을 보여주지 않도록
      const v = (p) => createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 8);
      photos.push({
        src: `/gallery/${id}/${n}.jpg?v=${v(full)}`,
        thumb: `/gallery/${id}/${n}-thumb.jpg?v=${v(thumb)}`,
        width: meta.width,
        height: meta.height,
        alt: `${dateLabel} ${schoolName} 측정 현장 사진 ${i + 1}`,
      });
    }

    nextManifest[id] = sources;

    albums.push({
      id,
      schoolId: info.school.id,
      schoolName,
      date: `${info.year}-${info.month}-${info.day}`,
      dateLabel,
      cover: photos[0],
      photos,
    });
    console.log(`✔ ${dir.name} → ${dateLabel} ${schoolName} (${photos.length}장)`);
  }

  // 원본 폴더가 사라진 앨범의 웹용 이미지는 정리
  if (existsSync(OUT)) {
    for (const e of readdirSync(OUT, { withFileTypes: true })) {
      if (e.isDirectory() && !keep.has(e.name)) rmSync(join(OUT, e.name), { recursive: true, force: true });
    }
  }

  writeFileSync(MANIFEST, JSON.stringify(nextManifest, null, 2) + '\n');

  albums.sort((a, b) => b.date.localeCompare(a.date) || a.schoolName.localeCompare(b.schoolName, 'ko'));
  writeFileSync(
    DATA,
    JSON.stringify(
      {
        note: '자동 생성 파일 — 직접 수정하지 말고 `현장 갤러리/` 폴더에 사진을 넣은 뒤 `npm run gallery` 실행. 공개 동의·권한이 확인된 사진만 넣을 것.',
        albums,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\ngallery.json: 앨범 ${albums.length}개 · 사진 ${albums.reduce((n, a) => n + a.photos.length, 0)}장`);
}

main();
