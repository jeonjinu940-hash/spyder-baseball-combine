# AGENTS.md — SPYDER BASEBALL COMBINE 웹사이트 작업 규칙

이 저장소에서 작업하는 AI 에이전트(Antigravity, Claude Code 등)는 아래 규칙을 따른다.
사용자는 한국어로 요청하며, 답변도 한국어로 한다.

## 프로젝트
- Vite + React 정적 사이트. 요구사항 원문: `SPYDER_BASEBALL_COMBINE_PRD_v3.md`
- 배포: GitHub `main` push → GitHub Action(`.github/workflows/render-deploy.yml`)이 Render Deploy Hook 호출 → https://spyder-baseball-combine.onrender.com
- 로컬 미리보기: `npm run dev` → http://localhost:5173

## 여러 PC에서 작업 (회사 PC·개인 노트북)
- 같은 GitHub 저장소를 여러 PC에서 쓴다. **작업 시작 전 항상 `git pull --rebase`**, 끝나면 바로 push해서 다른 PC와 어긋나지 않게 한다.
- push 충돌이 나면 `git pull --rebase` 후 다시 push. 사용자 파일을 덮어쓰거나 `--force` push 하지 않는다.
- 사용자는 GitHub 사이트에 직접 들어가지 않는다. 커밋·푸시·배포 확인은 에이전트가 한다.
- 운영 자료(기록 엑셀·현장 갤러리 원본)는 GitHub에 없고 **구글 드라이브 `컴바인 자료` 폴더**(PC마다 동기화)에 있다.
  경로는 `local.config.json`의 `dataDir`(PC별, git 제외)로 지정 — `scripts/paths.mjs` 참고. 없으면 프로젝트 폴더를 사용.

## 새 PC 첫 설정 (사용자가 "이 PC 세팅해줘"라고 하면)
1. PowerShell에서 `scripts/setup-windows.ps1` 실행 (아직 저장소가 없으면 아래로 받아서 실행):
   `Invoke-WebRequest https://github.com/jeonjinu940-hash/spyder-baseball-combine/raw/main/scripts/setup-windows.ps1 -OutFile $env:TEMP\combine-setup.ps1; powershell -ExecutionPolicy Bypass -File $env:TEMP\combine-setup.ps1`
2. GitHub 로그인 단계에서 터미널에 나오는 **일회용 코드**를 사용자에게 보여주고, 브라우저에서 승인하도록 안내한다 (PC당 1회).
3. 완료 후 사용자에게 Antigravity에서 `바탕화면\컴바인` 폴더를 열도록 안내한다.

## 모든 수정 요청 처리 순서 (필수)
0. `git pull --rebase`로 최신 상태 받기
1. 코드 수정 → `npm run build`로 빌드 성공 확인
2. **PRD 동기화:** `SPYDER_BASEBALL_COMBINE_PRD_v3.md`의 해당 섹션을 고치고, 맨 끝 `## 16. Change Log` 표 **맨 위**에 `| 날짜 | 구분 | 내용 | 관련 섹션 |` 행 추가
3. `git add -A` → `git commit` → `git push`
4. 배포 사이트에 반영됐는지 확인한 뒤, 사용자에게 **확인 링크**와 수정 내용 요약을 보낸다

## 기록 업데이트 ("기록 반영해줘")
- 사용자가 구글 드라이브 `컴바인 자료` 폴더(또는 프로젝트 폴더)에 `(SPYDER) 베이스볼컴바인 기록 (MM.DD).xlsx` 를 넣는다.
- `npm run import` (파일 생략 시 가장 최근 기록 파일 자동 선택) 또는 `npm run import -- "<파일명>"` 로 미리보기·검증 → 문제 없으면 `--confirm` 붙여 반영 → 빌드·커밋·푸시.
- 규칙(스크립트에 구현됨): 학교별 55m 상위 5명만 `players` 공개(동기록 27m→5m), 5m·27m·55m·악력(덕수고~) 저장,
  실시간 순위(`rankings`)는 전체 측정 선수 기준 종목별 TOP 15, 상위 5명 밖 선수는 `playerId: null`(상세 페이지 없음).
  측정일은 `SCHEDULE` 시트의 날짜·요일. 파일명의 `(MM.DD)`가 사이트 "기록 업데이트" 날짜.
- 검증 오류가 있으면 반영하지 말고 몇 행이 왜 틀렸는지 사용자에게 알린다.
- 학교 시트의 순위 표기와 55m 기록 순서가 다르면 55m 기록을 따르고 사용자에게 알린다.

## 나의 기록 보기 (선수 아이디 파일)
- 자료 폴더에 이름에 `아이디`가 들어간 `.xlsx`/`.csv`(열: 이름·아이디 필수, 학교·학년 권장)가 있으면 `npm run import`가 자동으로 함께 처리한다 (`--ids <파일>`로 지정 가능).
- 전체 측정 선수 개인 기록을 이름+아이디 키로 암호화해 `public/my/`에 생성 (`scripts/my-records.mjs` ↔ `src/lib/myRecords.js` 상수 일치 필수).
- 아이디 파일은 절대 커밋하지 않는다. 반영 결과의 매칭 실패·동명이인 경고는 사용자에게 알린다.
- 아이디 파일이 없으면 기존 `public/my/`를 그대로 둔다.

## 갤러리 업데이트 ("갤러리 반영해줘")
- 자료 폴더의 `현장 갤러리/<월.일 학교명>/` (예: `10.28 전주고`) 사진 → `npm run gallery` → 빌드·커밋·푸시.
- 이 PC에 원본이 없는 기존 앨범은 자동으로 유지된다. 앨범을 내릴 때만 `npm run gallery -- --remove <앨범ID>`.
- 사진 순서 = 폴더 파일명 순서, 첫 사진(또는 `cover`/`대표`로 시작하는 파일)이 대표 사진.

## 개인정보·보안 (절대 규칙)
- **운영 엑셀(.xlsx)과 `현장 갤러리/` 원본은 절대 커밋하지 않는다.** (SCHEDULE 시트에 감독·코치 연락처 포함) `.gitignore`가 막고 있지만 커밋 전 `git diff --cached --name-only`로 확인.
- 반영 후 `src/data/players.json`에 `010-` 같은 연락처 문자열이 없는지 확인.
- Render Deploy Hook URL은 파일·커밋에 적지 않는다 (GitHub Secret `RENDER_DEPLOY_HOOK_URL`에만 보관).
- 미성년 선수 사진은 공개 동의가 확인된 것만 게시.

## 디자인 규칙 (요약)
- 다크(#080808) + 어두운 레드 그라데이션(`--red-deep: #140507`), 서체는 전부 Pretendard.
- 탭: 홈 · 측정 종목 · 갤러리 · 참가 학교 · 선수 기록 · 실시간 순위 · 나의 기록 보기 (한글, 밑줄 없음).
- 섹션/탭 상단은 레드 그라데이션 배너(가운데 제목 + 한 줄 설명).
- 측정 횟수는 종목별 1인 1회. 기록은 소수점 3자리(초), 악력 1자리(kg). 미측정은 `—`.
