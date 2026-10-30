# SPYDER BASEBALL COMBINE — 공식 웹사이트

고교 엘리트 야구 선수의 스프린트 측정 기록과 참가 학교 정보를 제공하는 반응형 웹사이트입니다.
요구사항 원문: [SPYDER_BASEBALL_COMBINE_PRD_v3.md](SPYDER_BASEBALL_COMBINE_PRD_v3.md)

- 스택: Vite + React + React Router (정적 사이트)
- 배포: Render Static Site — `main` 브랜치에 push하면 자동 재배포 (`render.yaml`)

## 새 PC(개인 노트북)에서 작업 시작하기

1. 이 파일을 내려받습니다: https://github.com/jeonjinu940-hash/spyder-baseball-combine/raw/main/scripts/setup-windows.ps1
2. PowerShell에서 실행: `powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\setup-windows.ps1"`
   → Git·Node.js·GitHub CLI 설치, GitHub 로그인, `바탕화면\컴바인`에 저장소 받기까지 자동으로 진행
3. Antigravity → File > Open Folder → `바탕화면\컴바인`. 에이전트 작업 규칙은 [AGENTS.md](AGENTS.md)에 있습니다.
4. 운영 기록 엑셀과 `현장 갤러리/` 원본은 저장소에 없으므로 USB·드라이브로 같은 폴더에 복사합니다.

## 로컬 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 확인
```

UI 확인용 가상 데이터는 주소 뒤에 `?demo=1`을 붙이면 **DEMO** 배너와 함께 표시되고, `?demo=0`으로 해제합니다.
DEMO 데이터는 `src/data/demo-players.json`에 분리되어 있으며 실제 기록과 섞이지 않습니다.

## 기록 업데이트 (운영 기록 엑셀 → 웹사이트)

운영팀의 일자별 기록 파일(예: `(SPYDER) 베이스볼컴바인 기록 (10.28).xlsx`)을 그대로 사용합니다.
**학교별 55M 직선 스프린트 상위 5명만** 공개 데이터로 저장되고, 나머지 선수 기록은 저장·공개하지 않습니다.

1. 기록 파일을 프로젝트 폴더(또는 `imports/`)에 넣습니다. 엑셀 파일은 git에 올라가지 않습니다 (연락처 등 포함).
2. 미리보기·검증
   ```bash
   npm run import -- "(SPYDER) 베이스볼컴바인 기록 (10.28).xlsx"
   ```
   - 읽는 범위: `전체 측정표` 시트(No.·학교·이름·학년·포지션·5m·27m·55m(fin)·1루·2루(fin)·악력)와 `SCHEDULE` 시트의 날짜·학교 칸만. 연락처 등 다른 칸은 읽지 않습니다.
   - 검증: 참가 학교 목록에 없는 학교, 이름 누락, 숫자가 아닌 기록, 0 이하 값. `-`는 미측정으로 처리합니다.
   - 학교별로 55m 기록이 빠른 순서대로 상위 5명을 고르고(동기록이면 27m → 5m 순), 5m·27m 구간 기록과 함께 저장합니다. 실시간 순위 탭은 이 공개 기록으로 자동 갱신됩니다.
   - 악력은 해당 학교에 악력 기록이 있을 때만 표시합니다 (덕수고 측정부터).
   - **오류가 하나라도 있으면 전체 반영을 중단하고 기존 데이터는 그대로 유지**합니다.
3. 반영
   ```bash
   npm run import -- "(SPYDER) 베이스볼컴바인 기록 (10.28).xlsx" --confirm
   ```
   `src/data/players.json`(공개 데이터)과 `src/data/import-history.json`(반영 이력)이 갱신됩니다.
   파일 이름의 `(10.28)`이 사이트의 "기록 업데이트" 날짜가 됩니다.
4. GitHub에 반영 → Render 배포
   ```bash
   git add -A
   git commit -m "기록 업데이트 (10.28)"
   git push
   ```
## 현장 갤러리 사진 추가

1. `현장 갤러리/` 아래에 **`월.일 학교명`** 형식으로 폴더를 만들고 사진을 넣습니다. 예: `현장 갤러리/10.28 전주고/`
   - 학교명은 `src/data/schools.json`의 학교명(예: 전주고)과 같아야 합니다.
   - 대표(표지) 사진을 지정하려면 파일 이름을 `cover…` 또는 `대표…`로 시작하게 바꿉니다. 없으면 파일명 순 첫 사진이 표지가 됩니다.
2. `npm run gallery` 실행 → 사진을 바른 방향으로 회전, 메타데이터(위치·기기 정보) 제거, 웹 크기로 줄여 `public/gallery/`에 저장하고 `src/data/gallery.json`을 갱신합니다.
3. 사이트에는 학교 1곳 = 1칸으로 표시되고, 커서를 올리면 `2026.10.28.` / `전주고등학교` 두 줄이 나타납니다.
4. `git add -A && git commit -m "갤러리 추가" && git push`

원본 폴더(`현장 갤러리/`)는 저장소에 올라가지 않습니다. 공개 동의·권한이 확인된 사진만 넣어 주세요.

## 그 밖의 데이터

| 파일 | 내용 |
|---|---|
| `src/data/schools.json` | 2026 시범 운영 참가 학교 20개 (지도·목록·지역 집계의 단일 출처) |
| `src/data/gallery.json` | 갤러리 사진 목록. 이미지는 `public/gallery/`에 저장. 공개 동의 확인된 사진만 추가 |
| `src/data/korea-map.json` | 시·도 SVG 경로 (`npm run build:map`으로 재생성) |
| `src/config.js` | 기록 단위·소수점, 공식 순위 사용 여부 |

## 미확정 정책 (PRD 13장)

다음 항목이 확정되기 전까지 사이트는 종목별 측정 기록(1인 1회)만 표시하고 **순위는 표시하지 않습니다.**
기록 공개 범위, 대표 기록 기준, 순위·동률 처리, 기록 단위/소수점, 학교 좌표 사용 여부, 사진 공개 승인 절차.

## 향후 확장: 관리자 CMS

현재는 정적 사이트 + 엑셀 변환 스크립트 방식입니다. 웹 관리자 화면(로그인·업로드·승인·이력)이 필요해지면
API 서버 + 관계형 DB(예: Render Web Service + PostgreSQL)를 추가하고, `scripts/import-excel.mjs`의 검증 로직을 서버로 옮겨 재사용합니다.
