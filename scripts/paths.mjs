// 운영 자료(기록 엑셀·현장 갤러리 원본) 폴더 위치
// GitHub에 올리지 않는 자료라 PC마다 위치가 다를 수 있다. 우선순위:
//   1) 환경변수 COMBINE_DATA_DIR
//   2) 프로젝트 루트의 local.config.json → { "dataDir": "G:\\내 드라이브\\컴바인 자료" }  (git 제외)
//   3) 프로젝트 폴더 자체
// 구글 드라이브 데스크톱 앱으로 같은 폴더를 동기화하면 어느 PC에서든 같은 자료를 쓴다.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));

function configuredDir() {
  if (process.env.COMBINE_DATA_DIR) return process.env.COMBINE_DATA_DIR;
  const cfg = join(ROOT, 'local.config.json');
  if (existsSync(cfg)) {
    try {
      return JSON.parse(readFileSync(cfg, 'utf8').replace(/^\uFEFF/, '')).dataDir || null; // PowerShell이 붙이는 BOM 제거
    } catch {
      console.warn('⚠ local.config.json을 읽을 수 없어 프로젝트 폴더를 사용합니다.');
    }
  }
  return null;
}

const dir = configuredDir();
if (dir && !existsSync(dir)) console.warn(`⚠ 자료 폴더가 없습니다: ${dir} — 프로젝트 폴더를 사용합니다.`);

export const DATA_DIR = dir && existsSync(dir) ? resolve(dir) : ROOT;
